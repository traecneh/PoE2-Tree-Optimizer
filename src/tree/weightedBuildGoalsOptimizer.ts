import {
  buildOptimizerGraph, findShortestNodeCostRoutes, optimizeBuildGoalsAnytime,
  routeCandidateFromSolution, routeNodeIndexesFromSearch,
  type BuildGoalsAnytimeOptions, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult,
  type BuildGoalsRouteCandidate,
} from "./buildGoalsOptimizer";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues } from "./passivePreferences";
import { treeEdgeKey } from "./pathAllocation";
import { countMainPassivePoints, normalizeMainPointLimit } from "./passivePointBudget";

type Solution = { nodeIndexes: Set<number>; edgeKeys: Set<string> };

export function runOptimizerRequest(
  request: BuildGoalsOptimizeRequest,
  onProgress: (result: BuildGoalsOptimizeResult) => void = () => undefined,
  options: BuildGoalsAnytimeOptions = {},
): BuildGoalsOptimizeResult {
  return request.mode === "weighted"
    ? optimizeWeightedBuildGoals(request, onProgress, options)
    : optimizeBuildGoalsAnytime(request, onProgress, options);
}

export function optimizeWeightedBuildGoals(
  request: BuildGoalsOptimizeRequest,
  onProgress: (result: BuildGoalsOptimizeResult) => void = () => undefined,
  options: BuildGoalsAnytimeOptions = {},
): BuildGoalsOptimizeResult {
  const settings = normalizePassiveOptimizationSettings({ ...request, mode: "weighted" });
  if (settings.preferences.length === 0) return failure("Choose at least one passive preference.");
  const baseNodeIds = [...new Set(request.baseNodeIds)].filter((id) => request.graph.nodes[id]);
  const basePointCost = countMainPassivePoints(request.graph, baseNodeIds);
  const totalPointLimit = normalizeMainPointLimit(request.totalPointLimit);
  const allAvailable = settings.pointBudgetMode === "all-available";
  const availableNewPoints = Math.max(0, totalPointLimit - basePointCost);
  if (allAvailable && basePointCost > totalPointLimit) {
    return failure(`The current main allocation uses ${basePointCost} points, above its ${totalPointLimit}-point limit. Free some points before optimizing.`);
  }
  const resolveMaxPointCost = (baselineCost: number) => allAvailable ? availableNewPoints : baselineCost + settings.extraPointBudget;
  const budgetMetadata = allAvailable ? { pointBudgetMode: "all-available" as const, basePointCost, totalPointLimit } : {};
  // Reuse the unchanged shortest engine. Large baselines are bounded searches,
  // not proofs of optimality; never describe their relative budget as exact.
  const baseline = optimizeBuildGoalsAnytime({ ...request, mode: "shortest" }, (progress) => {
    if (progress.status !== "success") return;
    onProgress({ ...progress, weighted: {
      ...budgetMetadata,
      score: 0, baselinePointCost: progress.pointCost, maxPointCost: resolveMaxPointCost(progress.pointCost),
      baselineExact: progress.searchType === "exact", contributions: [], stage: "baseline",
    } });
  }, { ...options, maxIterations: Math.min(options.maxIterations ?? 32, 32) });
  if (baseline.status !== "success") return baseline;
  if (options.shouldCancel?.()) return { ...baseline, status: "cancelled" };
  const maxPointCost = resolveMaxPointCost(baseline.pointCost);
  if (baseline.pointCost > maxPointCost) {
    return failure(`The shortest route found needs ${baseline.pointCost} new points, but only ${maxPointCost} remain within the ${totalPointLimit}-point main-tree limit. Reduce goals or free allocated points.`);
  }

  const indexed = buildOptimizerGraph(request.graph, baseNodeIds);
  const { nodeIds, nodeIndexById, adjacency, baseNodeSet } = indexed;
  const baseIndexes = baseNodeIds.map((id) => nodeIndexById.get(id)!);
  const goals = [...new Set(request.goalNodeIds)].flatMap((id) => {
    const index = nodeIndexById.get(id);
    return index === undefined ? [] : [index];
  });
  const allowedSpecialNodes = new Set([...baseNodeIds, ...request.goalNodeIds, ...baseline.totalNodeIds]);
  const blocked = nodeIds.map((id) => {
    const node = request.graph.nodes[id];
    return !allowedSpecialNodes.has(id) && Boolean(node.flags.keystone || node.flags.classStart || node.flags.ascendancy || node.flags.mastery);
  });
  const valuesByNode = new Map(nodeIds.map((id) => [id, passivePreferenceValues(request.graph.nodes[id])]));
  const scores = nodeIds.map((id, index) => baseNodeSet.has(id) || blocked[index] ? 0
    : settings.preferences.reduce((score, preference) => score + (valuesByNode.get(id)![preference.id] ?? 0)
      / passivePreferenceCatalog.find((effect) => effect.id === preference.id)!.scale * preference.weight, 0));
  const metadata = { ...budgetMetadata, baselinePointCost: baseline.pointCost, maxPointCost, baselineExact: baseline.searchType === "exact", stage: "preferences" as const };
  const now = options.now ?? Date.now;
  const noImprovementMs = options.noImprovementMs ?? 60_000;
  let lastImprovedAt = now();
  let candidates: BuildGoalsRouteCandidate[] = [];
  let baselineCandidate: BuildGoalsRouteCandidate | undefined;
  let best: BuildGoalsRouteCandidate | undefined;
  const history: number[] = [];
  let iteration = 0;
  let seed = options.randomSeedStart ?? 1701;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const result = (): BuildGoalsOptimizeResult => ({
    ...best!, status: "success", unreachableGoalNodeIds: [], searchType: "anytime",
    routeCandidates: [...candidates], improvementHistory: [...history], weighted: best!.weighted,
  });
  const consider = (candidate: BuildGoalsRouteCandidate) => {
    if (candidate.pointCost > maxPointCost || goals.some((index) => !candidate.totalNodeIds.includes(nodeIds[index]))) return;
    const contributions = settings.preferences.map((preference) => {
      const effect = passivePreferenceCatalog.find((effect) => effect.id === preference.id)!;
      let score = 0;
      let nodeCount = 0;
      for (const id of candidate.addedNodeIds) {
        const value = valuesByNode.get(id)![preference.id] ?? 0;
        score += value / effect.scale * preference.weight;
        if (value !== 0) nodeCount += 1;
      }
      return { id: preference.id, label: effect.label, score, nodeCount };
    });
    candidate = { ...candidate, weighted: { ...metadata, score: contributions.reduce((total, row) => total + row.score, 0), contributions } };
    if (candidate.label === "shortest-baseline") baselineCandidate = candidate;
    if (!candidates.some((current) => signature(current) === signature(candidate))) {
      const limit = Math.max(2, options.candidateLimit ?? 18);
      const byCost = new Map<number, BuildGoalsRouteCandidate[]>();
      for (const route of [...candidates, candidate].sort(compare)) {
        const group = byCost.get(route.pointCost) ?? [];
        group.push(route);
        byCost.set(route.pointCost, group);
      }
      const retained: BuildGoalsRouteCandidate[] = [];
      for (let variant = 0; variant < 3; variant += 1) {
        for (const group of byCost.values()) {
          if (group[variant] && retained.length < limit) retained.push(group[variant]);
        }
      }
      candidates = retained.sort(compare);
      if (baselineCandidate && !candidates.some((current) => signature(current) === signature(baselineCandidate!))) {
        candidates = [...candidates.slice(0, limit - 1), baselineCandidate].sort(compare);
      }
    }
    if (!best || compare(candidate, best) < 0) {
      const meaningfulImprovement = !best || candidate.weighted!.score > best.weighted!.score + 1e-9 || candidate.pointCost < best.pointCost;
      best = candidate;
      if (meaningfulImprovement) {
        lastImprovedAt = now();
        history.push(candidate.weighted!.score);
        onProgress(result());
      }
    }
  };
  const fromCandidate = (candidate: BuildGoalsRouteCandidate): Solution => ({
    nodeIndexes: new Set(candidate.totalNodeIds.map((id) => nodeIndexById.get(id)!)),
    edgeKeys: new Set(candidate.totalEdgeKeys),
  });
  const materialize = (solution: Solution) => routeCandidateFromSolution("weighted", solution, baseNodeIds, request.baseEdgeKeys, indexed);
  const addPath = (solution: Solution, path: number[]) => {
    path.forEach((index) => solution.nodeIndexes.add(index));
    for (let i = 1; i < path.length; i += 1) solution.edgeKeys.add(treeEdgeKey(nodeIds[path[i - 1]], nodeIds[path[i]]));
  };
  const costs = (solution: Solution, strength: number, noise: boolean) => scores.map((score, index) => (
    solution.nodeIndexes.has(index) ? 0 : blocked[index] ? Infinity
      : (1 + Math.max(0, -score) * strength) / (1 + Math.max(0, score) * strength) * (noise ? 0.65 + random() * 0.7 : 1)
  ));
  const augment = (initial: Solution, randomized: boolean): Solution => {
    const solution: Solution = { nodeIndexes: new Set(initial.nodeIndexes), edgeKeys: new Set(initial.edgeKeys) };
    while (solution.nodeIndexes.size - baseIndexes.length < maxPointCost && !options.shouldCancel?.()) {
      const remaining = maxPointCost - (solution.nodeIndexes.size - baseIndexes.length);
      const search = findShortestNodeCostRoutes([...solution.nodeIndexes], adjacency, costs(solution, 0, false));
      const ranked: { path: number[]; value: number }[] = [];
      for (let index = 0; index < nodeIds.length; index += 1) {
        if (scores[index] <= 0 || solution.nodeIndexes.has(index) || search.costs[index] > remaining) continue;
        const path = routeNodeIndexesFromSearch(search, index);
        const newIndexes = path.filter((i) => !solution.nodeIndexes.has(i));
        const gain = newIndexes.reduce((total, i) => total + scores[i], 0);
        if (newIndexes.length && gain > 1e-9) ranked.push({ path, value: gain / newIndexes.length });
      }
      ranked.sort((a, b) => b.value - a.value);
      const selected = ranked[randomized ? Math.floor(random() * Math.min(3, ranked.length)) : 0];
      if (!selected) break;
      addPath(solution, selected.path);
    }
    return solution;
  };

  for (const [index, route] of (baseline.routeCandidates ?? [baseline]).entries()) {
    const candidate = { ...route, label: index === 0 ? "shortest-baseline" : "baseline-alternative" };
    consider(candidate);
    consider(materialize(augment(fromCandidate(candidate), false)));
  }
  if (maxPointCost === 0) return { ...result(), completeReason: "bounded", message: "No unspent points remain within the selected point budget." };
  if (!scores.some((score) => score > 0)) return { ...result(), completeReason: "bounded", message: "No supported positive effects match the selected preferences." };

  while (now() - lastImprovedAt < noImprovementMs && (options.maxIterations === undefined || iteration < options.maxIterations)) {
    if (options.shouldCancel?.()) return { ...result(), status: "cancelled", completeReason: "cancelled" };
    const solution: Solution = { nodeIndexes: new Set(baseIndexes), edgeKeys: new Set(request.baseEdgeKeys) };
    const strength = [0, 0.25, 0.75, 1.5, 3, 8][iteration % 6];
    while (goals.some((goal) => !solution.nodeIndexes.has(goal))) {
      const search = findShortestNodeCostRoutes([...solution.nodeIndexes], adjacency, costs(solution, strength, iteration > 5));
      const remainingGoals = goals.filter((goal) => !solution.nodeIndexes.has(goal))
        .sort((a, b) => search.costs[a] - search.costs[b]);
      const goal = remainingGoals[iteration > 5 ? Math.floor(random() * Math.min(3, remainingGoals.length)) : 0];
      if (!Number.isFinite(search.costs[goal])) break;
      addPath(solution, routeNodeIndexesFromSearch(search, goal));
      if (solution.nodeIndexes.size - baseIndexes.length > maxPointCost) break;
    }
    const candidate = materialize(solution);
    consider(candidate);
    if (candidate.pointCost <= maxPointCost) consider(materialize(augment(solution, iteration > 5)));
    iteration += 1;
  }
  return { ...result(), completeReason: options.maxIterations !== undefined && iteration >= options.maxIterations ? "iteration-limit" : "no-improvement" };
}

function signature(candidate: BuildGoalsRouteCandidate): string { return [...candidate.totalNodeIds].sort().join("|"); }
function compare(a: BuildGoalsRouteCandidate, b: BuildGoalsRouteCandidate): number {
  const scoreDelta = (b.weighted?.score ?? 0) - (a.weighted?.score ?? 0);
  return Math.abs(scoreDelta) > 1e-9 ? scoreDelta : a.pointCost - b.pointCost || signature(a).localeCompare(signature(b));
}
function failure(message: string): BuildGoalsOptimizeResult {
  return { status: "error", message, addedNodeIds: [], addedEdgeKeys: [], totalNodeIds: [], totalEdgeKeys: [], orderedNodeIds: [], pointCost: 0, unreachableGoalNodeIds: [] };
}
