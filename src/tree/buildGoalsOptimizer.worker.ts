import { type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { runOptimizerRequest } from "./weightedBuildGoalsOptimizer";

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
  const result = runOptimizerRequest(request, (progress) => {
    self.postMessage({ id, type: "progress", result: progress } satisfies BuildGoalsOptimizerWorkerResponse);
  });
  self.postMessage({ id, type: "complete", result } satisfies BuildGoalsOptimizerWorkerResponse);
};
