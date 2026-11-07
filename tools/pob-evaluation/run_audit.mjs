import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const workspace = fileURLToPath(new URL("../../", import.meta.url));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const inside = (parent, path) => { const part = relative(parent, path); return part && !part.startsWith("..") && !isAbsolute(part); };
const requireTrue = (condition, message) => { if (!condition) throw new Error(message); };

function phaseFailureDetails(directory, step) {
  const job = join(directory, step.id.startsWith("baseline") ? "baseline" : "routes");
  const read = (name) => { try { return readJson(join(job, name)); } catch { return undefined; } };
  const preflight = read("import-preflight.json");
  const blockers = Array.isArray(preflight?.findings) ? preflight.findings.filter((finding) => finding?.severity === "blocker") : [];
  if (blockers?.length) return blockers.map((finding) => `${finding.message}${finding.action ? ` ${finding.action}` : ""}`);
  if (step.id.endsWith("-verify")) {
    const report = read("real-build-verification.json");
    const checks = [...(Array.isArray(report?.checks) ? report.checks : []), ...(Array.isArray(report?.effectCoverage?.checks) ? report.effectCoverage.checks : [])];
    return [...new Set(checks.filter((check) => check?.passed === false && typeof check.name === "string").map((check) => check.name))];
  }
  const comparison = step.id === "compare" ? read("workflow.requirements-report.json") : undefined;
  const preparation = read("generation-preflight.json");
  return comparison?.error ? [comparison.error] : preparation?.status === "blocked" && preparation.message ? [preparation.message] : [];
}

function ensureVarPath(root, path) {
  const parent = join(root, "var");
  requireTrue(inside(parent, path), "Runtime and output must be subdirectories of this workspace's var folder.");
  let ancestor = path;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const actualVar = realpathSync(parent), actual = realpathSync(ancestor);
  requireTrue(inside(realpathSync(root), actualVar), "The var folder resolves outside the workspace.");
  requireTrue(actual === actualVar || inside(actualVar, actual), "A var path resolves outside the workspace through a link.");
  return resolve(actual, relative(ancestor, path));
}

export function executeAuditCommand({ command, args, cwd, stdoutPath, stderrPath, signal }) {
  return new Promise((resolveResult) => {
    const stdout = openSync(stdoutPath, "wx");
    let stderr;
    try { stderr = openSync(stderrPath, "wx"); }
    catch (error) { closeSync(stdout); resolveResult({ exitCode: null, error: error.message }); return; }
    let child;
    try { child = spawn(command, args, { cwd, shell: false, windowsHide: true, stdio: ["ignore", stdout, stderr], env: { ...process.env, PYTHONUTF8: "1" } }); }
    catch (error) { closeSync(stdout); closeSync(stderr); resolveResult({ exitCode: null, error: error.message }); return; }
    closeSync(stdout); closeSync(stderr);
    let error;
    const cancel = () => child.kill();
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    child.once("error", (failure) => { error = failure.message; });
    child.once("close", (exitCode, exitSignal) => {
      signal?.removeEventListener("abort", cancel);
      resolveResult({ exitCode, signal: exitSignal, ...(error ? { error } : {}) });
    });
  });
}

function verifiedReport(path) {
  const report = readJson(path);
  const checks = report.checks?.filter((check) => check.category !== "requirement");
  requireTrue(report.integrityPassed === true && Array.isArray(checks) && checks.length > 0
    && report.checkCount === report.checks.length && checks.every((check) => check.passed === true), "Arithmetic/state verification failed or is incomplete.");
  requireTrue(report.effectCoverage?.evidenceComplete === true && Array.isArray(report.effectCoverage.checks)
    && report.effectCoverage.checks.length > 0 && report.effectCoverage.checks.every((check) => check.passed === true), "Runtime coverage evidence failed or is incomplete.");
  return { arithmeticChecks: report.checkCount, coverageStatus: report.effectCoverage.status,
    coverageWarningCount: report.effectCoverage.findings?.length ?? 0,
    deferredRequirements: report.checks.filter((check) => check.category === "requirement" && !check.passed).map((check) => check.name) };
}

function comparisonSummary(report, job, policyHash) {
  requireTrue(["evaluated", "no_eligible_candidates"].includes(report.status), `Comparison did not complete: ${report.status ?? "missing status"}.`);
  requireTrue(report.auditVerification?.passed === true && report.runtimeEffectCoverage?.evidenceComplete === true
    && report.passiveEffectPolicy?.evaluated === true, "Comparison lacks verified audit, coverage or preservation evidence.");
  requireTrue(Array.isArray(report.candidates) && report.candidates.length > 0 && Array.isArray(report.ranking), "Comparison candidates/ranking are missing.");
  const eligible = report.candidates.filter((candidate) => candidate.decision === "eligible");
  requireTrue(Array.isArray(report.runtimeEffectCoverage.findings)
    && (eligible.length ? ["provisional", "scoped"].includes(report.rankingStatus) : report.rankingStatus === "not_ranked"), "Comparison confidence status is missing or inconsistent.");
  requireTrue(new Set(report.candidates.map((candidate) => candidate.label)).size === report.candidates.length
    && new Set(report.ranking).size === report.ranking.length && report.ranking.length === eligible.length
    && eligible.every((candidate) => report.ranking.includes(candidate.label)) && report.eligibleCount === eligible.length,
  "Comparison ranking and eligibility do not agree.");
  requireTrue(report.bestEligibleLabel === (report.ranking[0] ?? null)
    && (report.status === "evaluated") === (eligible.length > 0), "Comparison winner/status are inconsistent.");
  for (const [file, field] of [["source-build.xml", "sourceXmlSha256"], ["audit-input.json", "auditInputSha256"], ["real-build-results.json", "resultSha256"]]) {
    requireTrue(report.provenance?.[field] === hash(readFileSync(join(job, file))), `Comparison provenance differs: ${file}.`);
  }
  requireTrue(report.provenance.policySha256 === policyHash, "Comparison did not use the captured policy.");
  const original = report.candidates.find((candidate) => candidate.label === "Original");
  const best = report.candidates.find((candidate) => candidate.label === report.bestEligibleLabel);
  requireTrue(original && report.candidates.every((candidate) => Number.isSafeInteger(candidate.pointCost) && candidate.pointCost >= 0
    && ["eligible", "rejected"].includes(candidate.decision) && Array.isArray(candidate.failures)), "Comparison candidate details are incomplete.");
  return { status: report.status, rankingStatus: report.rankingStatus, rankingWarning: report.rankingWarning,
    ranking: report.ranking, bestEligibleLabel: report.bestEligibleLabel, originalPoints: original.pointCost,
    bestEligiblePoints: best?.pointCost ?? null, pointsSaved: best ? original.pointCost - best.pointCost : null,
    candidateCount: report.candidates.length, eligibleCount: eligible.length,
    candidates: report.candidates.map(({ label, pointCost, pointChange, decision, failures, performanceConfidence }) => ({ label, pointCost, pointChange, decision, failures, performanceConfidence })),
    coverageWarningCount: report.runtimeEffectCoverage.findings.length,
    scope: "Fewest shared points among tested eligible candidates, not a global optimum or full in-game validation." };
}

export function formatAuditSummary(run) {
  const lines = ["PoB Protected Route Audit", `Status: ${run.status}`, `Run: ${run.directory}`, ""];
  for (const step of run.steps) {
    lines.push(`${step.status.padEnd(10)} ${step.label}${step.error ? `: ${step.error}` : ""}`);
    for (const detail of step.failureDetails ?? []) lines.push(`  ${detail}`);
  }
  if (run.comparison) {
    const result = run.comparison;
    lines.push("", `Ranking: ${result.rankingStatus}`, result.rankingWarning, `Original: ${result.originalPoints} shared points`);
    if (result.bestEligibleLabel) lines.push(`Best tested eligible: ${result.bestEligibleLabel}, ${result.bestEligiblePoints} shared points (${result.pointsSaved} saved)`);
    else lines.push("No candidate met the selected requirements; no winner.");
    for (const candidate of result.candidates) {
      lines.push("", `${candidate.label}: ${candidate.pointCost} shared points, ${candidate.decision}`);
      for (const failure of candidate.failures) lines.push(`  ${failure.label}; actual=${JSON.stringify(failure.actual)}, minimum=${JSON.stringify(failure.minimum)}`);
    }
    lines.push("", `${result.coverageWarningCount} parser-gap records across evaluated route/set contexts. See the full comparison for effect text.`, result.scope);
  } else {
    lines.push("", "No usable ranking or winner is reported for this run.");
    if (run.error) lines.push(run.error);
  }
  lines.push("", "Details: workflow.json; full comparison (when produced): routes/workflow.requirements-report.json; per-step output: logs/", "");
  return lines.join("\n");
}

export async function runAuditWorkflow(options, { execute = executeAuditCommand, root = workspace, onProgress = () => {} } = {}) {
  root = resolve(root);
  requireTrue(["ci-mana", "life-armour"].includes(options.profile ?? "ci-mana"), "Unknown audit profile.");
  requireTrue(["Strength", "Dexterity", "Intelligence"].includes(options.attribute ?? "Intelligence"), "Unknown travel attribute choice.");
  requireTrue(options.code && options.runtime && options.requirements, "Provide --code, --runtime and --requirements.");
  requireTrue(!options.protectedNodeIds || /^\d+(,\d+)*$/.test(options.protectedNodeIds), "Protected node IDs must be comma-separated integers.");
  const codePath = resolve(options.code), policyPath = resolve(options.requirements), runtime = resolve(options.runtime);
  requireTrue(lstatSync(codePath).isFile() && lstatSync(policyPath).isFile(), "Code and policy must be regular files.");
  const code = readFileSync(codePath), policy = readFileSync(policyPath);
  JSON.parse(policy.toString("utf8"));
  mkdirSync(join(root, "var"), { recursive: true });
  const actualRuntime = ensureVarPath(root, runtime);
  requireTrue(readJson(join(runtime, ".pob-evaluation-runtime.json")).kind === "isolated-pob-evaluation-copy"
    && !existsSync(join(runtime, "installed.cfg")), "Use a marked isolated PoB runtime, not an installation.");
  const directory = resolve(options.output ?? join(root, "var/pob-audit-runs", `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`));
  const actualDirectory = ensureVarPath(root, directory);
  requireTrue(!existsSync(directory), "The output directory already exists; use a fresh run directory.");
  requireTrue(actualRuntime !== actualDirectory && !inside(actualRuntime, actualDirectory) && !inside(actualDirectory, actualRuntime), "Run output must be separate from the runtime.");
  const graphPath = join(root, "data/tree-graph.json"), graphHash = hash(readFileSync(graphPath));
  mkdirSync(dirname(directory), { recursive: true });
  ensureVarPath(root, directory);
  mkdirSync(directory);
  mkdirSync(join(directory, "inputs")); mkdirSync(join(directory, "logs"));
  const capturedCode = join(directory, "inputs/build-code.txt"), capturedPolicy = join(directory, "inputs/requirements.json");
  writeFileSync(capturedCode, code, { flag: "wx" }); writeFileSync(capturedPolicy, policy, { flag: "wx" });
  const baseline = join(directory, "baseline"), routes = join(directory, "routes");
  const tools = join(root, "tools/pob-evaluation");
  const profile = options.profile ?? "ci-mana", attribute = options.attribute ?? "Intelligence";
  const python = options.python && /[/\\]/.test(options.python) ? resolve(options.python) : options.python ?? "python";
  const prepare = (job) => [join(root, "node_modules/tsx/dist/cli.mjs"), join(tools, "prepare_real_audit.ts"), capturedCode, job, options.sourceUrl ?? "Local captured PoB export",
    ...(options.protectedNodeIds ? [options.protectedNodeIds] : []), "--profile", profile, "--attribute", attribute];
  const evaluate = (job) => [join(tools, "run_headless.py"), runtime, "--driver", join(tools, "evaluate_real_build.lua"), "--job", job];
  const plan = [
    { id: "baseline-prepare", phase: "baseline", label: "Capture unchanged original", command: process.execPath, args: [...prepare(baseline), "--baseline-only"] },
    { id: "baseline-evaluate", phase: "baseline", label: "Evaluate original in PoB", command: python, args: evaluate(baseline) },
    { id: "baseline-verify", phase: "baseline", label: "Verify original arithmetic and coverage", command: process.execPath, args: [join(tools, "verify_real_audit.mjs"), baseline] },
    { id: "generate", phase: "generation", label: "Generate protected candidates", command: process.execPath, args: [...prepare(routes), "--coverage-job", baseline, "--requirements", capturedPolicy] },
    { id: "routes-evaluate", phase: "evaluation", label: "Evaluate candidates in PoB", command: python, args: evaluate(routes) },
    { id: "routes-verify", phase: "evaluation", label: "Verify candidate arithmetic and coverage", command: process.execPath, args: [join(tools, "verify_real_audit.mjs"), routes] },
    { id: "compare", phase: "comparison", label: "Apply preservation policy and compare", command: process.execPath, args: [join(tools, "build_requirements.mjs"), routes, capturedPolicy, "workflow.requirements-report.json"] },
  ];
  const run = { version: 1, status: "running", directory, startedAt: new Date().toISOString(), profile, attribute,
    sourceUrl: options.sourceUrl ?? "Local captured PoB export", runtime,
    inputs: { codeSha256: hash(code), policySha256: hash(policy), graphSha256: graphHash },
    steps: plan.map(({ id, phase, label }) => ({ id, phase, label, status: "pending" })), comparison: null };
  const save = () => { writeFileSync(join(directory, "workflow.json"), `${JSON.stringify(run, null, 2)}\n`); writeFileSync(join(directory, "summary.txt"), formatAuditSummary(run)); };
  const immutable = () => requireTrue(hash(readFileSync(capturedCode)) === run.inputs.codeSha256
    && hash(readFileSync(capturedPolicy)) === run.inputs.policySha256 && hash(readFileSync(graphPath)) === run.inputs.graphSha256,
  "Captured inputs or game graph changed during the run; no comparison may be reused.");
  const started = Date.now();
  save();
  try {
    for (const [index, step] of plan.entries()) {
      if (options.signal?.aborted) throw new Error("Audit cancelled.");
      immutable();
      const state = run.steps[index];
      state.status = "running"; state.startedAt = new Date().toISOString();
      state.stdout = `logs/${step.id}.stdout.log`; state.stderr = `logs/${step.id}.stderr.log`;
      save(); onProgress({ id: step.id, label: step.label, index: index + 1, total: plan.length });
      const result = await execute({ ...step, cwd: root, stdoutPath: join(directory, state.stdout), stderrPath: join(directory, state.stderr), signal: options.signal });
      state.exitCode = result.exitCode; state.signal = result.signal ?? null;
      if (options.signal?.aborted) throw new Error("Audit cancelled.");
      requireTrue(!result.error && !result.signal && Number.isInteger(result.exitCode), result.error ?? `Step ended without a normal exit: ${step.id}.`);
      if (step.id.endsWith("-verify")) {
        requireTrue([0, 1].includes(result.exitCode), `Verifier could not run (exit ${result.exitCode}).`);
        state.verification = verifiedReport(join(step.id === "baseline-verify" ? baseline : routes, "real-build-verification.json"));
      } else if (step.id === "compare") {
        requireTrue([0, 2].includes(result.exitCode), `Comparison failed (exit ${result.exitCode}).`);
        const comparison = comparisonSummary(readJson(join(routes, "workflow.requirements-report.json")), routes, run.inputs.policySha256);
        requireTrue(result.exitCode === (comparison.status === "no_eligible_candidates" ? 2 : 0), "Comparison exit code and report disagree.");
        run.comparison = comparison;
      } else {
        requireTrue(result.exitCode === 0, `${step.label} failed (exit ${result.exitCode}); inspect ${state.stderr} and ${state.stdout}.`);
      }
      immutable(); state.status = "succeeded"; state.finishedAt = new Date().toISOString(); save();
    }
    requireTrue(run.comparison !== null, "Comparison evidence is missing.");
    run.status = run.comparison.status === "no_eligible_candidates" ? "completed_no_eligible" : "completed";
  } catch (error) {
    run.status = options.signal?.aborted ? "cancelled" : "failed"; run.error = error.message;
    run.comparison = null;
    const state = run.steps.find((step) => step.status === "running");
    if (state) {
      state.status = run.status; state.error = error.message; state.finishedAt = new Date().toISOString();
      if (run.status === "failed") state.failureDetails = phaseFailureDetails(directory, state);
    }
    for (const pending of run.steps.filter((step) => step.status === "pending")) pending.status = "skipped";
  }
  run.finishedAt = new Date().toISOString(); run.durationMs = Date.now() - started;
  save();
  return { run, exitCode: run.status === "completed" ? 0 : run.status === "completed_no_eligible" ? 2 : run.status === "cancelled" ? 130 : 1 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  try {
    const { values } = parseArgs({ options: {
      code: { type: "string" }, runtime: { type: "string" }, requirements: { type: "string" }, output: { type: "string" },
      "source-url": { type: "string" }, profile: { type: "string" }, attribute: { type: "string" }, python: { type: "string" },
      "protected-node-ids": { type: "string" }, help: { type: "boolean" },
    } });
    if (values.help) console.log("Usage: node tools/pob-evaluation/run_audit.mjs --code CODE.txt --runtime var/RUNTIME --requirements POLICY.json [--output var/FRESH_RUN] [--source-url URL] [--profile ci-mana|life-armour] [--attribute Strength|Dexterity|Intelligence] [--python EXECUTABLE] [--protected-node-ids ID,ID]");
    else {
      process.on("SIGINT", cancel); process.on("SIGTERM", cancel);
      const { run, exitCode } = await runAuditWorkflow({ ...values, sourceUrl: values["source-url"], protectedNodeIds: values["protected-node-ids"], signal: controller.signal },
        { onProgress: ({ index, total, label }) => console.log(`[${index}/${total}] ${label}`) });
      console.log(formatAuditSummary(run)); process.exitCode = exitCode;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel); }
}
