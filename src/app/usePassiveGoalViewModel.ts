import { useMemo } from "react";
import { findAllocationDistancesFrom } from "../tree/pathAllocation";
import { createPassiveSearchIndex, searchPassiveTree } from "../tree/passiveSearch";
import type { TreeGraph } from "../tree/types";
import type { BuildGoalsPanelGoal } from "../viewer/BuildGoalsPanel";
import type { PassiveSearchPanelResult } from "../viewer/PassiveSearchPanel";

type UsePassiveGoalViewModelOptions = {
  visibleGraph: TreeGraph;
  searchQuery: string;
  buildGoalNodeIds: string[];
  allocationDistanceNodeIds: ReadonlySet<string>;
  displayAllocatedNodeIds: ReadonlySet<string>;
};

export function usePassiveGoalViewModel({
  visibleGraph,
  searchQuery,
  buildGoalNodeIds,
  allocationDistanceNodeIds,
  displayAllocatedNodeIds,
}: UsePassiveGoalViewModelOptions) {
  const passiveSearchIndex = useMemo(
    () => createPassiveSearchIndex(visibleGraph),
    [visibleGraph],
  );
  const searchResults = useMemo(
    () => searchPassiveTree(passiveSearchIndex, searchQuery),
    [passiveSearchIndex, searchQuery],
  );
  const allocationDistances = useMemo(
    () => findAllocationDistancesFrom(visibleGraph, allocationDistanceNodeIds),
    [allocationDistanceNodeIds, visibleGraph],
  );
  const buildGoalPanelGoals = useMemo<BuildGoalsPanelGoal[]>(
    () => buildGoalNodeIds.flatMap((nodeId) => {
      const node = visibleGraph.nodes[nodeId];
      if (!node) return [];
      return [{
        node,
        allocationDistance: allocationDistances.get(nodeId),
        reached: allocationDistanceNodeIds.has(nodeId),
      }];
    }),
    [allocationDistanceNodeIds, allocationDistances, buildGoalNodeIds, visibleGraph.nodes],
  );
  const searchResultsWithAllocationDistance = useMemo<PassiveSearchPanelResult[]>(
    () => searchResults
      .map((result, searchIndex) => ({
        result: {
          ...result,
          allocationDistance: allocationDistances.get(result.node.id),
          allocated: displayAllocatedNodeIds.has(result.node.id),
        },
        searchIndex,
      }))
      .sort((left, right) => (
        compareAllocationDistances(left.result.allocationDistance, right.result.allocationDistance)
        || left.searchIndex - right.searchIndex
      ))
      .map(({ result }) => result),
    [allocationDistances, displayAllocatedNodeIds, searchResults],
  );
  const searchMatchNodeIds = useMemo(
    () => new Set(searchResults.map(({ node }) => node.id)),
    [searchResults],
  );

  return {
    allocationDistances,
    buildGoalPanelGoals,
    searchResultsWithAllocationDistance,
    searchMatchNodeIds,
  };
}

function compareAllocationDistances(left: number | undefined, right: number | undefined): number {
  return allocationDistanceSortValue(left) - allocationDistanceSortValue(right);
}

function allocationDistanceSortValue(distance: number | undefined): number {
  return distance ?? Number.POSITIVE_INFINITY;
}
