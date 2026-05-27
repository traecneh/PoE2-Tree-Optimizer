import {
  optimizeBuildGoals,
  type BuildGoalsOptimizeRequest,
  type BuildGoalsOptimizeResult,
} from "./buildGoalsOptimizer";
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
  if (typeof Worker === "undefined") {
    return runInCurrentThread(request, callbacks);
  }

  const worker = new Worker(new URL("./buildGoalsOptimizer.worker.ts", import.meta.url), { type: "module" });
  const id = nextWorkerRequestId;
  nextWorkerRequestId += 1;
  let settled = false;

  const promise = new Promise<BuildGoalsOptimizeResult>((resolve) => {
    worker.onmessage = (event: MessageEvent<BuildGoalsOptimizerWorkerResponse>) => {
      if (event.data.id !== id) return;
      if (event.data.type === "progress") {
        callbacks.onProgress?.(event.data.result);
        return;
      }
      settled = true;
      worker.terminate();
      resolve(event.data.result);
    };
    worker.onerror = (event) => {
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
    worker.postMessage({ id, request } satisfies BuildGoalsOptimizerWorkerRequest);
  });

  return {
    promise,
    cancel: () => {
      if (settled) return;
      settled = true;
      worker.terminate();
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

      const result = optimizeBuildGoals(request);
      callbacks.onProgress?.(result);
      return result;
    }),
    cancel: () => {
      cancelled = true;
    },
  };
}
