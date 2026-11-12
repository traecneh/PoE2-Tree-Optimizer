import {
  optimizeBuildGoals,
  type BuildGoalsOptimizeRequest,
  type BuildGoalsOptimizeResult,
} from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { buildGoalsValidationFailure, createBuildGoalsValidation } from "./buildGoalsValidation";
import type {
  BuildGoalsOptimizerWorkerRequest,
  BuildGoalsOptimizerWorkerResponse,
} from "./buildGoalsOptimizer.worker";

export type BuildGoalsOptimizationRun = {
  promise: Promise<BuildGoalsOptimizeResult>;
  cancel: () => void;
};

export type BuildGoalsOptimizationCallbacks = {
  onProgress?: (result: BuildGoalsOptimizeResult) => void;
};

let nextWorkerRequestId = 1;

export function runBuildGoalsOptimization(
  request: BuildGoalsOptimizeRequest,
  callbacks: BuildGoalsOptimizationCallbacks = {},
): BuildGoalsOptimizationRun {
  const validation = createBuildGoalsValidation(request);
  if (validation.issues.length) return { promise: Promise.resolve(buildGoalsValidationFailure(validation.issues)), cancel: () => undefined };
  const checkedResult = (result: BuildGoalsOptimizeResult) => {
    const issues = validation.validateResult(result, true);
    return issues.length ? buildGoalsValidationFailure(issues) : result;
  };
  const checkedCallbacks = { onProgress: (result: BuildGoalsOptimizeResult) => callbacks.onProgress?.(checkedResult(result)) };
  if (typeof Worker === "undefined") {
    const run = runInCurrentThread(request, checkedCallbacks);
    return { ...run, promise: run.promise.then(checkedResult) };
  }

  let worker: Worker;
  try {
    worker = new Worker(new URL("./buildGoalsOptimizer.worker.ts", import.meta.url), { type: "module" });
  } catch (error) {
    return { promise: Promise.resolve(buildGoalsValidationFailure([{ code: "worker-start", kind: "invalid", message: error instanceof Error ? error.message : "The optimizer worker could not start." }])), cancel: () => undefined };
  }
  const id = nextWorkerRequestId;
  nextWorkerRequestId += 1;
  let settled = false;
  let resolveRun: (result: BuildGoalsOptimizeResult) => void = () => undefined;

  const promise = new Promise<BuildGoalsOptimizeResult>((resolve) => {
    resolveRun = resolve;
    worker.onmessage = (event: MessageEvent<BuildGoalsOptimizerWorkerResponse>) => {
      if (settled || event.data?.id !== id) return;
      const result = event.data.type === "progress" || event.data.type === "complete"
        ? checkedResult(event.data.result)
        : buildGoalsValidationFailure([{ code: "worker-message", kind: "invalid", message: "The optimizer returned an unknown worker message." }]);
      if (result.status === "error") {
        settled = true;
        worker.terminate();
        resolve(result);
        return;
      }
      if (event.data.type === "progress") {
        callbacks.onProgress?.(result);
        return;
      }
      settled = true;
      worker.terminate();
      resolve(result);
    };
    worker.onerror = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({
        status: "error",
        addedNodeIds: [],
        addedEdgeKeys: [],
        totalNodeIds: [],
        totalEdgeKeys: [],
        orderedNodeIds: [],
        pointCost: 0,
        unreachableGoalNodeIds: [],
        message: event.message || "Build goal optimization failed.",
      });
    };
    try {
      worker.postMessage({ id, request: { ...request, treeFingerprint: validation.fingerprint } } satisfies BuildGoalsOptimizerWorkerRequest);
    } catch (error) {
      settled = true;
      worker.terminate();
      resolve(buildGoalsValidationFailure([{ code: "worker-request", kind: "invalid", message: error instanceof Error ? error.message : "The optimizer request could not be sent to its worker." }]));
    }
  });

  return {
    promise,
    cancel: () => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolveRun({ status: "cancelled", completeReason: "cancelled", addedNodeIds: [], addedEdgeKeys: [], totalNodeIds: [], totalEdgeKeys: [], orderedNodeIds: [], pointCost: 0, unreachableGoalNodeIds: [] });
    },
  };
}

function runInCurrentThread(
  request: BuildGoalsOptimizeRequest,
  callbacks: BuildGoalsOptimizationCallbacks,
): BuildGoalsOptimizationRun {
  let cancelled = false;

  return {
    promise: Promise.resolve().then(() => {
      if (cancelled) {
        return {
          status: "cancelled",
          addedNodeIds: [],
          addedEdgeKeys: [],
          totalNodeIds: [],
          totalEdgeKeys: [],
          orderedNodeIds: [],
          pointCost: 0,
          unreachableGoalNodeIds: [],
          message: "Build goal optimization was cancelled.",
        };
      }

      const result = request.mode === "weighted"
        ? optimizeWeightedBuildGoals(request, callbacks.onProgress, { maxIterations: 24 })
        : optimizeBuildGoals(request);
      callbacks.onProgress?.(result);
      return result;
    }),
    cancel: () => {
      cancelled = true;
    },
  };
}
