import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult, BuildGoalsRouteCandidate } from "./buildGoalsOptimizer";
import { isAllocatableTreeEdge, treeEdgeKey } from "./pathAllocation";
import { countMainPassivePoints, maxPassiveAllocationPointCount } from "./passivePointBudget";
import { isTreeNodeVisible } from "./treeVisibility";
import type { TreeGraph } from "./types";
import { availableMainPointLimit, fixedWeaponComponents, hasMainPointCap } from "./allocationConstraints";
import { normalizeSocketedGrenadeId } from "./mortarCannonPreferences";
import { isSocketedProxyFocus, normalizeSocketedProxySkillId } from "./proxySkillPreferencePresets";

export type BuildGoalsValidationIssue = {
  code: string;
  kind: "invalid" | "unsupported";
  message: string;
  nodeIds?: string[];
};

export type BuildGoalsValidation = ReturnType<typeof createBuildGoalsValidation>;

// A deterministic change detector, not a security hash or saved-build migration format.
export function optimizerTreeFingerprint(graph: TreeGraph): string {
  const text = JSON.stringify([
    graph.schemaVersion, graph.gameVersion,
    Object.keys(graph.nodes).sort().map((id) => {
      const n = graph.nodes[id];
      return [id, n.id, n.name, n.stats, n.position.x, n.position.y,
        Object.entries(n.flags).sort(), n.visibility, n.ascendancy];
    }),
    graph.edges.map((e) => [treeEdgeKey(e.from, e.to), e.connectionOrbit] as const)
      .sort((a, b) => a[0].localeCompare(b[0]) || (a[1] ?? 0) - (b[1] ?? 0)),
    Object.entries(graph.classStarts).sort(),
  ]);
  let hash = 2166136261;
  let second = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    second = Math.imul(second, 33) ^ text.charCodeAt(i);
  }
  return `tree-v1-${(hash >>> 0).toString(16)}-${(second >>> 0).toString(16)}`;
}

export function createBuildGoalsValidation(request: BuildGoalsOptimizeRequest) {
  const shapeIssue = requestShapeIssue(request);
  if (shapeIssue) return {
    issues: [shapeIssue], fingerprint: "", preparedRequest: request,
    validateResult: (_result: BuildGoalsOptimizeResult, _requireFingerprint?: boolean) => [shapeIssue],
  };
  return createGraphValidation(request);
}

function createGraphValidation(request: BuildGoalsOptimizeRequest) {
  const issues: BuildGoalsValidationIssue[] = [];
  const issue = (code: string, message: string, nodeIds?: string[], kind: "invalid" | "unsupported" = "invalid") => {
    issues.push({ code, kind, message, ...(nodeIds?.length ? { nodeIds } : {}) });
  };
  const base = new Set(request.baseNodeIds);
  const weapons = request.weaponSets;
  const reserved = new Set(weapons ? [...weapons.allocations[1], ...weapons.allocations[2]] : []);
  const goals = new Set([...request.goalNodeIds, ...(weapons?.attachmentNodeIds ?? [])]);
  const excluded = new Set([...(request.excludedNodeIds ?? []), ...reserved]);
  const root = request.rootNodeId ?? request.baseNodeIds[0];
  const fingerprint = optimizerTreeFingerprint(request.graph);
  const ascNodes = new Set(request.visibility?.allocatedAscendancyNodeIds ?? []);
  const classRoots = new Set(Object.values(request.graph.classStarts));
  const allowed = new Set<string>();
  const mainLimit = availableMainPointLimit(request);
  if (hasMainPointCap(request) && countMainPassivePoints(request.graph, request.baseNodeIds) > mainLimit) issue("point-budget", `The current main allocation exceeds its ${mainLimit}-point limit. Free some points before optimizing.`);
  const weaponComponents = weapons ? fixedWeaponComponents(request.graph, weapons, request.baseNodeIds) : [];
  if (weapons) {
    for (const set of [1, 2] as const) {
      if (new Set(weapons.allocations[set]).size > 24) issue("weapon-budget", `W${set} exceeds its 24-point limit.`);
      for (const id of weapons.allocations[set]) {
        const node = request.graph.nodes[id];
        if (!node || node.flags.classStart || node.flags.ascendancy || node.flags.mastery || node.flags.keystone || node.flags.jewelSocket
          || !isTreeNodeVisible(node, { selectedAscendancyId: request.visibility?.selectedAscendancyId, allocatedAscendancyNodeIds: ascNodes })) issue("weapon-node", "A fixed weapon set contains an unknown, locked or unsupported passive.", [id]);
        if (weapons.allocations[set === 1 ? 2 : 1].includes(id)) issue("weapon-overlap", "The same passive cannot belong to both fixed weapon sets.", [id]);
      }
    }
    for (const component of weaponComponents) if (!component.attachments.length) issue("weapon-attachment", `W${component.set} has a branch with no recorded main-tree attachment. Reconnect it or reimport the build before optimizing.`, component.nodeIds);
  }

  if (request.mode !== "shortest" && request.mode !== "weighted") issue("mode", "Unsupported optimization mode.", undefined, "unsupported");
  if (request.mode === "weighted" && (request.focusSkillId === "mortar-cannon" || request.socketedGrenadeId !== undefined)
    && !normalizeSocketedGrenadeId(request.focusSkillId, request.socketedGrenadeId)) {
    issue("socketed-grenade", "Choose a reviewed socketed Grenade for Mortar Cannon before optimizing.");
  }
  if (request.mode === "weighted" && (isSocketedProxyFocus(request.focusSkillId) || request.socketedProxySkillId !== undefined)
    && !normalizeSocketedProxySkillId(request.focusSkillId,request.socketedProxySkillId)) {
    issue("socketed-proxy", "Choose a reviewed socketed skill for this focus before optimizing.");
  }
  if (request.allocationPool !== undefined && request.allocationPool !== "main") issue("unsupported-pool", "The optimizer supports the main tree only. Weapon sets and ascendancies must be allocated manually.", undefined, "unsupported");
  if (!root || !base.has(root)) issue("root", "The path start must be included in the base allocation.");
  if (request.treeFingerprint !== undefined && request.treeFingerprint !== fingerprint) {
    issue("stale-tree", "The tree changed. Start optimization again with the current tree.");
  }
  for (const [label, ids] of [["Base allocation", base], ["Build goals and weapon attachments", goals], ["Excluded nodes", excluded]] as const) {
    const missing = [...ids].filter((id) => !Object.hasOwn(request.graph.nodes, id));
    if (missing.length) issue("unknown-node", `${label} contain nodes not found in this tree: ${missing.join(", ")}.`, missing);
  }
  const conflicts = [...new Set([...base, ...goals])].filter((id) => excluded.has(id));
  if (conflicts.length) issue("excluded-required", "An excluded node is required by the base allocation or build goals.", conflicts);
  for (const key of ["totalPointLimit", "extraPointBudget"] as const) {
    const value = request[key];
    if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > maxPassiveAllocationPointCount)) {
      issue("budget", `${key} must be a whole number between 0 and ${maxPassiveAllocationPointCount}.`);
    }
  }
  if (request.pointBudgetMode !== undefined && request.pointBudgetMode !== "extra" && request.pointBudgetMode !== "all-available") {
    issue("budget", "Unsupported point-budget mode.", undefined, "unsupported");
  }
  const invalidAsc = [...ascNodes].filter((id) => {
    const node = request.graph.nodes[id];
    return !Object.hasOwn(request.graph.nodes, id) || !node?.flags?.ascendancy || !request.visibility?.selectedAscendancyId
      || node.ascendancy?.id !== request.visibility.selectedAscendancyId;
  });
  if (invalidAsc.length) issue("gate-context", "The ascendancy gate context contains unknown or mismatched nodes.", invalidAsc);

  for (const [id, node] of Object.entries(request.graph.nodes)) {
    const unsupportedPool = Boolean(node.flags.ascendancy || node.flags.mastery);
    const foreignRoot = id !== root && (node.flags.classStart || classRoots.has(id));
    const visible = isTreeNodeVisible(node, {
      selectedAscendancyId: request.visibility?.selectedAscendancyId,
      allocatedAscendancyNodeIds: ascNodes,
    });
    if (!unsupportedPool && !foreignRoot && visible && !excluded.has(id)) allowed.add(id);
    if (!base.has(id) && !goals.has(id)) continue;
    if (unsupportedPool) issue("unsupported-pool", "Only main-tree nodes can be optimized; ascendancy and weapon-set allocation remain manual.", [id], "unsupported");
    else if (foreignRoot) issue("foreign-root", "The allocation contains a different class starting node.", [id]);
    else if (!visible) issue("locked-node", "A required node is locked by its ascendancy or unlock requirement.", [id]);
  }

  const edges = request.graph.edges.filter((edge) => allowed.has(edge.from) && allowed.has(edge.to) && isAllocatableTreeEdge(request.graph, edge));
  const edgePairs = new Map(edges.map((edge) => [treeEdgeKey(edge.from, edge.to), [edge.from, edge.to] as const]));
  const baseEdges = new Set(request.baseEdgeKeys);
  checkEdges(baseEdges, base, "base", issue);
  const connectedBase = root ? connected(base, baseEdges, root) : new Set<string>();
  if ([...base].some((id) => !connectedBase.has(id))) {
    issue("disconnected-base", "The base allocation is not connected to its path start. Repair or reset the allocation before optimizing.");
  }

  const preparedRequest: BuildGoalsOptimizeRequest = {
    ...request,
    // The outer boundary owns snapshot identity; nested baseline solves use this filtered graph.
    treeFingerprint: undefined,
    graph: { ...request.graph, edges },
    baseNodeIds: [...base], baseEdgeKeys: [...baseEdges], goalNodeIds: [...goals], excludedNodeIds: [...excluded],
    // Nested solves receive already-expanded anchors/reservations, not weapon edges
    // that have deliberately been removed from their main-only routing graph.
    weaponSets: undefined, ...(hasMainPointCap(request) ? { totalPointLimit: mainLimit } : {}),
  };

  function checkEdges(keys: Iterable<string>, nodes: ReadonlySet<string>, label: string, add: typeof issue) {
    for (const key of keys) {
      const pair = edgePairs.get(key);
      if (!pair || !nodes.has(pair[0]) || !nodes.has(pair[1])) add("invalid-edge", `The ${label} contains an invalid or unavailable edge: ${key}.`);
    }
  }

  function connected(nodes: ReadonlySet<string>, keys: Iterable<string>, start: string) {
    const adjacency = new Map<string, string[]>();
    for (const key of keys) {
      const pair = edgePairs.get(key);
      if (!pair || !nodes.has(pair[0]) || !nodes.has(pair[1])) continue;
      for (const [a, b] of [pair, [pair[1], pair[0]]] as const) {
        const neighbors = adjacency.get(a) ?? [];
        neighbors.push(b);
        adjacency.set(a, neighbors);
      }
    }
    const seen = new Set(nodes.has(start) ? [start] : []);
    const queue = [...seen];
    for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i]) ?? []) {
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    return seen;
  }

  function validateResult(result: BuildGoalsOptimizeResult, requireFingerprint = request.treeFingerprint !== undefined): BuildGoalsValidationIssue[] {
    if (issues.length) return issues;
    const errors: BuildGoalsValidationIssue[] = [];
    const add: typeof issue = (code, message, nodeIds, kind = "invalid") => {
      errors.push({ code, message, kind, ...(nodeIds?.length ? { nodeIds } : {}) });
    };
    if (!result || !["success", "unreachable", "cancelled", "error"].includes(result.status)) {
      add("result-shape", "The optimizer returned an unreadable result.");
      return errors;
    }
    if (result.status !== "success") return errors;
    if (requireFingerprint && result.treeFingerprint !== fingerprint) add("stale-result", "The optimizer result belongs to a different tree snapshot. Optimize again.");
    if (!Array.isArray(result.unreachableGoalNodeIds) || result.unreachableGoalNodeIds.length) add("goal-status", "A successful route cannot contain unreachable goals.");
    if (result.routeCandidates !== undefined && (!Array.isArray(result.routeCandidates) || result.routeCandidates.length === 0)) {
      add("result-shape", "The optimizer returned an empty or unreadable alternative-route list.");
      return errors;
    }
    for (const candidate of [result, ...(result.routeCandidates ?? [])]) checkCandidate(candidate, add);
    if (errors.length) return errors;
    const first = result.routeCandidates?.[0];
    if (first && (first.pointCost !== result.pointCost || first.weighted?.score !== result.weighted?.score)) {
      add("best-route", "The advertised best result does not match the first selectable route's cost or score.");
    }
    if (request.mode === "weighted") {
      const baseline = result.weighted?.stage === "baseline" ? result
        : result.routeCandidates?.find((candidate) => candidate.label === "shortest-baseline");
      if (!baseline || [result, ...(result.routeCandidates ?? [])].some((candidate) => candidate.weighted?.baselinePointCost !== baseline.pointCost)) {
        add("weighted-baseline", "The weighted budget does not match its preserved shortest-baseline route.");
      }
    }
    return errors;
  }

  function checkCandidate(candidate: BuildGoalsRouteCandidate, add: typeof issue) {
    const arrays = ["totalNodeIds", "addedNodeIds", "orderedNodeIds", "totalEdgeKeys", "addedEdgeKeys"] as const;
    if (!candidate || arrays.some((key) => !Array.isArray(candidate[key]) || candidate[key].some((id) => typeof id !== "string"))) {
      add("result-shape", "The optimizer returned unreadable route nodes or edges.");
      return;
    }
    for (const key of arrays) if (new Set(candidate[key]).size !== candidate[key].length) add("duplicate-result", `The route contains duplicate ${key}.`);
    const nodes = new Set(candidate.totalNodeIds);
    const keys = new Set(candidate.totalEdgeKeys);
    const missing = [...new Set([...base, ...goals])].filter((id) => !nodes.has(id));
    if (missing.length) add("missing-required", "The route is missing required base or goal nodes.", missing);
    const unavailable = [...nodes].filter((id) => !allowed.has(id));
    if (unavailable.length) add("unavailable-node", "The route contains unknown, excluded, locked or non-main-tree nodes.", unavailable);
    if (!sameSet(new Set(candidate.addedNodeIds), new Set([...nodes].filter((id) => !base.has(id))))) add("added-nodes", "The new-node list does not match the route minus the base.");
    if (!sameSet(new Set(candidate.orderedNodeIds), nodes) || candidate.orderedNodeIds[0] !== root) add("node-order", "The apply order does not contain every route node exactly once from its path start.");
    const earlier = new Set<string>();
    const orderNeighbors = new Map<string, string[]>();
    for (const key of keys) {
      const pair = edgePairs.get(key);
      if (!pair) continue;
      for (const [a, b] of [pair, [pair[1], pair[0]]] as const) {
        const neighbors = orderNeighbors.get(a) ?? [];
        neighbors.push(b);
        orderNeighbors.set(a, neighbors);
      }
    }
    for (const id of candidate.orderedNodeIds) {
      if (earlier.size && !(orderNeighbors.get(id) ?? []).some((neighbor) => earlier.has(neighbor))) {
        add("node-order", "The apply/prune order contains a node before its connecting path.", [id]);
        break;
      }
      earlier.add(id);
    }
    if ([...baseEdges].some((key) => !keys.has(key))) add("missing-base-edge", "The route removed an existing base connection.");
    if (!sameSet(new Set(candidate.addedEdgeKeys), new Set([...keys].filter((key) => !baseEdges.has(key))))) add("added-edges", "The new-edge list does not match the route minus the base connections.");
    checkEdges(keys, nodes, "route", add);
    if (root && connected(nodes, keys, root).size !== nodes.size) add("disconnected-result", "The route is not connected to its path start.");
    const paid = countMainPassivePoints(request.graph, candidate.addedNodeIds);
    if (!Number.isInteger(candidate.pointCost) || candidate.pointCost < 0 || candidate.pointCost !== paid) add("point-count", "The route point count does not match its unique new main-tree nodes.");
    const limit = mainLimit;
    if (hasMainPointCap(request) && countMainPassivePoints(request.graph, candidate.totalNodeIds) > limit) add("point-budget", "The route exceeds the available main-tree point budget.");
    for (const component of weaponComponents) if (!component.attachments.some((id) => nodes.has(id))) add("weapon-attachment", `The route disconnects a fixed W${component.set} branch.`, component.nodeIds);
    if (request.mode === "weighted") {
      const w = candidate.weighted;
      if (!w || !Number.isFinite(w.score) || !Number.isInteger(w.baselinePointCost) || w.baselinePointCost < 0) {
        add("weighted-metadata", "The weighted route is missing valid score or baseline details.");
      } else {
        const expectedMax = request.pointBudgetMode === "all-available"
          ? Math.max(0, limit - countMainPassivePoints(request.graph, request.baseNodeIds))
          : Math.min(Math.max(0, limit - countMainPassivePoints(request.graph, request.baseNodeIds)), w.baselinePointCost + (request.extraPointBudget ?? 5));
        if (w.maxPointCost !== expectedMax || candidate.pointCost > expectedMax) add("point-budget", "The weighted route exceeds or misstates its selected point budget.");
        if (request.pointBudgetMode === "all-available" && (w.basePointCost !== countMainPassivePoints(request.graph, request.baseNodeIds)
          || w.totalPointLimit !== limit || w.pointBudgetMode !== "all-available")) add("point-budget", "The weighted route misstates its base points or total point limit.");
      }
    }
  }

  return { issues, fingerprint, preparedRequest, validateResult };
}

export function buildGoalsValidationFailure(issues: BuildGoalsValidationIssue[]): BuildGoalsOptimizeResult {
  return {
    status: "error", message: issues.map((issue) => issue.message).join(" "), validationIssues: issues,
    addedNodeIds: [], addedEdgeKeys: [], totalNodeIds: [], totalEdgeKeys: [], orderedNodeIds: [], pointCost: 0, unreachableGoalNodeIds: [],
  };
}

export function runValidatedBuildGoalsOptimization(
  request: BuildGoalsOptimizeRequest,
  solve: (prepared: BuildGoalsOptimizeRequest, progress: (result: BuildGoalsOptimizeResult) => void) => BuildGoalsOptimizeResult,
  onProgress: (result: BuildGoalsOptimizeResult) => void = () => undefined,
): BuildGoalsOptimizeResult {
  const validation = createBuildGoalsValidation(request);
  if (validation.issues.length) return buildGoalsValidationFailure(validation.issues);
  let invalid: BuildGoalsOptimizeResult | undefined;
  const checked = (result: BuildGoalsOptimizeResult) => {
    if (invalid) return invalid;
    const issues = validation.validateResult(result, false);
    if (issues.length) return (invalid = buildGoalsValidationFailure(issues));
    return result.status === "success" ? { ...result, treeFingerprint: validation.fingerprint } : result;
  };
  try {
    const result = solve(validation.preparedRequest, (progress) => {
      const next = checked(progress);
      if (invalid) throw new Error("Optimizer route validation failed.");
      if (next.status === "success") onProgress(next);
    });
    return checked(result);
  } catch (error) {
    return invalid ?? buildGoalsValidationFailure([{ code: "solver-error", kind: "invalid", message: error instanceof Error ? error.message : "Build goal optimization failed." }]);
  }
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

function requestShapeIssue(request: BuildGoalsOptimizeRequest): BuildGoalsValidationIssue | undefined {
  const strings = (value: unknown) => Array.isArray(value) && value.every((id) => typeof id === "string" && id.length > 0);
  if (!request || !strings(request.baseNodeIds) || !strings(request.baseEdgeKeys) || !strings(request.goalNodeIds)
    || request.weaponSets !== undefined && (!request.weaponSets || !request.weaponSets.allocations
      || !strings(request.weaponSets.allocations[1]) || !strings(request.weaponSets.allocations[2]) || !strings(request.weaponSets.attachmentNodeIds))
    || request.excludedNodeIds !== undefined && !strings(request.excludedNodeIds)
    || request.rootNodeId !== undefined && (typeof request.rootNodeId !== "string" || !request.rootNodeId)
    || request.visibility !== undefined && (!request.visibility || typeof request.visibility !== "object"
      || request.visibility.selectedAscendancyId !== undefined && typeof request.visibility.selectedAscendancyId !== "string"
      || request.visibility.allocatedAscendancyNodeIds !== undefined && !strings(request.visibility.allocatedAscendancyNodeIds))) {
    return { code: "request-shape", kind: "invalid", message: "The optimization request has unreadable node IDs, connections or visibility state." };
  }
  const graph = request.graph;
  if (!graph || !graph.nodes || Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || !graph.classStarts
    || Object.entries(graph.nodes).some(([id, n]) => !id || !n || id !== n.id || id.includes("::") || !n.flags
      || typeof n.flags !== "object" || !Number.isFinite(n.position?.x) || !Number.isFinite(n.position?.y) || !Array.isArray(n.stats) || n.stats.some((stat) => typeof stat !== "string")
      || Object.values(n.flags).some((value) => value !== undefined && typeof value !== "boolean")
      || n.visibility && (!n.visibility.requiredAscendancy || typeof n.visibility.requiredAscendancy.id !== "string"))
    || graph.edges.some((e) => !e || typeof e.from !== "string" || typeof e.to !== "string")) {
    return { code: "graph-shape", kind: "invalid", message: "The optimization graph has unreadable nodes, positions or connections." };
  }
  return undefined;
}
