import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import { decompressSync, strFromU8 } from "fflate";
import { buildClassStartOptions, resolveClassStartOptionFromPobMetadata } from "../../src/tree/classStartAliases";
import { optimizeBuildGoalsAnytime, type BuildGoalsRouteCandidate } from "../../src/tree/buildGoalsOptimizer";
import { findAllocationDistancesFrom, treeEdgeKey } from "../../src/tree/pathAllocation";
import { filterVisibleTreeGraph } from "../../src/tree/treeVisibility";
import type { TreeGraph } from "../../src/tree/types";
import { inspectPobImport } from "./import_preflight.mjs";
import { deriveGenerationProtection, fingerprint } from "./generation_protection.mjs";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const [codePath, outputDirectory, sourceUrl, ...args] = process.argv.slice(2);
const { values, positionals } = parseArgs({
  args, allowPositionals: true, options: {
    profile: { type: "string", default: "ci-mana" }, attribute: { type: "string", default: "Intelligence" },
    "baseline-only": { type: "boolean", default: false }, "coverage-job": { type: "string" }, requirements: { type: "string" },
  }
});
const protectedIdsText = positionals[0];
if (positionals.length > 1 || !["ci-mana", "life-armour"].includes(values.profile!)
  || !["Strength", "Dexterity", "Intelligence"].includes(values.attribute!)) throw new Error("Invalid audit profile, attribute choice, or extra argument.");
if (!codePath || !outputDirectory || !sourceUrl) throw new Error("Usage: tsx prepare_real_audit.ts CODE.txt JOB_DIRECTORY SOURCE_URL [PROTECTED_NODE_IDS] (--baseline-only | --coverage-job BASELINE_JOB) [--requirements POLICY.json]");
const job = resolve(outputDirectory);
const withinVar = relative(resolve("var"), job);
if (!withinVar || withinVar.startsWith("..") || isAbsolute(withinVar)) throw new Error("Audit output must remain under a job subdirectory of var.");
mkdirSync(job, { recursive: true });
try {
  writeFileSync(resolve(job, "generation-preflight.json"), `${JSON.stringify({ version: 1, status: "blocked", message: "Preparation has not completed." }, null, 2)}\n`);
  const code = readFileSync(codePath, "utf8").trim();
  let xml: string;
  try {
    xml = strFromU8(decompressSync(Buffer.from(code, "base64url")));
  } catch {
    mkdirSync(job, { recursive: true });
    writeFileSync(resolve(job, "import-preflight.json"), `${JSON.stringify({
      version: 1, status: "blocked", canGenerateRoutes: false,
      requestedProfile: values.profile, findings: [{
        code: "unreadable_export", severity: "blocker",
        message: "Could not decode the PoB build code.", action: "Provide a valid PoB for PoE2 export; old job results must not be used for this failed import."
      }]
    }, null, 2)}\n`);
    throw new Error("Import compatibility preflight blocked: could not decode the PoB code. See import-preflight.json.");
  }
  const rawGraph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
  const preflight = inspectPobImport(xml, rawGraph, { profile: values.profile });
  mkdirSync(job, { recursive: true });
  writeFileSync(resolve(job, "import-preflight.json"), `${JSON.stringify(preflight, null, 2)}\n`);
  if (!preflight.canGenerateRoutes) throw new Error(`Import compatibility preflight blocked: ${preflight.findings.filter((finding) => finding.severity === "blocker").map((finding) => finding.message).join(" ")} See ${resolve(job, "import-preflight.json")}`);
  if (existsSync(resolve(job, "audit-input.json")) || existsSync(resolve(job, "source-build.xml"))) throw new Error("Use a fresh job directory; prior source and audit inputs will not be overwritten.");
  if (values["baseline-only"] && values["coverage-job"]) throw new Error("Choose baseline-only capture or coverage-backed generation, not both.");
  if (!values["baseline-only"] && !values["coverage-job"]) throw new Error("Capture --baseline-only first, then supply --coverage-job BASELINE_JOB for protected candidate generation.");
  if (values["baseline-only"] && values.requirements) throw new Error("Apply requirements during coverage-backed generation, after original coverage is available.");
  const document = new JSDOM(xml, { contentType: "text/xml" }).window.document as Document;
  if (document.documentElement.nodeName !== "PathOfBuilding2") throw new Error("Expected a PoB for PoE2 export.");
  const build = document.querySelector("Build");
  const tree = document.querySelector("Tree");
  const specs = Array.from(document.querySelectorAll("Tree > Spec"));
  const specIndex = Number(tree?.getAttribute("activeSpec") ?? "1") - 1;
  const spec = specs[specIndex];
  const skills = document.querySelector("Skills");
  const activeSkillSet = skills?.querySelector(`SkillSet[id="${skills.getAttribute("activeSkillSet") ?? "1"}"]`);
  if (!build || !spec) throw new Error("Missing active build or tree specification.");
  if (spec.getAttribute("treeVersion") !== "0_5") throw new Error("This audit currently requires a 0_5 PoB tree.");
  if (Array.from(spec.children).some((element) => /^WeaponSet/.test(element.tagName) && !/^WeaponSet[12]$/.test(element.tagName))) throw new Error("Only weapon sets 1 and 2 are supported.");
  const ids = (text: string | null) => [...new Set((text ?? "").match(/\d+/g) ?? [])];
  const originalIds = ids(spec.getAttribute("nodes"));
  const missing = originalIds.filter((id) => !rawGraph.nodes[id]);
  if (missing.length) throw new Error(`Allocated passives missing from the game graph: ${missing.join(", ")}`);
  const resolution = resolveClassStartOptionFromPobMetadata(buildClassStartOptions(rawGraph), {
    className: build.getAttribute("className") ?? undefined,
    ascendClassName: build.getAttribute("ascendClassName") ?? undefined,
    allocatedNodeIds: originalIds,
  });
  if (resolution.kind !== "matched" || resolution.source !== "metadata") throw new Error("Class metadata could not be mapped unambiguously.");
  const ascendancyIds = originalIds.filter((id) => rawGraph.nodes[id].flags.ascendancy);
  const visibleGraph = filterVisibleTreeGraph(rawGraph, { selectedAscendancyId: resolution.option.ascendancy?.id, allocatedAscendancyNodeIds: ascendancyIds });
  const preservedWeaponSets = Object.fromEntries(["1", "2"].map((set) => [set, ids(spec.querySelector(`WeaponSet${set}`)?.getAttribute("nodes") ?? null)]));
  if (preservedWeaponSets["1"].some((id) => preservedWeaponSets["2"].includes(id))) throw new Error("Weapon-set assignments overlap.");
  const weaponNodes = new Set(Object.values(preservedWeaponSets).flat());
  if ([...weaponNodes].some((id) => !originalIds.includes(id) || rawGraph.nodes[id].flags.ascendancy)) throw new Error("Weapon-set passives must be allocated main-tree nodes.");
  // Reserved W1/W2 passives cannot become shared main-tree shortcuts.
  const graph = {
    ...visibleGraph, nodes: Object.fromEntries(Object.entries(visibleGraph.nodes).filter(([id]) => !weaponNodes.has(id))),
    edges: visibleGraph.edges.filter((edge) => !weaponNodes.has(edge.from) && !weaponNodes.has(edge.to))
  };
  const baseNodeId = resolution.option.nodeId;
  const mainNodeIds = originalIds.filter((id) => !ascendancyIds.includes(id) && !weaponNodes.has(id));
  if (!mainNodeIds.includes(baseNodeId)) throw new Error("The allocated start disagrees with the explicit class metadata.");
  const originalAttributes = mainNodeIds.filter((id) => rawGraph.nodes[id].flags.attribute);
  const mainSet = new Set(mainNodeIds);
  const weaponBoundaryNodeIds = [...new Set(visibleGraph.edges.flatMap(({ from, to }) =>
    weaponNodes.has(from) && mainSet.has(to) ? [to] : weaponNodes.has(to) && mainSet.has(from) ? [from] : []))];
  const extraProtectedNodeIds = ids(protectedIdsText ?? "");
  if (extraProtectedNodeIds.some((id) => !mainNodeIds.includes(id))) throw new Error("Extra protected nodes must already belong to the original main tree.");
  const defaultGoalNodeIds = [...new Set([...mainNodeIds.filter((id) => {
    const flags = rawGraph.nodes[id].flags;
    return flags.notable || flags.keystone || flags.jewelSocket || flags.attribute;
  }), ...extraProtectedNodeIds, ...weaponBoundaryNodeIds])];
  const originalSet = new Set(mainNodeIds);
  const edgeKeys = (nodeIds: string[]) => {
    const set = new Set(nodeIds);
    return visibleGraph.edges.filter((edge) => set.has(edge.from) && set.has(edge.to)).map((edge) => treeEdgeKey(edge.from, edge.to));
  };
  const describe = (label: string, nodeIds: string[]) => ({
    label, nodeIds, pointCost: new Set(nodeIds).size - 1, edgeKeys: edgeKeys(nodeIds),
    weaponEdgeKeys: Object.fromEntries(Object.entries(preservedWeaponSets).map(([set, weaponIds]) => [set, edgeKeys([...nodeIds, ...weaponIds])])),
    addedNodeIds: nodeIds.filter((id) => !originalSet.has(id)), removedNodeIds: mainNodeIds.filter((id) => !nodeIds.includes(id)),
    nodes: nodeIds.filter((id) => id !== baseNodeId).map((id) => ({ id, name: graph.nodes[id].name, stats: graph.nodes[id].stats, attribute: Boolean(graph.nodes[id].flags.attribute) })),
  });
  const originalAudit = {
    sourceUrl, sourceXmlSha256: createHash("sha256").update(xml).digest("hex"), graphVersion: rawGraph.gameVersion,
    graphFingerprint: fingerprint(rawGraph), className: resolution.option.className, ascendancyName: resolution.option.ascendancy?.name ?? "None",
    baseNodeId, activeSpecIndex: specIndex + 1, originalMainNodeIds: mainNodeIds,
    preservedAscendancyNodeIds: ascendancyIds, preservedWeaponNodeIds: [...weaponNodes], preservedWeaponSets,
    weaponBoundaryNodeIds, validationProfile: values.profile, pinnedAttributeNodeIds: originalAttributes,
    extraProtectedNodeIds, newAttributeChoice: values.attribute,
    damageMetric: Array.from(activeSkillSet?.querySelectorAll("Skill") ?? []).some((skill) => skill.getAttribute("includeInFullDPS") === "true") ? "FullDPS" : "CombinedDPS",
    preflight,
  };
  let generation: any = { version: 1, phase: "baseline_only", mandatoryNodeIds: [], effects: [] };
  if (values["coverage-job"]) {
    const baselineJob = resolve(values["coverage-job"]);
    const inside = relative(resolve("var"), baselineJob);
    if (!inside || inside.startsWith("..") || isAbsolute(inside) || baselineJob === job) throw new Error("Coverage must come from a separate baseline job under var.");
    const readBaseline = (name: string) => readFileSync(resolve(baselineJob, name), "utf8");
    const baselineAudit = JSON.parse(readBaseline("audit-input.json"));
    const baselineGuard = JSON.parse(readBaseline("generation-preflight.json"));
    if (baselineGuard.version !== 1 || baselineGuard.status !== "ready" || baselineGuard.auditInputSha256 !== createHash("sha256").update(readBaseline("audit-input.json")).digest("hex")) throw new Error("The baseline job has incomplete or superseded preparation evidence.");
    generation = deriveGenerationProtection({
      audit: originalAudit, xml, graph: rawGraph, baselineAudit,
      baselineResult: JSON.parse(readBaseline("real-build-results.json")), baselineXml: readBaseline("source-build.xml"),
      baselinePreflight: JSON.parse(readBaseline("import-preflight.json")),
      policy: values.requirements ? JSON.parse(readFileSync(resolve(values.requirements), "utf8")) : undefined
    });
  }
  const goalNodeIds = [...new Set([...defaultGoalNodeIds, ...generation.mandatoryNodeIds])];
  if (goalNodeIds.some((id) => !graph.nodes[id])) throw new Error("A required node is hidden or outside the shared routing graph.");
  const selected: Array<{ label: string; route: BuildGoalsRouteCandidate }> = [];
  let search: any = { type: "baseline_only", iterations: 0, pointCost: mainNodeIds.length - 1, proofOfMinimum: false };
  if (!values["baseline-only"]) {
    const request = { graph, baseNodeIds: [baseNodeId], baseEdgeKeys: [], goalNodeIds, mode: "shortest" as const };
    const optimized = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 128, randomSeedStart: 1, candidateLimit: 18 });
    if (optimized.status !== "success") throw new Error(`Route generation failed: ${optimized.message ?? optimized.status}`);
    search = { type: optimized.searchType, iterations: 128, pointCost: optimized.pointCost, proofOfMinimum: false };
    const available = optimized.routeCandidates ?? [optimized];
    const signature = (nodeIds: string[]) => [...nodeIds].sort().join(",");
    const seen = new Set([signature(mainNodeIds)]);
    for (const candidate of available) {
      const key = signature(candidate.totalNodeIds);
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push({ label: `Candidate ${selected.length + 1}`, route: candidate });
      if (selected.length === 2) break;
    }
    const best = available[0];
    const distances = findAllocationDistancesFrom(graph, best.totalNodeIds);
    const bestSet = new Set(best.totalNodeIds);
    const extras = Object.values(graph.nodes).filter((node) => !bestSet.has(node.id) && !node.flags.ascendancy && !node.flags.classStart
      && node.stats.some((stat) => new RegExp(values.profile === "life-armour" ? "^\\d+% increased (?:maximum Life|Armour)$" : "^\\d+% increased maximum Energy Shield$").test(stat)))
      .sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity) || a.id.localeCompare(b.id));
    for (const extra of extras) {
      if (selected.length === 2) break;
      const result = optimizeBuildGoalsAnytime({ ...request, goalNodeIds: [...goalNodeIds, extra.id] }, undefined, { maxIterations: 16 });
      if (result.status !== "success" || result.pointCost > best.pointCost + 3 || seen.has(signature(result.totalNodeIds))) continue;
      seen.add(signature(result.totalNodeIds));
      selected.push({ label: `Candidate ${selected.length + 1} via ${extra.name}`, route: result });
    }
    for (const { route } of selected) if (goalNodeIds.some((id) => !route.totalNodeIds.includes(id))) throw new Error("A generated route dropped a mandatory node.");
  }
  const manifest = {
    ...originalAudit, goalNodeIds, generation, search: { ...search, distinctAlternativeCount: selected.length },
    candidates: [describe("Original", mainNodeIds), ...selected.map(({ label, route }) => describe(label, route.totalNodeIds))],
  };
  mkdirSync(job, { recursive: true });
  writeFileSync(resolve(job, "source-build.xml"), xml);
  writeFileSync(resolve(job, "audit-input.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(resolve(job, "generation-preflight.json"), `${JSON.stringify({
    version: 1, status: "ready", phase: generation.phase,
    auditInputSha256: createHash("sha256").update(readFileSync(resolve(job, "audit-input.json"))).digest("hex"), sourceXmlSha256: manifest.sourceXmlSha256
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    class: manifest.className, ascendancy: manifest.ascendancyName, mandatoryGoals: goalNodeIds.length,
    phase: generation.phase, protectedSharedNodes: generation.mandatoryNodeIds, distinctAlternatives: selected.length,
    next: generation.phase === "baseline_only" ? "Run the native audit, then prepare a fresh job with --coverage-job pointing here." : "Evaluate the generated routes and apply the matching preservation policy before ranking.",
    preflightStatus: preflight.status, preflightWarnings: preflight.findings.filter((finding) => finding.severity === "warning").map((finding) => finding.message),
    pinnedAttributes: originalAttributes.length, candidates: manifest.candidates.map((candidate) => ({
      label: candidate.label, points: candidate.pointCost,
      added: candidate.addedNodeIds.length, removed: candidate.removedNodeIds.length
    }))
  }, null, 2));
} catch (error) {
  writeFileSync(resolve(job, "generation-preflight.json"), `${JSON.stringify({ version: 1, status: "blocked", message: error instanceof Error ? error.message : String(error) }, null, 2)}\n`);
  throw error;
}
