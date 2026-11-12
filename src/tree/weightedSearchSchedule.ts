export type WeightedRefinement = Generator<void, void, unknown>;

// Greedy work earns refinement time: roughly two thirds fast restarts, one third
// deeper work while jobs are pending. One graph-search unit can overrun a slice.
export class WeightedSearchSchedule {
  private jobs: WeightedRefinement[] = [];
  private credit = 0;

  constructor(private deterministic = false, private clock = () => performance.now()) {}

  enqueue(job: WeightedRefinement) { this.jobs.push(job); }

  recordFastTurn(elapsedMs: number) {
    this.credit = Math.min(this.deterministic ? 64 : 32,
      this.credit + (this.deterministic ? 16 : Math.max(0, elapsedMs) / 2));
  }

  advance(shouldStop: () => boolean): number {
    const started = this.clock();
    let steps = 0;
    while (this.jobs.length && this.credit > 0 && !shouldStop()
      && steps < 64 && (this.deterministic || this.clock() - started < 16)) {
      const job = this.jobs.shift()!;
      const before = this.clock();
      const next = job.next();
      this.credit -= this.deterministic ? 1 : Math.max(0.1, this.clock() - before);
      steps += 1;
      if (!next.done) this.jobs.push(job);
    }
    return steps;
  }
}
