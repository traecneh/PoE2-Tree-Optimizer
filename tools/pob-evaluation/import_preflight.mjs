import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { tsImport } from "tsx/esm/api";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
const { buildClassStartOptions, resolveClassStartOptionFromPobMetadata } = await tsImport("../../src/tree/classStartAliases.ts", import.meta.url);
const { filterVisibleTreeGraph } = await tsImport("../../src/tree/treeVisibility.ts", import.meta.url);
const { findAllocationDistancesFrom } = await tsImport("../../src/tree/pathAllocation.ts", import.meta.url);

const specialItems = new Map([
  ["from nothing", ["disconnected_allocation", "Allocating passives without ordinary root connectivity is not modeled."]],
  ["controlled metamorphosis", ["disconnected_allocation", "Ring/radius allocation permissions are not modeled."]],
  ["split personality", ["alternate_start", "Allocation from another class start is not modeled."]],
  ["voices", ["generated_sockets", "Item-generated jewel sockets are not part of the shared routing graph."]],
  ["heroic tragedy", ["transformed_passives", "Seeded/conquered passive replacements are not independently represented by the game graph."]],
  ["undying hate", ["transformed_passives", "Seeded/conquered passive replacements are not independently represented by the game graph."]],
]);
const meaningful = (text) => text && !/^none$/i.test(text.trim()) ? text.trim() : undefined;
const direct = (element, name) => [...(element?.children ?? [])].filter((child) => child.tagName === name);
const one = (element, name) => direct(element, name)[0];
const normalizeName = (name) => name.trim().toLowerCase().replace(/\s+/g, " ");

export function isPreflightReady(report, sourceXmlSha256) {
  return report?.version === 1 && report.status === "ready_for_audit" && report.canGenerateRoutes === true
    && report.sourceXmlSha256 === sourceXmlSha256 && Array.isArray(report.findings)
    && !report.findings.some((finding) => finding.severity === "blocker");
}

export function inspectPobImport(xmlText, graph, { profile = "ci-mana" } = {}) {
  const report = {
    version: 1, status: "blocked", canGenerateRoutes: false,
    sourceXmlSha256: createHash("sha256").update(typeof xmlText === "string" ? xmlText : "").digest("hex"), graphVersion: graph.gameVersion,
    requestedProfile: profile, findings: [],
    coverage: {
      checked: ["Selected PoB tree and item set", "Known allocation-changing items", "Original shared and per-weapon connectivity", "Class/start mapping and retained item grants"],
      notChecked: ["Every item/skill modifier", "In-game damage or EHP accuracy", "Full rotation, leech, recoup or flask sustain", "Whether every unknown mechanic is supported by PoB"],
      meaning: "Ready for the scoped offline audit, not a guarantee that the build is valid or every effect is supported. Ranking still requires a successful calculation audit and explicit requirements.",
    },
  };
  const add = (code, severity, message, action, evidence = {}) => report.findings.push({ code, severity, message, action, ...evidence });
  const finish = () => {
    report.canGenerateRoutes = !report.findings.some((finding) => finding.severity === "blocker");
    report.status = report.canGenerateRoutes ? "ready_for_audit" : "blocked";
    report.blockerCount = report.findings.filter((finding) => finding.severity === "blocker").length;
    report.warningCount = report.findings.filter((finding) => finding.severity === "warning").length;
    return report;
  };
  if (!["ci-mana", "life-armour"].includes(profile)) add("unsupported_profile", "blocker", `Unknown audit profile: ${profile}.`, "Choose one of the two audited profiles; do not infer a new defence model.");
  if (typeof xmlText !== "string" || xmlText.length > 8 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xmlText)) {
    add("unsupported_xml", "blocker", "Build XML is oversized or declares external/entity content.", "Use a plain PoB XML export without DTD/entity declarations.");
    return finish();
  }
  let dom;
  try {
    dom = new JSDOM(xmlText, { contentType: "text/xml" });
    const root = dom.window.document.documentElement;
    if (root.tagName !== "PathOfBuilding2") throw new Error("Expected a PoB for PoE2 export.");
    const build = one(root, "Build"), tree = one(root, "Tree"), items = one(root, "Items"), skills = one(root, "Skills");
    if (!build || !tree) throw new Error("Missing Build or Tree section.");
    const specs = direct(tree, "Spec");
    const index = Number(tree.getAttribute("activeSpec") ?? "1") - 1;
    if (!Number.isSafeInteger(index) || index < 0 || !specs[index]) throw new Error("The selected tree specification does not exist.");
    const spec = specs[index];
    const ids = (text, label) => {
      const parts = (text ?? "").trim() ? text.trim().split(/[\s,]+/) : [];
      if (parts.some((id) => !/^\d+$/.test(id))) throw new Error(`${label} contains invalid passive IDs.`);
      return [...new Set(parts)];
    };
    const allocated = ids(spec.getAttribute("nodes"), "Tree");
    const allocatedSet = new Set(allocated);
    const metadata = {
      className: meaningful(build.getAttribute("className")) ?? meaningful(root.getAttribute("className")),
      ascendClassName: meaningful(build.getAttribute("ascendClassName")) ?? meaningful(root.getAttribute("ascendClassName")),
    };
    report.selection = { activeSpecIndex: index + 1, title: spec.getAttribute("title") ?? "", ...metadata,
      treeVersion: spec.getAttribute("treeVersion"), buildFormatVersion: build.getAttribute("targetVersion"), allocatedIdCount: allocated.length };
    if (spec.getAttribute("treeVersion") !== "0_5") add("tree_version", "blocker", "This audit only covers the 0_5 passive tree.", "Export from an updated PoB; do not silently convert the input.");
    // PoB's targetVersion is a build-format identifier, not its passive-tree version.
    if (build.getAttribute("targetVersion") !== "0_1") add("build_conversion_required", "blocker", "The build-format target is missing or outside the copied runtime's 0_1 target.", "Re-export from the matching PoB runtime before calculating.");
    const secondary = (spec.getAttribute("secondaryAscendClassId") ?? "").trim().toLowerCase();
    if (!["", "0", "nil", "none"].includes(secondary)) add("secondary_ascendancy", "blocker", "A secondary ascendancy or unrecognized secondary selection is present.", "This allocation context needs a dedicated audit before routing.");
    if ((spec.getAttribute("masteryEffects") ?? "").trim()) add("legacy_masteries", "blocker", "The tree retains mastery selections not modeled by this workflow.", "Verify the export against the current tree before importing.");
    const unsupportedOverrides = direct(spec, "Overrides").flatMap((entry) => [...entry.children]).filter((entry) => entry.tagName !== "AttributeOverride").map((entry) => entry.tagName);
    if (unsupportedOverrides.length) add("tree_overrides", "blocker", "The tree contains non-attribute overrides.", "Add explicit support for their effect on node identity, cost and routing first.", { elements: unsupportedOverrides });
    const missing = allocated.filter((id) => !graph.nodes[id]);
    if (missing.length) add("missing_passives", "blocker", "Allocated IDs are absent from the current game graph.", "Resolve the tree-version or generated-node mismatch; no goals will be dropped.", { nodeIds: missing });
    const permissionPattern = /(?:can be allocated|can allocate passive skills).*?(?:without being connected|starting point)|in radius.*?(?:conquered|transformed|replaced)|allocates \d+ .*jewel sockets?/i;
    for (const id of allocated) if (permissionPattern.test((graph.nodes[id]?.stats ?? []).join(" "))) {
      add("passive_allocation_rule", "blocker", `${graph.nodes[id].name} changes allocation permissions or passive identities.`,
        "Audit this passive's special rule before single-root routing.", { nodeIds: [id] });
    }
    const sets = { 1: [], 2: [] };
    for (const entry of [...spec.children].filter((entry) => /^WeaponSet/.test(entry.tagName))) {
      const set = entry.tagName.slice("WeaponSet".length);
      if (!["1", "2"].includes(set) || direct(spec, entry.tagName).length !== 1) {
        add("weapon_set_structure", "blocker", "Weapon-set declarations are unsupported or duplicated.", "Use one declaration for each of W1 and W2.");
      } else sets[set] = ids(entry.getAttribute("nodes"), entry.tagName);
    }
    const weaponIds = new Set([...sets[1], ...sets[2]]);
    if (sets[1].some((id) => sets[2].includes(id))) add("weapon_set_overlap", "blocker", "A passive is assigned to both weapon sets.", "Resolve the ambiguous assignment in PoB.");
    const invalidWeapon = [...weaponIds].filter((id) => !allocatedSet.has(id) || !graph.nodes[id] || graph.nodes[id].flags.ascendancy || graph.nodes[id].flags.classStart);
    if (invalidWeapon.length) add("invalid_weapon_passives", "blocker", "Weapon sets refer to unallocated, missing or non-main passives.", "Correct the weapon allocations before auditing.", { nodeIds: invalidWeapon });
    report.weaponSets = { 1: sets[1].length, 2: sets[2].length };
    const resolution = resolveClassStartOptionFromPobMetadata(buildClassStartOptions(graph), { ...metadata, allocatedNodeIds: allocated });
    const mapped = resolution.kind === "matched" && resolution.source === "metadata" ? resolution.option : undefined;
    if (!mapped || metadata.ascendClassName && !mapped.ascendancy) add("class_start_unresolved", "blocker", "Explicit class/ascendancy metadata cannot be mapped unambiguously.", "Supply the correct metadata; shared starts must not be guessed.");
    const knownRoots = new Set(Object.values(graph.classStarts));
    const otherRoots = allocated.filter((id) => knownRoots.has(id) && id !== mapped?.nodeId);
    if (otherRoots.length) add("alternate_start_nodes", "blocker", "Other class starts are present in the allocation.", "Audit alternate-start permissions before using single-root routing.", { nodeIds: otherRoots });
    const mainIds = allocated.filter((id) => graph.nodes[id] && !graph.nodes[id].flags.ascendancy && !weaponIds.has(id));
    report.sharedNodeIds = mainIds;
    const nodeEvidence = (nodeIds) => ({ nodeIds, nodes: nodeIds.map((id) => ({ id, name: graph.nodes[id]?.name ?? "Unknown passive" })) });
    if (mapped) {
      report.selection.startNodeId = mapped.nodeId;
      if (!allocatedSet.has(mapped.nodeId)) add("start_not_allocated", "blocker", "The expected class start is not allocated.", "Check for an alternate start or inconsistent export.");
      const ascendancy = allocated.filter((id) => graph.nodes[id]?.flags.ascendancy);
      const visible = filterVisibleTreeGraph(graph, { selectedAscendancyId: mapped.ascendancy?.id, allocatedAscendancyNodeIds: ascendancy });
      const restricted = (allowed) => ({ ...visible,
        nodes: Object.fromEntries(Object.entries(visible.nodes).filter(([id, node]) => !node.flags.ascendancy && allowed(id))),
        edges: visible.edges.filter((edge) => allowed(edge.from) && allowed(edge.to)),
      });
      const mainSet = new Set(mainIds);
      const originalReachable = findAllocationDistancesFrom(restricted((id) => mainSet.has(id)), [mapped.nodeId]);
      const detached = mainIds.filter((id) => !originalReachable.has(id));
      if (detached.length) add("disconnected_shared_passives", "blocker", "Some serialized shared passives do not connect to the selected start using the allocated shared tree.", "Check item-granted/free or disconnected allocation rules; the audit will not invent connecting edges or charge a different baseline.", nodeEvidence(detached));
      const routable = findAllocationDistancesFrom(restricted((id) => !weaponIds.has(id)), [mapped.nodeId]);
      const unreachable = mainIds.filter((id) => !routable.has(id));
      if (unreachable.length) add("shared_route_unreachable", "blocker", "Some shared passives cannot be routed from the start while weapon nodes remain reserved.", "Audit the special allocation or weapon-bridge dependency before changing the main tree.", nodeEvidence(unreachable));
      for (const set of [1, 2]) {
        const combined = new Set([...mainIds, ...sets[set]]);
        const reached = findAllocationDistancesFrom(restricted((id) => combined.has(id)), [mapped.nodeId]);
        const detachedWeapon = sets[set].filter((id) => !reached.has(id));
        if (detachedWeapon.length) add("disconnected_weapon_passives", "blocker", `W${set} contains passives disconnected without borrowing the other set.`, "Resolve the per-set allocation or special permission first.", { weaponSet: set, ...nodeEvidence(detachedWeapon) });
      }
    }
    if (!items || !skills || !one(root, "Config")) add("missing_calculation_context", "blocker", "The export lacks Items, Skills or Config context.", "Use a complete build export rather than only a tree URL.");
    const config = one(root, "Config");
    const configSets = direct(config, "ConfigSet");
    const activeConfigs = configSets.filter((set) => set.getAttribute("id") === (config?.getAttribute("activeConfigSet") ?? "1"));
    if (config && activeConfigs.length !== 1) add("config_set_unresolved", "blocker", "The selected configuration set is missing or ambiguous.", "Export the intended active configuration explicitly.");
    for (const input of direct(activeConfigs[0], "Input")) if (input.getAttribute("name") === "customMods") {
      const text = input.getAttribute("string") ?? input.textContent;
      if (text.trim()) add(permissionPattern.test(text) ? "custom_allocation_rule" : "custom_modifiers", permissionPattern.test(text) ? "blocker" : "warning",
        permissionPattern.test(text) ? "Custom modifiers change allocation permissions or passive identities." : "Custom modifiers are present and retained as build context.",
        "Custom modifier correctness is not independently covered; allocation-changing modifiers require dedicated routing support.");
    }
    const itemRecords = direct(items, "Item");
    const itemMap = new Map(itemRecords.map((item) => [item.getAttribute("id"), item]));
    if (itemMap.size !== itemRecords.length) add("duplicate_item_ids", "blocker", "Item records have duplicated IDs.", "Re-export a consistent item context.");
    const selectedItemSetId = items?.getAttribute("activeItemSet") ?? "1";
    const itemSets = direct(items, "ItemSet");
    const selectedItemSets = itemSets.filter((set) => set.getAttribute("id") === selectedItemSetId);
    if (selectedItemSets.length !== 1) add("item_set_unresolved", "blocker", "The selected item set is missing or ambiguous.", "Select and export the intended equipment set.");
    const references = new Map();
    const reference = (id, location) => {
      if (!id || id === "0") return;
      if (!itemMap.has(id)) add("missing_item_record", "blocker", "Selected equipment refers to an absent item record.", "Re-export the full equipment context.", { itemId: id, location });
      const locations = references.get(id) ?? [];
      references.set(id, [...locations, location]);
    };
    for (const slot of direct(selectedItemSets[0], "Slot")) reference(slot.getAttribute("itemId"), slot.getAttribute("name") ?? "Equipment");
    for (const socket of direct(one(spec, "Sockets"), "Socket")) {
      const nodeId = socket.getAttribute("nodeId");
      reference(socket.getAttribute("itemId"), `Jewel socket ${nodeId}`);
      if (socket.getAttribute("itemId") !== "0" && (!allocatedSet.has(nodeId) || !graph.nodes[nodeId]?.flags.jewelSocket)) add("invalid_jewel_socket", "blocker", "A socketed jewel is not on an allocated known jewel socket.", "Check generated sockets or incomplete tree data.", { nodeIds: [nodeId] });
    }
    report.inspectedItems = [];
    report.itemGrants = [];
    const byName = new Map();
    for (const node of Object.values(graph.nodes)) {
      const key = normalizeName(node.name);
      byName.set(key, [...(byName.get(key) ?? []), node.id]);
    }
    for (const [id, locations] of references) {
      const item = itemMap.get(id);
      if (!item) continue;
      const lines = item.textContent.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const rarity = lines.findIndex((line) => /^Rarity:/.test(line));
      const name = lines[rarity + 1] ?? `Item ${id}`;
      const evidence = { itemId: id, itemName: name, locations };
      report.inspectedItems.push(evidence);
      const known = specialItems.get(normalizeName(name));
      const joined = lines.join(" ").replace(/\s+/g, " ");
      const allocation = permissionPattern.test(joined);
      if (known || allocation) add(known?.[0] ?? "allocation_rule", "blocker", `${name}: ${known?.[1] ?? "An allocation-changing or passive-replacement modifier is not modeled."}`,
        "Keep the build unchanged and add dedicated support/evidence for this rule before routing or performance ranking.", evidence);
      for (const line of lines) {
        const match = /^(?:\{[^}]*\})*Allocates (.+)$/i.exec(line);
        if (!match || /jewel sockets?/i.test(match[1])) continue;
        const nodeIds = byName.get(normalizeName(match[1])) ?? [];
        const overlaps = nodeIds.filter((nodeId) => allocatedSet.has(nodeId));
        report.itemGrants.push({ ...evidence, passiveName: match[1], nodeIds, serializedNodeIds: overlaps });
        if (overlaps.length) add("ambiguous_item_grant_cost", "blocker", `${name} grants ${match[1]}, which also appears in the serialized allocation.`,
          "Resolve free versus purchased allocation before counting points; no node will be silently removed or made free.", { ...evidence, ...nodeEvidence(overlaps) });
        else add(nodeIds.length === 1 ? "retained_item_grant" : "unresolved_item_grant", nodeIds.length === 1 ? "info" : "warning",
          `${name} grants ${match[1]} outside the serialized paid tree${nodeIds.length !== 1 ? "; its identity is not uniquely mapped in the game graph" : ""}.`,
          "Keep this effect in the original PoB item context, not as a purchased routing goal. Native PoB support and full effect accuracy are not independently established by this lookup.", { ...evidence, passiveName: match[1], nodeIds });
      }
    }
    report.ignoredInactiveItemCount = itemRecords.filter((item) => !references.has(item.getAttribute("id"))).length;
    const selectedSkillsId = skills?.getAttribute("activeSkillSet") ?? "1";
    const selectedSkills = direct(skills, "SkillSet").filter((set) => set.getAttribute("id") === selectedSkillsId);
    const groups = direct(selectedSkills[0], "Skill");
    const selectedGroup = groups[Number(build.getAttribute("mainSocketGroup")) - 1];
    if (selectedSkills.length !== 1 || !selectedGroup || !direct(selectedGroup, "Gem").length) add("skill_selection_unresolved", "blocker", "The active skill set or selected skill group is unavailable.", "Select an intended skill in a complete PoB export before comparing damage.");
    const fullDPS = groups.some((group) => group.getAttribute("enabled") !== "false" && group.getAttribute("includeInFullDPS") === "true");
    report.damageMetric = fullDPS ? "FullDPS" : "CombinedDPS";
    if (!fullDPS) add("selected_skill_damage_only", "info", "No enabled Full DPS groups are selected; this workflow will compare selected-skill CombinedDPS.", "Check each weapon context at calculation time; a zero damage baseline does not establish valid damage coverage.");
    add("limited_calculation_coverage", "warning", "This static preflight does not verify every mechanic or whether every item modifier is supported by PoB.", "Require the scoped native calculation audit, independent arithmetic checks and explicit requirements before ranking. Total sustain and in-game performance remain unverified.");
    return finish();
  } catch (error) {
    add("invalid_export", "blocker", `Could not inspect the export: ${error.message}`, "Use a complete, valid PoB for PoE2 export.");
    return finish();
  } finally {
    dom?.window.close();
  }
}

export function inspectAuditJob(xmlText, graph, audit, savedPreflight) {
  const report = inspectPobImport(xmlText, graph, { profile: audit.validationProfile ?? "ci-mana" });
  if (savedPreflight && (!isPreflightReady(savedPreflight, report.sourceXmlSha256)
    || savedPreflight.requestedProfile !== report.requestedProfile)) {
    report.findings.push({ code: "stale_or_blocked_job", severity: "blocker",
      message: "This job has a blocked preflight or a preflight for a different source/profile.",
      action: "Re-run preparation in a fresh job directory. Old route results must not be used for the failed import." });
    report.canGenerateRoutes = false;
    report.status = "blocked";
    report.blockerCount += 1;
  }
  return report;
}
