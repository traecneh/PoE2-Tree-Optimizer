import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { executeAuditCommand, formatAuditSummary, runAuditWorkflow } from "./run_audit.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const put = (path, value) => writeFileSync(path, typeof value === "string" ? value : JSON.stringify(value));
async function fixture(run) {
  const parent = resolve("var"); mkdirSync(parent, { recursive: true });
  const folder = mkdtempSync(join(parent, "workflow-test-"));
  try {
    const root = join(folder, "workspace with spaces");
    mkdirSync(join(root, "data"), { recursive: true }); mkdirSync(join(root, "var/runtime"), { recursive: true });
    put(join(root, "data/tree-graph.json"), { fixture: true });
    put(join(root, "var/runtime/.pob-evaluation-runtime.json"), { kind: "isolated-pob-evaluation-copy" });
    const code = join(folder, "build & code.txt"), requirements = join(folder, "policy file.json");
    put(code, "captured public code fixture"); put(requirements, { version: 1, name: "Fixture", requiredNodeIds: [], minimums: [] });
    await run({ root, folder, options: { code, requirements, runtime: join(root, "var/runtime"), output: join(root, "var/run") } });
  } finally {
    const inside = relative(parent, resolve(folder));
    assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
    rmSync(folder, { recursive: true, force: true });
  }
}

// Controlled child outputs test orchestration, not PoB calculations. Real builds are audited separately.
function fakeExecutor({ failAt, noEligible = false, verificationGap, afterStep, alterComparison } = {}) {
  const calls = [];
  const execute = async (step) => {
    calls.push(step.id);
    const directory = dirname(dirname(step.stdoutPath));
    const job = join(directory, step.id.startsWith("baseline") ? "baseline" : "routes");
    mkdirSync(job, { recursive: true });
    put(step.stdoutPath, "Controlled child output"); put(step.stderrPath, failAt === step.id ? "Intentional failure" : "");
    if (step.id === failAt) return { exitCode: 7 };
    let exitCode = 0;
    if (["baseline-prepare", "generate"].includes(step.id)) {
      put(join(job, "source-build.xml"), "Captured source fixture");
      put(join(job, "audit-input.json"), { generation: { phase: step.id === "generate" ? "coverage_constrained" : "baseline_only" } });
    } else if (step.id.endsWith("-evaluate")) put(join(job, "real-build-results.json"), { engineVersion: "fixture" });
    else if (step.id.endsWith("-verify")) {
      const checks = [{ name: "Native fixture arithmetic", passed: verificationGap !== "arithmetic", category: "integrity" }];
      if (verificationGap === "requirements") { checks.push({ name: "Original attribute shortfall", passed: false, category: "requirement" }); exitCode = 1; }
      put(join(job, "real-build-verification.json"), { integrityPassed: true, checkCount: checks.length, checks,
        effectCoverage: { evidenceComplete: verificationGap !== "coverage", status: "warnings", findings: [], checks: [{ name: "Native coverage", passed: verificationGap !== "coverage" }] } });
    } else if (step.id === "compare") {
      const report = { status: noEligible ? "no_eligible_candidates" : "evaluated", auditVerification: { passed: true },
        runtimeEffectCoverage: { evidenceComplete: true, findings: [{ code: "unparsed_effect" }] }, passiveEffectPolicy: { evaluated: true },
        rankingStatus: noEligible ? "not_ranked" : "provisional", rankingWarning: "Known parser gaps remain.",
        ranking: noEligible ? [] : ["Candidate", "Original"], bestEligibleLabel: noEligible ? null : "Candidate", eligibleCount: noEligible ? 0 : 2,
        candidates: [{ label: "Original", pointCost: 2, pointChange: 0, decision: noEligible ? "rejected" : "eligible", failures: [] },
          { label: "Candidate", pointCost: 1, pointChange: -1, decision: noEligible ? "rejected" : "eligible",
            failures: noEligible ? [{ label: "W2: Recovery minimum", actual: 90, minimum: 100 }] : [] }],
        provenance: { sourceXmlSha256: hash(readFileSync(join(job, "source-build.xml"))), auditInputSha256: hash(readFileSync(join(job, "audit-input.json"))),
          resultSha256: hash(readFileSync(join(job, "real-build-results.json"))), policySha256: hash(readFileSync(join(directory, "inputs/requirements.json"))) } };
      alterComparison?.(report);
      put(join(job, "workflow.requirements-report.json"), report);
      exitCode = noEligible ? 2 : 0;
    }
    await afterStep?.(step, directory);
    return { exitCode };
  };
  return { execute, calls };
}

test("one command sequences all seven steps and reports a provisional result with preserved snapshots", async () => fixture(async ({ root, options }) => {
  const fake = fakeExecutor(); const before = readFileSync(options.code, "utf8");
  const { run, exitCode } = await runAuditWorkflow(options, { root, execute: fake.execute });
  assert.equal(exitCode, 0); assert.equal(run.status, "completed");
  assert.deepEqual(fake.calls, ["baseline-prepare", "baseline-evaluate", "baseline-verify", "generate", "routes-evaluate", "routes-verify", "compare"]);
  assert.ok(run.steps.every((step) => step.status === "succeeded"));
  assert.equal(run.comparison.pointsSaved, 1); assert.equal(run.comparison.rankingStatus, "provisional");
  assert.equal(readFileSync(join(run.directory, "inputs/build-code.txt"), "utf8"), before);
  assert.equal(readFileSync(options.code, "utf8"), before);
  assert.equal(JSON.parse(readFileSync(join(run.directory, "workflow.json"))).status, "completed");
  assert.match(readFileSync(join(run.directory, "summary.txt"), "utf8"), /1 saved/);
}));

test("each failed phase stops later execution and never reports a previous winner", async () => fixture(async ({ root, options }) => {
  for (const failAt of ["baseline-prepare", "baseline-evaluate", "baseline-verify", "generate", "routes-evaluate", "routes-verify", "compare"]) {
    const fake = fakeExecutor({ failAt });
    const { run, exitCode } = await runAuditWorkflow({ ...options, output: `${options.output}-${failAt}` }, { root, execute: fake.execute });
    assert.equal(exitCode, 1); assert.equal(run.status, "failed"); assert.equal(run.comparison, null);
    assert.equal(fake.calls.at(-1), failAt);
    assert.equal(run.steps.find((step) => step.id === failAt).status, "failed");
    assert.match(formatAuditSummary(run), /No usable ranking or winner/);
  }
}));

test("structured preflight blockers appear in the failure summary", async () => fixture(async ({ root, options }) => {
  const fake = fakeExecutor();
  const execute = async (step) => {
    if (step.id !== "baseline-prepare") return fake.execute(step);
    const baseline = join(dirname(dirname(step.stdoutPath)), "baseline"); mkdirSync(baseline);
    put(join(baseline, "import-preflight.json"), { findings: [{ severity: "blocker", message: "From Nothing allocation is unsupported.", action: "Review disconnected passives." }] });
    return { exitCode: 1 };
  };
  const { run } = await runAuditWorkflow(options, { root, execute });
  assert.equal(run.status, "failed");
  assert.match(formatAuditSummary(run), /From Nothing allocation is unsupported/);
  assert.match(formatAuditSummary(run), /Review disconnected passives/);
}));

test("no eligible candidates is a completed comparison, not an execution failure", async () => fixture(async ({ root, options }) => {
  const { run, exitCode } = await runAuditWorkflow(options, { root, execute: fakeExecutor({ noEligible: true }).execute });
  assert.equal(exitCode, 2); assert.equal(run.status, "completed_no_eligible");
  assert.equal(run.comparison.bestEligibleLabel, null);
  assert.match(formatAuditSummary(run), /Recovery minimum; actual=90, minimum=100/);
}));

test("inconsistent comparison evidence or provenance cannot produce a winner", async () => fixture(async ({ root, options }) => {
  for (const [index, change] of [
    (report) => report.provenance.policySha256 = "other", (report) => report.auditVerification.passed = false,
    (report) => report.ranking = ["Unknown"], (report) => report.rankingStatus = "fully_verified",
  ].entries()) {
    const { run } = await runAuditWorkflow({ ...options, output: `${options.output}-${index}` }, { root, execute: fakeExecutor({ alterComparison: change }).execute });
    assert.equal(run.status, "failed"); assert.equal(run.comparison, null);
  }
}));

test("verifier flags cannot conceal failed arithmetic or missing coverage checks", async () => fixture(async ({ root, options }) => {
  for (const verificationGap of ["arithmetic", "coverage"]) {
    const fake = fakeExecutor({ verificationGap });
    const { run } = await runAuditWorkflow({ ...options, output: `${options.output}-${verificationGap}` }, { root, execute: fake.execute });
    assert.equal(run.status, "failed"); assert.equal(fake.calls.at(-1), "baseline-verify");
  }
}));

test("deferred requirement failures remain for comparison rather than invalidating intact arithmetic", async () => fixture(async ({ root, options }) => {
  const { run } = await runAuditWorkflow(options, { root, execute: fakeExecutor({ verificationGap: "requirements" }).execute });
  assert.equal(run.status, "completed");
  assert.deepEqual(run.steps[2].verification.deferredRequirements, ["Original attribute shortfall"]);
}));

test("cancellation stops the active phase and suppresses ranking", async () => fixture(async ({ root, options }) => {
  const controller = new AbortController();
  const fake = fakeExecutor({ afterStep: (step) => { if (step.id === "baseline-evaluate") controller.abort(); } });
  const { run, exitCode } = await runAuditWorkflow({ ...options, signal: controller.signal }, { root, execute: fake.execute });
  assert.equal(exitCode, 130); assert.equal(run.status, "cancelled"); assert.equal(run.comparison, null);
  assert.equal(fake.calls.at(-1), "baseline-evaluate");
}));

test("mutated captured inputs or graph invalidate the run without changing user originals", async () => fixture(async ({ root, options }) => {
  for (const target of ["inputs/requirements.json", "graph"]) {
    const graphPath = join(root, "data/tree-graph.json"); put(graphPath, { fixture: true });
    const fake = fakeExecutor({ afterStep: (step, dir) => { if (step.id === "generate") put(target === "graph" ? graphPath : join(dir, target), "changed"); } });
    const { run } = await runAuditWorkflow({ ...options, output: `${options.output}-${target === "graph" ? "graph" : "input"}` }, { root, execute: fake.execute });
    assert.equal(run.status, "failed"); assert.equal(run.comparison, null);
    assert.equal(JSON.parse(readFileSync(options.requirements)).name, "Fixture");
  }
}));

test("existing runs, escaping paths and runtime-alias outputs are refused without overwrite", async () => fixture(async ({ root, options, folder }) => {
  mkdirSync(options.output); put(join(options.output, "workflow.json"), "original evidence");
  await assert.rejects(runAuditWorkflow(options, { root }), /already exists/);
  assert.equal(readFileSync(join(options.output, "workflow.json"), "utf8"), "original evidence");
  await assert.rejects(runAuditWorkflow({ ...options, output: join(folder, "outside") }, { root }), /subdirectories/);
  const alias = join(root, "var/runtime-alias");
  symlinkSync(options.runtime, alias, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(runAuditWorkflow({ ...options, output: join(alias, "nested-run") }, { root }), /separate from the runtime/);
  assert.equal(existsSync(join(options.runtime, "nested-run")), false);
}));

test("default run names are unique and fresh", async () => fixture(async ({ root, options }) => {
  const first = await runAuditWorkflow({ ...options, output: undefined }, { root, execute: fakeExecutor().execute });
  const second = await runAuditWorkflow({ ...options, output: undefined }, { root, execute: fakeExecutor().execute });
  assert.notEqual(first.run.directory, second.run.directory);
  assert.equal(first.run.status, "completed"); assert.equal(second.run.status, "completed");
}));

test("real child execution preserves literal arguments, logs spawn errors and waits for cancellation", async () => fixture(async ({ root, folder }) => {
  const arg = "spaces & ; literal argument";
  const command = { command: process.execPath, args: ["-e", "process.stdout.write(process.argv[1]); process.stderr.write('stderr fixture');", arg], cwd: root,
    stdoutPath: join(folder, "out.log"), stderrPath: join(folder, "err.log") };
  const result = await executeAuditCommand(command);
  assert.equal(result.exitCode, 0); assert.equal(readFileSync(command.stdoutPath, "utf8"), arg);
  assert.equal(readFileSync(command.stderrPath, "utf8"), "stderr fixture");
  const missing = await executeAuditCommand({ ...command, command: join(folder, "missing-executable"), stdoutPath: join(folder, "missing.out"), stderrPath: join(folder, "missing.err") });
  assert.match(missing.error, /ENOENT/);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100);
  try {
    const stopped = await executeAuditCommand({ ...command, args: ["-e", "setInterval(() => {}, 1000)"], stdoutPath: join(folder, "cancel.out"), stderrPath: join(folder, "cancel.err"), signal: controller.signal });
    assert.equal(controller.signal.aborted, true); assert.notEqual(stopped.exitCode, 0);
  } finally { clearTimeout(timer); }
}));
