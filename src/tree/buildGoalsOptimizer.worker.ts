import { optimizeBuildGoalsAnytime, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";

export type BuildGoalsOptimizerWorkerRequest = {
  id: number;
  request: BuildGoalsOptimizeRequest;
};

export type BuildGoalsOptimizerWorkerResponse = {
  id: number;
  type: "progress" | "complete";
  result: BuildGoalsOptimizeResult;
};

self.onmessage = (event: MessageEvent<BuildGoalsOptimizerWorkerRequest>) => {
  const { id, request } = event.data;
  const result = optimizeBuildGoalsAnytime(request, (progress) => {
    self.postMessage({ id, type: "progress", result: progress } satisfies BuildGoalsOptimizerWorkerResponse);
  });
  self.postMessage({ id, type: "complete", result } satisfies BuildGoalsOptimizerWorkerResponse);
};
