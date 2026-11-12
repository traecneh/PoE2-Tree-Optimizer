import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runValidation, validationSteps } from "./run.mjs";

const folders = [];
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });
describe("validation workflow", () => {
  it("keeps full tests, production build, graph validation and baseline checks in release", () => {
    const release = validationSteps("release");
    expect(release.map((s) => s.name)).toEqual(["Prepare graph", "Full test suite", "Typecheck", "Prepare images", "Production build", "Graph validation", "Coverage baseline"]);
    expect(release[1].args).toEqual(["node_modules/vitest/vitest.mjs", "run"]);
    expect(validationSteps("quick").some((s) => s.name === "Prepare images")).toBe(false);
    expect(validationSteps("quick")[1].args).toContain("src/tree/weightedBuildGoalsOptimizer.test.ts");
    expect(() => validationSteps("unknown")).toThrow("Usage");
  });
  it("stops at the first failure and records skipped steps without claiming success", async () => {
    const root = mkdtempSync(join(tmpdir(), "poe-validation-")); folders.push(root);
    const runStep = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    expect(await runValidation("release", { root, runStep })).toBe(2);
    expect(runStep).toHaveBeenCalledTimes(2);
    const result = JSON.parse(readFileSync(join(root, "var/validation/release.json"), "utf8"));
    expect(result.passed).toBe(false);
    expect(result.skipped).toContain("Production build");
    expect(result.results[1].exitCode).toBe(2);
  });
  it("records a successful complete quick run", async () => {
    const root = mkdtempSync(join(tmpdir(), "poe-validation-")); folders.push(root);
    const runStep = vi.fn().mockResolvedValue(0);
    expect(await runValidation("quick", { root, runStep })).toBe(0);
    expect(JSON.parse(readFileSync(join(root, "var/validation/quick.json"), "utf8"))).toMatchObject({ passed: true, skipped: [] });
  });
});
