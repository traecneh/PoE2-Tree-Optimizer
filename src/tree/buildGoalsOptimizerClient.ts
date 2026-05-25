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

let nextWorkerRequestId = 1;

export function runBuildGoalsOptimization(request: BuildGoalsOptimizeRequest): BuildGoalsOptimizationRun {
  if (typeof Worker === "undefined") {
    return runInCurrentThread(request);
  }

  const worker = new Worker(new URL("./buildGoalsOptimizer.worker.ts", import.meta.url), { type: "module" });
  const id = nextWorkerRequestId;
  nextWorkerRequestId += 1;
  let settled = false;

  const promise = new Promise<BuildGoalsOptimizeResult>((resolve) => {
    worker.onmessage = (event: MessageEvent<BuildGoalsOptimizerWorkerResponse>) => {
      if (event.data.id !== id) return;
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

function runInCurrentThread(request: BuildGoalsOptimizeRequest): BuildGoalsOptimizationRun {
  let cancelled = false;

  return {
    promise: Promise.resolve().then(() => (
      cancelled
        ? {
          status: "cancelled",
          addedNodeIds: [],
          addedEdgeKeys: [],
          totalNodeIds: [],
          totalEdgeKeys: [],
          orderedNodeIds: [],
          pointCost: 0,
          unreachableGoalNodeIds: [],
          message: "Build goal optimization was cancelled.",
        }
        : optimizeBuildGoals(request)
    )),
    cancel: () => {
      cancelled = true;
    },
  };
}
