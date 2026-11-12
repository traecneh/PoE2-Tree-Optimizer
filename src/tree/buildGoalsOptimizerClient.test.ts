import { afterEach, describe, expect, it, vi } from "vitest";
import { runBuildGoalsOptimization } from "./buildGoalsOptimizerClient";
import { optimizerTreeFingerprint } from "./buildGoalsValidation";
import { validationRequest, validationResult } from "./buildGoalsValidation.fixtures";
import type { BuildGoalsOptimizerWorkerResponse, BuildGoalsOptimizerWorkerRequest } from "./buildGoalsOptimizer.worker";

class FakeWorker {
  static latest: FakeWorker;
  onmessage?: (event: MessageEvent<BuildGoalsOptimizerWorkerResponse>) => void;
  onerror?: (event: ErrorEvent) => void;
  request?: BuildGoalsOptimizerWorkerRequest;
  terminate = vi.fn();
  constructor() { FakeWorker.latest = this; }
  postMessage(value: BuildGoalsOptimizerWorkerRequest) { this.request = value; }
  send(type: "progress" | "complete", result = { ...validationResult(), treeFingerprint: optimizerTreeFingerprint(validationRequest().graph) }) {
    this.onmessage?.({ data: { id: this.request!.id, type, result } } as MessageEvent<BuildGoalsOptimizerWorkerResponse>);
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("validated optimizer worker boundary", () => {
  it("rejects invalid requests before constructing a worker", async () => {
    const Worker = vi.fn(); vi.stubGlobal("Worker", Worker);
    const run = runBuildGoalsOptimization({ ...validationRequest(), goalNodeIds: ["missing"] });
    expect((await run.promise).status).toBe("error"); expect(Worker).not.toHaveBeenCalled();
  });
  it("checks progress and completion against the original request and tree snapshot", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const progress = vi.fn();
    const run = runBuildGoalsOptimization(validationRequest(), { onProgress: progress });
    const worker = FakeWorker.latest;
    expect(worker.request?.request.treeFingerprint).toBe(optimizerTreeFingerprint(validationRequest().graph));
    worker.send("progress"); expect(progress).toHaveBeenCalledTimes(1);
    worker.send("complete"); expect((await run.promise).status).toBe("success");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it.each(["progress", "complete"] as const)("blocks a malformed %s route without leaking it to preview", async (type) => {
    vi.stubGlobal("Worker", FakeWorker);
    const progress = vi.fn(); const run = runBuildGoalsOptimization(validationRequest(), { onProgress: progress });
    const worker = FakeWorker.latest;
    worker.send(type, { ...validationResult(), pointCost: 1, treeFingerprint: optimizerTreeFingerprint(validationRequest().graph) });
    expect((await run.promise).validationIssues).toContainEqual(expect.objectContaining({ code: "point-count" }));
    expect(progress).not.toHaveBeenCalled(); expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it("rejects stale snapshot results", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const run = runBuildGoalsOptimization(validationRequest());
    FakeWorker.latest.send("complete", { ...validationResult(), treeFingerprint: "old-patch" });
    expect((await run.promise).validationIssues).toContainEqual(expect.objectContaining({ code: "stale-result" }));
  });
  it("settles cancellation and ignores late worker messages", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const progress = vi.fn(); const run = runBuildGoalsOptimization(validationRequest(), { onProgress: progress });
    const worker = FakeWorker.latest;
    run.cancel(); expect((await run.promise).status).toBe("cancelled");
    worker.send("progress"); worker.send("complete");
    expect(progress).not.toHaveBeenCalled(); expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it("also validates the no-Worker fallback", async () => {
    vi.stubGlobal("Worker", undefined);
    const result = await runBuildGoalsOptimization(validationRequest()).promise;
    expect(result).toMatchObject({ status: "success", pointCost: 2, treeFingerprint: optimizerTreeFingerprint(validationRequest().graph) });
  });
  it("reports worker startup failure without throwing into the UI", async () => {
    vi.stubGlobal("Worker", class { constructor() { throw new Error("Worker blocked"); } });
    expect(await runBuildGoalsOptimization(validationRequest()).promise).toMatchObject({ status: "error", message: "Worker blocked" });
  });
  it("settles a worker serialization failure as an error result", async () => {
    vi.stubGlobal("Worker", class extends FakeWorker { postMessage() { throw new Error("Uncloneable request"); } });
    expect(await runBuildGoalsOptimization(validationRequest()).promise).toMatchObject({ status: "error", message: "Uncloneable request" });
    expect(FakeWorker.latest.terminate).toHaveBeenCalledTimes(1);
  });
});
