import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { findShortestAllocationPathFromAllocated } from "../tree/pathAllocation";
import type { TreeGraph, TreeNode } from "../tree/types";
import {
  allocationPathFromNodePath,
  appendUniqueNodePath,
  edgeKeysFromNodePath,
  filterEdgeKeysToNodeIds,
  mergeEdgeKeys,
  nodePathEndpoint,
  pendingAllocationEdgeKeys,
  pendingAllocationNodeIds,
  pruneCommittedNodePathOnClick,
  pruneNodePathOnClick,
  type AllocationPlan,
} from "./allocationPlan";

type UseTreeInteractionStateOptions = {
  visibleGraph: TreeGraph;
  allocationPlan: AllocationPlan;
  setAllocationPlan: Dispatch<SetStateAction<AllocationPlan>>;
  pathStartNodeId: string | undefined;
  allocationDistanceNodeIds: ReadonlySet<string>;
  currentAllocationEdgeKeys: ReadonlySet<string>;
  clearOptimizedRouteState: () => void;
  toggleAscendancyAllocationNode?: (node: TreeNode) => void;
};

export function useTreeInteractionState({
  visibleGraph,
  allocationPlan,
  setAllocationPlan,
  pathStartNodeId,
  allocationDistanceNodeIds,
  currentAllocationEdgeKeys,
  clearOptimizedRouteState,
  toggleAscendancyAllocationNode,
}: UseTreeInteractionStateOptions) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [hoverPathPreviewEnabled, setHoverPathPreviewEnabled] = useState(false);
  const [hoverPreviewTargetNodeId, setHoverPreviewTargetNodeId] = useState<string | undefined>();
  const [goalShortcutActive, setGoalShortcutActive] = useState(false);

  const selectedNode = useMemo(
    () => (selectedNodeId ? visibleGraph.nodes[selectedNodeId] : undefined),
    [selectedNodeId, visibleGraph.nodes],
  );
  const currentPathEndpointNodeId = nodePathEndpoint(allocationPlan.previewNodePath)
    ?? nodePathEndpoint(allocationPlan.committedNodePath)
    ?? pathStartNodeId;
  const previewRouteNodePath = allocationPlan.previewRouteNodePath;
  const previewRouteEndpointNodeId = nodePathEndpoint(previewRouteNodePath);
  const allocationPath = useMemo(
    () => (selectedNodeId && selectedNodeId === previewRouteEndpointNodeId
      ? allocationPathFromNodePath(previewRouteNodePath)
      : undefined),
    [previewRouteEndpointNodeId, previewRouteNodePath, selectedNodeId],
  );
  const allocationPathNodeIds = useMemo(
    () => pendingAllocationNodeIds(
      allocationPlan.previewNodePath,
      allocationPlan.committedNodePath,
      previewRouteNodePath,
      allocationPlan.previewHighlightNodeIds,
    ),
    [
      allocationPlan.committedNodePath,
      allocationPlan.previewHighlightNodeIds,
      allocationPlan.previewNodePath,
      previewRouteNodePath,
    ],
  );
  const allocationPathEdgeKeys = useMemo(
    () => pendingAllocationEdgeKeys(
      allocationPlan.previewEdgeKeys,
      allocationPlan.committedEdgeKeys,
      allocationPlan.previewHighlightEdgeKeys,
    ),
    [
      allocationPlan.committedEdgeKeys,
      allocationPlan.previewEdgeKeys,
      allocationPlan.previewHighlightEdgeKeys,
    ],
  );
  const hoverAllocationPath = useMemo(
    () => (hoverPathPreviewEnabled
      && !goalShortcutActive
      && hoverPreviewTargetNodeId
      && !allocationDistanceNodeIds.has(hoverPreviewTargetNodeId)
      ? findShortestAllocationPathFromAllocated(visibleGraph, allocationDistanceNodeIds, hoverPreviewTargetNodeId)
      : undefined),
    [allocationDistanceNodeIds, goalShortcutActive, hoverPathPreviewEnabled, hoverPreviewTargetNodeId, visibleGraph],
  );
  const hoverAllocationPathNodeIds = useMemo(
    () => new Set((hoverAllocationPath?.nodeIds ?? []).filter((nodeId) => !allocationDistanceNodeIds.has(nodeId))),
    [allocationDistanceNodeIds, hoverAllocationPath],
  );
  const hoverAllocationPathEdgeKeys = useMemo(
    () => new Set((hoverAllocationPath?.edgeKeys ?? []).filter((edgeKey) => !currentAllocationEdgeKeys.has(edgeKey))),
    [currentAllocationEdgeKeys, hoverAllocationPath],
  );
  const allocationPathNodeNames = useMemo(
    () => allocationPath?.nodeIds.map((nodeId) => visibleGraph.nodes[nodeId]?.name ?? nodeId) ?? [],
    [allocationPath, visibleGraph.nodes],
  );

  const clearTreeInteractionState = useCallback(() => {
    setSelectedNodeId(undefined);
    setHoverPreviewTargetNodeId(undefined);
  }, []);

  const updateHoverPreviewTarget = useCallback((nodeId: string | undefined) => {
    setHoverPreviewTargetNodeId(hoverPathPreviewEnabled && !goalShortcutActive ? nodeId : undefined);
  }, [goalShortcutActive, hoverPathPreviewEnabled]);

  const toggleHoverPathPreview = useCallback((enabled: boolean) => {
    setHoverPathPreviewEnabled(enabled);
    if (!enabled) {
      setHoverPreviewTargetNodeId(undefined);
    }
  }, []);

  const allocatePreviewPath = useCallback(() => {
    if (!allocationPath || allocationPath.pointCost === 0) return;
    clearOptimizedRouteState();
    setAllocationPlan((current) => ({
      committedNodePath: current.previewNodePath,
      committedEdgeKeys: current.previewEdgeKeys,
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    }));
  }, [allocationPath, clearOptimizedRouteState, setAllocationPlan]);

  const selectTreeNode = useCallback((nodeId: string) => {
    clearOptimizedRouteState();
    const node = visibleGraph.nodes[nodeId];
    if (!node) return;
    if (node.flags.ascendancy) {
      setSelectedNodeId(nodeId);
      setHoverPreviewTargetNodeId(undefined);
      toggleAscendancyAllocationNode?.(node);
      return;
    }

    const committedNodeIndex = allocationPlan.committedNodePath.lastIndexOf(nodeId);
    if (committedNodeIndex !== -1) {
      const committedNodePath = pruneCommittedNodePathOnClick(allocationPlan.committedNodePath, nodeId);
      setSelectedNodeId(committedNodePath.includes(nodeId) ? nodeId : undefined);
      setAllocationPlan({
        committedNodePath,
        committedEdgeKeys: filterEdgeKeysToNodeIds(allocationPlan.committedEdgeKeys, committedNodePath),
        previewNodePath: [],
        previewEdgeKeys: [],
        previewRouteNodePath: [],
      });
      return;
    }

    const previewNodeIndex = allocationPlan.previewNodePath.lastIndexOf(nodeId);
    if (previewNodeIndex !== -1) {
      const previewNodePath = pruneNodePathOnClick(allocationPlan.previewNodePath, nodeId);
      const previewRouteNodePath = pruneNodePathOnClick(allocationPlan.previewRouteNodePath, nodeId);
      setSelectedNodeId(previewNodePath.includes(nodeId) ? nodeId : undefined);
      setAllocationPlan({
        ...allocationPlan,
        previewNodePath,
        previewEdgeKeys: filterEdgeKeysToNodeIds(allocationPlan.previewEdgeKeys, previewNodePath),
        previewRouteNodePath,
        previewHighlightNodeIds: allocationPlan.previewHighlightNodeIds?.filter((highlightNodeId) => previewNodePath.includes(highlightNodeId)),
        previewHighlightEdgeKeys: allocationPlan.previewHighlightEdgeKeys
          ? filterEdgeKeysToNodeIds(allocationPlan.previewHighlightEdgeKeys, previewNodePath)
          : undefined,
        noAllocationPathNodeId: undefined,
      });
      return;
    }

    setSelectedNodeId(nodeId);
    setAllocationPlan((current) => {
      const baseNodePath = current.previewNodePath.length > 0
        ? current.previewNodePath
        : current.committedNodePath;
      const baseEdgeKeys = current.previewNodePath.length > 0
        ? current.previewEdgeKeys
        : current.committedEdgeKeys;
      const pathStartNodePath = baseNodePath.length > 0
        ? baseNodePath
        : pathStartNodeId ? [pathStartNodeId] : [];
      const nextPath = pathStartNodePath.length > 0
        ? findShortestAllocationPathFromAllocated(visibleGraph, new Set(pathStartNodePath), nodeId)
        : undefined;

      if (!nextPath) {
        return {
          ...current,
          noAllocationPathNodeId: nodeId,
        };
      }

      return {
        ...current,
        previewNodePath: appendUniqueNodePath(pathStartNodePath, nextPath.nodeIds),
        previewEdgeKeys: mergeEdgeKeys(baseEdgeKeys, Array.from(edgeKeysFromNodePath(nextPath.nodeIds))),
        previewRouteNodePath: nextPath.nodeIds,
        previewHighlightNodeIds: undefined,
        previewHighlightEdgeKeys: undefined,
        noAllocationPathNodeId: undefined,
      };
    });
  }, [
    allocationPlan,
    clearOptimizedRouteState,
    pathStartNodeId,
    setAllocationPlan,
    toggleAscendancyAllocationNode,
    visibleGraph,
  ]);

  useEffect(() => {
    if (selectedNodeId && !visibleGraph.nodes[selectedNodeId]) {
      setSelectedNodeId(undefined);
    }
    if (hoverPreviewTargetNodeId && !visibleGraph.nodes[hoverPreviewTargetNodeId]) {
      setHoverPreviewTargetNodeId(undefined);
    }
  }, [hoverPreviewTargetNodeId, selectedNodeId, visibleGraph.nodes]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Control") return;
      setGoalShortcutActive(true);
      setHoverPreviewTargetNodeId(undefined);
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key !== "Control") return;
      setGoalShortcutActive(false);
    }

    function handleWindowBlur() {
      setGoalShortcutActive(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  return {
    selectedNodeId,
    selectedNode,
    currentPathEndpointNodeId,
    hoverPathPreviewEnabled,
    goalShortcutActive,
    allocationPath,
    allocationPathNodeNames,
    allocationPathNodeIds,
    allocationPathEdgeKeys,
    hoverAllocationPathNodeIds,
    hoverAllocationPathEdgeKeys,
    noAllocationPathNodeId: allocationPlan.noAllocationPathNodeId,
    clearTreeInteractionState,
    updateHoverPreviewTarget,
    toggleHoverPathPreview,
    selectTreeNode,
    allocatePreviewPath,
  };
}
