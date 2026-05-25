import { optimizeBuildGoals, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";

export type BuildGoalsOptimizerWorkerRequest = {
  id: number;
  request: BuildGoalsOptimizeRequest;
};

export type BuildGoalsOptimizerWorkerResponse = {
  id: number;
  result: BuildGoalsOptimizeResult;
};

self.onmessage = (event: MessageEvent<BuildGoalsOptimizerWorkerRequest>) => {
  const { id, request } = event.data;
  const result = optimizeBuildGoals(request);
  self.postMessage({ id, result } satisfies BuildGoalsOptimizerWorkerResponse);
};
