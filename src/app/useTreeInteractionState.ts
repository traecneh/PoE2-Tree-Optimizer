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
import {
  allocationModeWeaponSetId,
  nextWeaponSetAllocationNodeIdsForClick,
  type AllocationMode,
  type WeaponSetAllocationClickStatus,
  type WeaponSetAllocationNodeIds,
  type WeaponSetId,
} from "./weaponSetAllocation";

export type TreeInteractionNotice = {
  tone: "info" | "success" | "warning";
  message: string;
};

type UseTreeInteractionStateOptions = {
  visibleGraph: TreeGraph;
  allocationPlan: AllocationPlan;
  setAllocationPlan: Dispatch<SetStateAction<AllocationPlan>>;
  pathStartNodeId: string | undefined;
  allocationDistanceNodeIds: ReadonlySet<string>;
  currentAllocationEdgeKeys: ReadonlySet<string>;
  activeAllocationMode?: AllocationMode;
  weaponSetAllocationNodeIds?: WeaponSetAllocationNodeIds;
  setWeaponSetAllocationNodeIds?: Dispatch<SetStateAction<WeaponSetAllocationNodeIds>>;
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
  activeAllocationMode = "main",
  weaponSetAllocationNodeIds = { 1: [], 2: [] },
  setWeaponSetAllocationNodeIds,
  clearOptimizedRouteState,
  toggleAscendancyAllocationNode,
}: UseTreeInteractionStateOptions) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [hoverPathPreviewEnabled, setHoverPathPreviewEnabled] = useState(false);
  const [hoverPreviewTargetNodeId, setHoverPreviewTargetNodeId] = useState<string | undefined>();
  const [goalShortcutActive, setGoalShortcutActive] = useState(false);
  const [treeInteractionNotice, setTreeInteractionNotice] = useState<TreeInteractionNotice | undefined>();

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
    setTreeInteractionNotice(undefined);
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
    const activeWeaponSetId = allocationModeWeaponSetId(activeAllocationMode);
    if (!activeWeaponSetId && node.flags.ascendancy) {
      setSelectedNodeId(nodeId);
      setHoverPreviewTargetNodeId(undefined);
      setTreeInteractionNotice(undefined);
      toggleAscendancyAllocationNode?.(node);
      return;
    }

    if (activeWeaponSetId) {
      const baseNodePath = allocationPlan.previewNodePath.length > 0
        ? allocationPlan.previewNodePath
        : allocationPlan.committedNodePath;
      const mainNodeIds = baseNodePath.length > 0
        ? baseNodePath
        : pathStartNodeId ? [pathStartNodeId] : [];
      const currentWeaponSetNodeIds = weaponSetAllocationNodeIds[activeWeaponSetId];
      const result = nextWeaponSetAllocationNodeIdsForClick({
        graph: visibleGraph,
        mainNodeIds,
        weaponSetNodeIds: currentWeaponSetNodeIds,
        targetNodeId: nodeId,
      });
      setTreeInteractionNotice(weaponSetInteractionNotice({
        node,
        status: result.status,
        weaponSetId: activeWeaponSetId,
        wasAllocated: currentWeaponSetNodeIds.includes(nodeId),
        stillAllocated: result.nodeIds.includes(nodeId),
        nextPointCount: result.nodeIds.length,
      }));

      if (result.status === "updated") {
        setSelectedNodeId(result.nodeIds.includes(nodeId) ? nodeId : undefined);
        setHoverPreviewTargetNodeId(undefined);
        setWeaponSetAllocationNodeIds?.((current) => ({
          1: activeWeaponSetId === 1 ? result.nodeIds : current[1],
          2: activeWeaponSetId === 2 ? result.nodeIds : current[2],
        }));
        setAllocationPlan((current) => ({
          ...current,
          noAllocationPathNodeId: undefined,
        }));
        return;
      }

      setSelectedNodeId(nodeId);
      setHoverPreviewTargetNodeId(undefined);
      setAllocationPlan((current) => ({
        ...current,
        noAllocationPathNodeId: result.status === "already-main" ? undefined : nodeId,
      }));
      return;
    }

    const committedNodeIndex = allocationPlan.committedNodePath.lastIndexOf(nodeId);
    if (committedNodeIndex !== -1) {
      const committedNodePath = pruneCommittedNodePathOnClick(allocationPlan.committedNodePath, nodeId);
      setSelectedNodeId(committedNodePath.includes(nodeId) ? nodeId : undefined);
      setTreeInteractionNotice(undefined);
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
      setTreeInteractionNotice(undefined);
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
    setTreeInteractionNotice(undefined);
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
    activeAllocationMode,
    clearOptimizedRouteState,
    pathStartNodeId,
    setAllocationPlan,
    setWeaponSetAllocationNodeIds,
    toggleAscendancyAllocationNode,
    visibleGraph,
    weaponSetAllocationNodeIds,
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
    treeInteractionNotice,
    clearTreeInteractionState,
    updateHoverPreviewTarget,
    toggleHoverPathPreview,
    selectTreeNode,
    allocatePreviewPath,
  };
}

function weaponSetInteractionNotice({
  node,
  status,
  weaponSetId,
  wasAllocated,
  stillAllocated,
  nextPointCount,
}: {
  node: TreeNode;
  status: WeaponSetAllocationClickStatus;
  weaponSetId: WeaponSetId;
  wasAllocated: boolean;
  stillAllocated: boolean;
  nextPointCount: number;
}): TreeInteractionNotice {
  const weaponSetLabel = `Weapon Set ${weaponSetId}`;
  if (status === "updated") {
    if (wasAllocated) {
      const action = stillAllocated ? "pruned after" : "removed";
      return {
        tone: "success",
        message: `${weaponSetLabel}: ${action} ${node.name}. ${nextPointCount}/24 used.`,
      };
    }
    return {
      tone: "success",
      message: `${weaponSetLabel}: allocated ${node.name}. ${nextPointCount}/24 used.`,
    };
  }

  if (status === "already-main") {
    return {
      tone: "info",
      message: `${node.name} is already allocated in the main tree.`,
    };
  }

  if (status === "limit-exceeded") {
    return {
      tone: "warning",
      message: `${weaponSetLabel} cannot allocate ${node.name}; this path would exceed 24 points.`,
    };
  }

  if (status === "unreachable") {
    return {
      tone: "warning",
      message: `${weaponSetLabel} cannot reach ${node.name} from the current allocation.`,
    };
  }

  return {
    tone: "warning",
    message: invalidWeaponSetTargetMessage(node),
  };
}

function invalidWeaponSetTargetMessage(node: TreeNode): string {
  if (node.flags.keystone) return "Keystones cannot be allocated as weapon set passives.";
  if (node.flags.jewelSocket) return "Jewel sockets cannot be allocated as weapon set passives.";
  if (node.flags.classStart) return "Class starts cannot be allocated as weapon set passives.";
  if (node.flags.ascendancy) return "Ascendancy nodes cannot be allocated as weapon set passives.";
  return `${node.name} cannot be allocated as a weapon set passive.`;
}
