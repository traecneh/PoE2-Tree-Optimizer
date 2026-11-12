import {
  buildOptimizerGraph, findShortestNodeCostRoutes, optimizeBuildGoalsAnytime,
  routeCandidateFromSolution, routeNodeIndexesFromSearch,
  type BuildGoalsAnytimeOptions, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult,
  type BuildGoalsRouteCandidate,
} from "./buildGoalsOptimizer";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues } from "./passivePreferences";
import { treeEdgeKey } from "./pathAllocation";
import { countMainPassivePoints } from "./passivePointBudget";
import { availableMainPointLimit } from "./allocationConstraints";
import { runValidatedBuildGoalsOptimization } from "./buildGoalsValidation";
import { isTreeNodeVisible } from "./treeVisibility";
import { optionalBranchExchangeSeeds, optionalPairedBranchExchangeSeeds } from "./weightedBranchExchange";
import { WeightedSearchSchedule, type WeightedRefinement } from "./weightedSearchSchedule";
import { weightedCorridorCandidates } from "./weightedCorridorReroute";
import { weightedJunctionCandidates } from "./weightedJunctionRelocation";

type Solution = { nodeIndexes: Set<number>; edgeKeys: Set<string> };
type RewardPath = { path: number[]; value: number; gain: number; cost: number };
type BundleState = { solution: Solution; pointCost: number; score: number; key: string };

export type WeightedSeedRefreshEvent = {
  round: number; phase: "bundle" | "exchange";
  iteration: number; revision: number; score: number; pointCost: number;
  bundleSeeds: number; exchangeSeeds: number;
};

export type WeightedBuildGoalsOptions = BuildGoalsAnytimeOptions & {
  enableBundleLookahead?: boolean;
  enableBranchExchanges?: boolean;
  enableSeedRefresh?: boolean;
  enablePairedBranchExchanges?: boolean;
  enableCorridorRerouting?: boolean;
  enableJunctionRelocation?: boolean;
  searchSchedule?: "balanced" | "legacy";
  onSearchStep?: (kind: "greedy" | "bundle" | "exchange" | "corridor" | "junction") => void;
  onSeedRefresh?: (event: WeightedSeedRefreshEvent) => void;
  onPairExchange?: (event: { iteration: number; revision: number; score: number; pointCost: number; seeds: number }) => void;
  onCorridorReroute?: (event: { iteration: number; revision: number; score: number; pointCost: number }) => void;
  onJunctionRelocation?: (event: { iteration: number; revision: number; score: number; pointCost: number }) => void;
};

export function runOptimizerRequest(
  request: BuildGoalsOptimizeRequest,
  onProgress: (result: BuildGoalsOptimizeResult) => void = () => undefined,
  options: WeightedBuildGoalsOptions = {},
): BuildGoalsOptimizeResult {
  return request.mode === "weighted"
    ? optimizeWeightedBuildGoals(request, onProgress, options)
    : optimizeBuildGoalsAnytime(request, onProgress, options);
}

export function optimizeWeightedBuildGoals(
  request: BuildGoalsOptimizeRequest,
  onProgress: (result: BuildGoalsOptimizeResult) => void = () => undefined,
  options: WeightedBuildGoalsOptions = {},
): BuildGoalsOptimizeResult {
  return runValidatedBuildGoalsOptimization(request,
    (prepared, progress) => optimizeWeightedBuildGoalsUnchecked(prepared, progress, options), onProgress);
}

function optimizeWeightedBuildGoalsUnchecked(
  request: BuildGoalsOptimizeRequest,
  onProgress: (result: BuildGoalsOptimizeResult) => void,
  options: WeightedBuildGoalsOptions,
): BuildGoalsOptimizeResult {
  const settings = normalizePassiveOptimizationSettings({ ...request, mode: "weighted" });
  if (settings.preferences.length === 0) return failure("Choose at least one passive preference.");
  const baseNodeIds = [...new Set(request.baseNodeIds)].filter((id) => request.graph.nodes[id]);
  const basePointCost = countMainPassivePoints(request.graph, baseNodeIds);
  const totalPointLimit = availableMainPointLimit(request);
  const allAvailable = settings.pointBudgetMode === "all-available";
  const availableNewPoints = Math.max(0, totalPointLimit - basePointCost);
  if (basePointCost > totalPointLimit) {
    return failure(`The current main allocation uses ${basePointCost} points, above its ${totalPointLimit}-point limit. Free some points before optimizing.`);
  }
  const resolveMaxPointCost = (baselineCost: number) => allAvailable ? availableNewPoints : Math.min(availableNewPoints, baselineCost + settings.extraPointBudget);
  const budgetMetadata = allAvailable ? { pointBudgetMode: "all-available" as const, basePointCost, totalPointLimit } : {};
  // Reuse the unchanged shortest engine. Large baselines are bounded searches,
  // not proofs of optimality; never describe their relative budget as exact.
  const baseline = optimizeBuildGoalsAnytime({ ...request, mode: "shortest", pointBudgetMode: undefined, totalPointLimit: undefined }, (progress) => {
    if (progress.status !== "success") return;
    if (progress.pointCost > availableNewPoints) return;
    onProgress({ ...progress, routeCandidates: undefined, weighted: {
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
  const excluded = new Set(request.excludedNodeIds ?? []);
  const allocatedAscendancyNodeIds = new Set(request.visibility?.allocatedAscendancyNodeIds ?? []);
  const blocked = nodeIds.map((id) => {
    const node = request.graph.nodes[id];
    return excluded.has(id) || !isTreeNodeVisible(node, { selectedAscendancyId: request.visibility?.selectedAscendancyId, allocatedAscendancyNodeIds })
      || !allowedSpecialNodes.has(id) && Boolean(node.flags.keystone || node.flags.classStart || node.flags.ascendancy || node.flags.mastery);
  });
  const valuesByNode = new Map(nodeIds.map((id) => [id, passivePreferenceValues(request.graph.nodes[id], settings)]));
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
  let bestRevision = 0;
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
        bestRevision += 1;
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
  const rewardPaths = (solution: Solution, remaining: number, includeNonpositive = false): RewardPath[] => {
    const search = findShortestNodeCostRoutes([...solution.nodeIndexes], adjacency, costs(solution, 0, false));
    const ranked: RewardPath[] = [];
    for (let index = 0; index < nodeIds.length; index += 1) {
      if (scores[index] <= 0 || solution.nodeIndexes.has(index) || search.costs[index] > remaining) continue;
      const path = routeNodeIndexesFromSearch(search, index);
      const newIndexes = path.filter((i) => !solution.nodeIndexes.has(i));
      const gain = newIndexes.reduce((total, i) => total + scores[i], 0);
      if (newIndexes.length && (includeNonpositive || gain > 1e-9)) ranked.push({ path, gain, cost: newIndexes.length, value: gain / newIndexes.length });
    }
    return ranked.sort((a, b) => b.value - a.value);
  };
  function* augmentSteps(initial: Solution, randomized: boolean, shouldStop = options.shouldCancel): Generator<void, Solution, unknown> {
    const solution: Solution = { nodeIndexes: new Set(initial.nodeIndexes), edgeKeys: new Set(initial.edgeKeys) };
    while (solution.nodeIndexes.size - baseIndexes.length < maxPointCost && !shouldStop?.()) {
      const remaining = maxPointCost - (solution.nodeIndexes.size - baseIndexes.length);
      const ranked = rewardPaths(solution, remaining);
      const selected = ranked[randomized ? Math.floor(random() * Math.min(3, ranked.length)) : 0];
      if (!selected) break;
      addPath(solution, selected.path);
      yield;
    }
    return solution;
  }
  const augment = (initial: Solution, randomized: boolean, shouldStop = options.shouldCancel): Solution => {
    const steps = augmentSteps(initial, randomized, shouldStop);
    let next = steps.next();
    while (!next.done) next = steps.next();
    return next.value;
  };

  const bundleState = (solution: Solution): BundleState => ({
    solution, pointCost: solution.nodeIndexes.size - baseIndexes.length,
    score: [...solution.nodeIndexes].reduce((sum, index) => sum + scores[index], 0),
    key: [...solution.nodeIndexes].sort((a, b) => a - b).join("|"),
  });
  const compareStates = (a: BundleState, b: BundleState) => Math.abs(b.score - a.score) > 1e-9
    ? b.score - a.score : a.pointCost - b.pointCost || a.key.localeCompare(b.key);
  const retainBeam = (states: BundleState[], limit: number): BundleState[] => {
    const unique = new Map(states.map((state) => [state.key, state]));
    const groups = new Map<number, BundleState[]>();
    for (const state of [...unique.values()].sort(compareStates)) {
      const group = groups.get(state.pointCost) ?? [];
      group.push(state); groups.set(state.pointCost, group);
    }
    const kept: BundleState[] = [];
    for (let variant = 0; variant < limit && kept.length < limit; variant += 1) {
      for (const group of groups.values()) if (group[variant] && kept.length < limit) kept.push(group[variant]);
    }
    return kept.sort(compareStates);
  };
  function* refineBundle(initial: Solution, exchangeFloor?: BundleState): WeightedRefinement {
    const shouldStop = () => Boolean(options.shouldCancel?.()) || now() - lastImprovedAt >= noImprovementMs;
    const publish = (solution: Solution) => {
      const state = bundleState(solution);
      if (!exchangeFloor || state.score > exchangeFloor.score + 1e-9
        || Math.abs(state.score - exchangeFloor.score) <= 1e-9 && state.pointCost < exchangeFloor.pointCost) consider(materialize(solution));
    };
    let frontier = [bundleState(initial)];
    let finalists: BundleState[] = [];
    // Keep several point-cost/shape alternatives before a deterministic greedy completion.
    for (let depth = 0; depth < (exchangeFloor ? 2 : 3) && frontier.length && !shouldStop(); depth += 1) {
      const expanded: BundleState[] = [];
      for (const state of frontier) {
        if (shouldStop()) break;
        const paths = rewardPaths(state.solution, maxPointCost - state.pointCost, true);
        const byGain = [...paths].sort((a, b) => b.gain - a.gain || a.cost - b.cost);
        const selected = new Map<number, RewardPath>();
        for (const path of [...paths.slice(0, 6), ...byGain.slice(0, 6), ...paths]) {
          if (selected.size >= (exchangeFloor ? 8 : 12)) break;
          selected.set(path.path.at(-1)!, path);
        }
        for (const path of selected.values()) {
          const solution = { nodeIndexes: new Set(state.solution.nodeIndexes), edgeKeys: new Set(state.solution.edgeKeys) };
          addPath(solution, path.path);
          const next = bundleState(solution);
          if (next.pointCost <= maxPointCost) expanded.push(next);
        }
        yield;
      }
      frontier = retainBeam(expanded, exchangeFloor ? 4 : 8);
      for (const state of frontier) {
        if (shouldStop()) break;
        publish(state.solution);
        yield;
      }
      finalists = retainBeam([...finalists, ...frontier], exchangeFloor ? 4 : 12);
    }
    for (const state of finalists) {
      if (shouldStop()) break;
      publish(yield* augmentSteps(state.solution, false, shouldStop));
      yield;
    }
  }
  const bundleSeeds = new Set<string>();
  const exchangeIncumbents = new Set<string>();
  const exchangedSeeds = new Set<string>();
  const pairedIncumbents = new Set<string>();
  const corridorIncumbents = new Set<string>();
  const junctionIncumbents = new Set<string>();
  const required = new Set([...baseIndexes, ...goals]);
  const balanced = options.searchSchedule !== "legacy";
  // Fixed-iteration research/tests use deterministic work quanta, not host speed.
  const schedule = new WeightedSearchSchedule(options.maxIterations !== undefined);
  const shouldStopRefinement = () => Boolean(options.shouldCancel?.()) || now() - lastImprovedAt >= noImprovementMs;
  let pendingRefinements = 0;
  const submit = (kind: "bundle" | "exchange" | "corridor" | "junction", job: WeightedRefinement) => {
    function* observed(): WeightedRefinement {
      try {
        let next = job.next();
        while (!next.done) {
          options.onSearchStep?.(kind);
          yield;
          next = job.next();
        }
      } finally {
        if (balanced) pendingRefinements -= 1;
      }
    }
    if (balanced) { pendingRefinements += 1; schedule.enqueue(observed()); }
    else for (const _ of observed()) { /* Legacy control drains the same refinement. */ }
  };
  const rememberRefreshedSeed = (seen: Set<string>, key: string) => {
    if (seen.has(key)) return false;
    if (seen.size >= 256) seen.delete(seen.values().next().value!);
    seen.add(key);
    return true;
  };
  const submitExchanges = (incumbent: BundleState, refresh = false) => {
    if (exchangeIncumbents.has(incumbent.key)) return 0;
    if (refresh) rememberRefreshedSeed(exchangeIncumbents, incumbent.key);
    else exchangeIncumbents.add(incumbent.key);
    let submitted = 0;
    for (const pruned of optionalBranchExchangeSeeds(incumbent.solution, required, nodeIndexById, scores, baseIndexes[0], 2, shouldStopRefinement)) {
      const key = bundleState(pruned).key;
      if (exchangedSeeds.has(key) || shouldStopRefinement()) continue;
      if (refresh) rememberRefreshedSeed(exchangedSeeds, key);
      else exchangedSeeds.add(key);
      submit("exchange", refineBundle(pruned, incumbent));
      submitted += 1;
    }
    return submitted;
  };
  let lastRefreshRevision = 0;
  let nextRefreshIteration = 16;
  let refreshRound = 0;
  let pendingRefreshExchange: number | undefined;
  let lastPairRevision = 0;
  let nextPairIteration = 16;
  let lastCorridorRevision = 0;
  let nextCorridorIteration = 16;
  let lastJunctionRevision = 0;
  let nextJunctionIteration = 16;
  function* refineCorridors(incumbent: BundleState): WeightedRefinement {
    for (const candidate of weightedCorridorCandidates(incumbent.solution, indexed, required, scores, blocked, maxPointCost, request.baseEdgeKeys, shouldStopRefinement)) {
      if (shouldStopRefinement()) return;
      if (candidate) {
        const state = bundleState(candidate);
        if (state.score > incumbent.score + 1e-9 || Math.abs(state.score - incumbent.score) <= 1e-9 && state.pointCost < incumbent.pointCost) consider(materialize(candidate));
      }
      yield;
    }
  }
  function* refineJunctions(incumbent: BundleState): WeightedRefinement {
    for (const candidate of weightedJunctionCandidates(incumbent.solution, indexed, required, scores, blocked, maxPointCost, request.baseEdgeKeys, shouldStopRefinement)) {
      if (shouldStopRefinement()) return;
      if (candidate) {
        const state = bundleState(candidate);
        if (state.score > incumbent.score + 1e-9 || Math.abs(state.score - incumbent.score) <= 1e-9 && state.pointCost < incumbent.pointCost) consider(materialize(candidate));
      }
      yield;
    }
  }
  const reportRefresh = (round: number, phase: "bundle" | "exchange", bundles: number, exchanges: number) => {
    if (bundles || exchanges) options.onSeedRefresh?.({ round, phase, iteration, revision: bestRevision,
      score: best!.weighted!.score, pointCost: best!.pointCost, bundleSeeds: bundles, exchangeSeeds: exchanges });
  };

  for (const [index, route] of (baseline.routeCandidates ?? [baseline]).entries()) {
    const candidate = { ...route, label: index === 0 ? "shortest-baseline" : "baseline-alternative" };
    consider(candidate);
    consider(materialize(augment(fromCandidate(candidate), false)));
  }
  if (options.shouldCancel?.()) return { ...result(), status: "cancelled", completeReason: "cancelled" };
  if (maxPointCost === 0) return { ...result(), completeReason: "bounded", message: "No unspent points remain within the selected point budget." };
  if (!scores.some((score) => score > 0)) return { ...result(), completeReason: "bounded", message: "No supported positive effects match the selected preferences." };

  while (now() - lastImprovedAt < noImprovementMs && (options.maxIterations === undefined || iteration < options.maxIterations)) {
    if (options.shouldCancel?.()) return { ...result(), status: "cancelled", completeReason: "cancelled" };
    const fastStarted = performance.now();
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
    options.onSearchStep?.("greedy");
    schedule.recordFastTurn(performance.now() - fastStarted);
    if (options.enableBundleLookahead !== false && iteration % 8 === 0 && bundleSeeds.size < 2 && !options.shouldCancel?.()) {
      const seed = bundleSeeds.size === 0 ? fromCandidate(baseline) : solution;
      const state = bundleState(seed);
      if (state.pointCost <= maxPointCost && goals.every((goal) => seed.nodeIndexes.has(goal)) && !bundleSeeds.has(state.key)) {
        bundleSeeds.add(state.key);
        submit("bundle", refineBundle(seed));
      }
    }
    // Do not spend a limited exchange attempt on a partly refined incumbent.
    if (pendingRefreshExchange !== undefined && pendingRefinements === 0 && !shouldStopRefinement()) {
      const round = pendingRefreshExchange;
      pendingRefreshExchange = undefined;
      reportRefresh(round, "exchange", 0, submitExchanges(bundleState(fromCandidate(best!)), true));
    }
    const exchangeTurn = balanced ? pendingRefinements === 0 : iteration % 8 === 0;
    if (options.enableBranchExchanges !== false && iteration >= 8 && exchangeTurn && exchangeIncumbents.size < 2 && exchangedSeeds.size < 4) {
      submitExchanges(bundleState(fromCandidate(best!)));
    }
    // Coalesce improvements while work is pending; do not queue every intermediate
    // best or spend refreshes on signature-only ties. Credit still comes from fast work.
    if (balanced && options.enableSeedRefresh !== false && pendingRefinements === 0 && pendingRefreshExchange === undefined
      && iteration >= nextRefreshIteration && bestRevision > lastRefreshRevision && !shouldStopRefinement()) {
      lastRefreshRevision = bestRevision;
      nextRefreshIteration = iteration + 16;
      refreshRound += 1;
      const incumbent = bundleState(fromCandidate(best!));
      let bundles = 0;
      if (options.enableBundleLookahead !== false && incumbent.pointCost < maxPointCost
        && rememberRefreshedSeed(bundleSeeds, incumbent.key)) {
        submit("bundle", refineBundle(incumbent.solution));
        bundles = 1;
      }
      if (bundles) {
        if (options.enableBranchExchanges !== false) pendingRefreshExchange = refreshRound;
        reportRefresh(refreshRound, "bundle", bundles, 0);
      } else if (options.enableBranchExchanges !== false) {
        reportRefresh(refreshRound, "exchange", 0, submitExchanges(incumbent, true));
      }
    }
    if (balanced && options.enableBranchExchanges !== false && options.enablePairedBranchExchanges !== false
      && pendingRefinements === 0 && pendingRefreshExchange === undefined
      && iteration >= nextPairIteration && bestRevision > lastPairRevision && !shouldStopRefinement()) {
      lastPairRevision = bestRevision;
      nextPairIteration = iteration + 16;
      const incumbent = bundleState(fromCandidate(best!));
      let seeds = 0;
      if (rememberRefreshedSeed(pairedIncumbents, incumbent.key)) {
        for (const pruned of optionalPairedBranchExchangeSeeds(incumbent.solution, required, nodeIndexById, scores, baseIndexes[0], 2, shouldStopRefinement)) {
          if (shouldStopRefinement()) break;
          if (!rememberRefreshedSeed(exchangedSeeds, bundleState(pruned).key)) continue;
          submit("exchange", refineBundle(pruned, incumbent));
          seeds += 1;
        }
      }
      if (seeds) options.onPairExchange?.({ iteration, revision: bestRevision, score: best!.weighted!.score, pointCost: best!.pointCost, seeds });
    }
    if (balanced && options.enableCorridorRerouting !== false && pendingRefinements === 0 && pendingRefreshExchange === undefined
      && iteration >= nextCorridorIteration && bestRevision > lastCorridorRevision && !shouldStopRefinement()) {
      lastCorridorRevision = bestRevision;
      nextCorridorIteration = iteration + 16;
      const incumbent = bundleState(fromCandidate(best!));
      if (rememberRefreshedSeed(corridorIncumbents, incumbent.key)) {
        submit("corridor", refineCorridors(incumbent));
        options.onCorridorReroute?.({ iteration, revision: bestRevision, score: best!.weighted!.score, pointCost: best!.pointCost });
      }
    }
    if (balanced && options.enableJunctionRelocation !== false && pendingRefinements === 0 && pendingRefreshExchange === undefined
      && iteration >= nextJunctionIteration && bestRevision > lastJunctionRevision && !shouldStopRefinement()) {
      lastJunctionRevision = bestRevision;
      nextJunctionIteration = iteration + 16;
      const incumbent = bundleState(fromCandidate(best!));
      if (rememberRefreshedSeed(junctionIncumbents, incumbent.key)) {
        submit("junction", refineJunctions(incumbent));
        options.onJunctionRelocation?.({ iteration, revision: bestRevision, score: best!.weighted!.score, pointCost: best!.pointCost });
      }
    }
    if (balanced) schedule.advance(shouldStopRefinement);
    iteration += 1;
  }
  if (options.shouldCancel?.()) return { ...result(), status: "cancelled", completeReason: "cancelled" };
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
