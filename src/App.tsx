import { useEffect, useMemo, useRef, useState } from "react";
import type { BuildGoalsOptimizeResult } from "./tree/buildGoalsOptimizer";
import { runBuildGoalsOptimization, type BuildGoalsOptimizationRun } from "./tree/buildGoalsOptimizerClient";
import {
  findAllocationDistancesFrom,
  findShortestAllocationPathFromAllocated,
  treeEdgeKey,
  type AllocationPath,
} from "./tree/pathAllocation";
import { searchPassiveTree } from "./tree/passiveSearch";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph, TreeNode } from "./tree/types";
import { BuildGoalsPanel, type BuildGoalsPanelGoal, type BuildGoalsPanelStatus } from "./viewer/BuildGoalsPanel";
import { DebugControls, type DebugOverlayState } from "./viewer/DebugControls";
import { NodeInspector } from "./viewer/NodeInspector";
import { PassiveSearchPanel, type PassiveSearchPanelResult } from "./viewer/PassiveSearchPanel";
import { TreeViewer } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;

type AllocationPlan = {
  committedNodePath: string[];
  committedEdgeKeys: string[];
  previewNodePath: string[];
  previewEdgeKeys: string[];
  previewRouteNodePath: string[];
  previewHighlightNodeIds?: string[];
  previewHighlightEdgeKeys?: string[];
  noAllocationPathNodeId?: string;
};

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>();
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>({
    committedNodePath: [],
    committedEdgeKeys: [],
    previewNodePath: [],
    previewEdgeKeys: [],
    previewRouteNodePath: [],
  });
  const [nodeVisualScale, setNodeVisualScale] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>();
  const [hoverPreviewTargetNodeId, setHoverPreviewTargetNodeId] = useState<string | undefined>();
  const [buildGoalNodeIds, setBuildGoalNodeIds] = useState<string[]>([]);
  const [buildGoalStatus, setBuildGoalStatus] = useState<BuildGoalsPanelStatus>({ kind: "idle" });
  const [optimizedPreview, setOptimizedPreview] = useState<BuildGoalsOptimizeResult | undefined>();
  const optimizerRun = useRef<BuildGoalsOptimizationRun | undefined>(undefined);
  const [debug, setDebug] = useState<DebugOverlayState>({
    showNodeIds: false,
    highlightMissingStats: false,
    highlightOrphans: false,
    showEdgeRoutes: false,
    showEdgeRouteLabels: false,
  });
  const selectedNode = useMemo(
    () => (selectedNodeId ? graph.nodes[selectedNodeId] : undefined),
    [graph.nodes, selectedNodeId],
  );
  const searchResults = useMemo(() => searchPassiveTree(graph, searchQuery), [graph, searchQuery]);
  const classStartEntries = useMemo(
    () => Object.entries(graph.classStarts).filter(([, nodeId]) => Boolean(graph.nodes[nodeId])),
    [graph.classStarts, graph.nodes],
  );
  const allocatedNodePath = allocationPlan.committedNodePath;
  const allocatedNodeIds = useMemo(
    () => new Set(allocatedNodePath),
    [allocatedNodePath],
  );
  const allocationDistanceNodeIds = useMemo(
    () => new Set(allocationPlan.previewNodePath.length > 0 ? allocationPlan.previewNodePath : allocatedNodePath),
    [allocatedNodePath, allocationPlan.previewNodePath],
  );
  const currentAllocationEdgeKeys = useMemo(
    () => new Set(allocationPlan.previewEdgeKeys.length > 0
      ? allocationPlan.previewEdgeKeys
      : allocationPlan.committedEdgeKeys),
    [allocationPlan.committedEdgeKeys, allocationPlan.previewEdgeKeys],
  );
  const allocationDistances = useMemo(
    () => findAllocationDistancesFrom(graph, allocationDistanceNodeIds),
    [allocationDistanceNodeIds, graph],
  );
  const buildGoalNodeIdSet = useMemo(
    () => new Set(buildGoalNodeIds),
    [buildGoalNodeIds],
  );
  const buildGoalPanelGoals = useMemo<BuildGoalsPanelGoal[]>(
    () => buildGoalNodeIds.flatMap((nodeId) => {
      const node = graph.nodes[nodeId];
      if (!node) return [];
      return [{
        node,
        allocationDistance: allocationDistances.get(nodeId),
        reached: allocationDistanceNodeIds.has(nodeId),
      }];
    }),
    [allocationDistanceNodeIds, allocationDistances, buildGoalNodeIds, graph.nodes],
  );
  const searchResultsWithAllocationDistance = useMemo<PassiveSearchPanelResult[]>(
    () => searchResults
      .map((result, searchIndex) => ({
        result: {
          ...result,
          allocationDistance: allocationDistances.get(result.node.id),
          allocated: allocatedNodeIds.has(result.node.id),
        },
        searchIndex,
      }))
      .sort((left, right) => (
        compareAllocationDistances(left.result.allocationDistance, right.result.allocationDistance)
        || left.searchIndex - right.searchIndex
      ))
      .map(({ result }) => result),
    [allocatedNodeIds, allocationDistances, searchResults],
  );
  const allocatedEdgeKeys = useMemo(() => new Set(allocationPlan.committedEdgeKeys), [allocationPlan.committedEdgeKeys]);
  const currentPathEndpointNodeId = nodePathEndpoint(allocationPlan.previewNodePath)
    ?? nodePathEndpoint(allocatedNodePath)
    ?? pathStartNodeId;
  const previewRouteNodePath = allocationPlan.previewRouteNodePath;
  const previewRouteEndpointNodeId = nodePathEndpoint(previewRouteNodePath);
  const allocationPath = useMemo(
    () => (selectedNodeId && selectedNodeId === previewRouteEndpointNodeId
      ? allocationPathFromNodePath(previewRouteNodePath)
      : undefined),
    [previewRouteEndpointNodeId, previewRouteNodePath, selectedNodeId],
  );
  const searchMatchNodeIds = useMemo(
    () => new Set(searchResults.map(({ node }) => node.id)),
    [searchResults],
  );
  const allocationPathNodeIds = useMemo(
    () => pendingAllocationNodeIds(
      allocationPlan.previewNodePath,
      allocatedNodePath,
      previewRouteNodePath,
      allocationPlan.previewHighlightNodeIds,
    ),
    [allocatedNodePath, allocationPlan.previewHighlightNodeIds, allocationPlan.previewNodePath, previewRouteNodePath],
  );
  const allocationPathEdgeKeys = useMemo(
    () => pendingAllocationEdgeKeys(
      allocationPlan.previewEdgeKeys,
      allocationPlan.committedEdgeKeys,
      allocationPlan.previewHighlightEdgeKeys,
    ),
    [allocationPlan.committedEdgeKeys, allocationPlan.previewEdgeKeys, allocationPlan.previewHighlightEdgeKeys],
  );
  const hoverAllocationPath = useMemo(
    () => (hoverPreviewTargetNodeId && !allocationDistanceNodeIds.has(hoverPreviewTargetNodeId)
      ? findShortestAllocationPathFromAllocated(graph, allocationDistanceNodeIds, hoverPreviewTargetNodeId)
      : undefined),
    [allocationDistanceNodeIds, graph, hoverPreviewTargetNodeId],
  );
  const hoverAllocationPathNodeIds = useMemo(
    () => new Set((hoverAllocationPath?.nodeIds ?? []).filter((nodeId) => !allocationDistanceNodeIds.has(nodeId))),
    [allocationDistanceNodeIds, hoverAllocationPath],
  );
  const hoverAllocationPathEdgeKeys = useMemo(
    () => new Set((hoverAllocationPath?.edgeKeys ?? []).filter((edgeKey) => !currentAllocationEdgeKeys.has(edgeKey))),
    [currentAllocationEdgeKeys, hoverAllocationPath],
  );
  const noAllocationPathNodeId = allocationPlan.noAllocationPathNodeId;
  const allocatedPointCount = Math.max(0, allocatedNodePath.length - 1);
  const allocationPathNodeNames = useMemo(
    () => allocationPath?.nodeIds.map((nodeId) => graph.nodes[nodeId]?.name ?? nodeId) ?? [],
    [allocationPath, graph.nodes],
  );

  function clearOptimizedRouteState(nextStatus: BuildGoalsPanelStatus = { kind: "idle" }) {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setBuildGoalStatus(nextStatus);
  }

  function resetAllocation() {
    clearOptimizedRouteState();
    setAllocationPlan({
      committedNodePath: pathStartNodeId ? [pathStartNodeId] : [],
      committedEdgeKeys: [],
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    });
  }

  function updateSearchQuery(query: string) {
    setSearchQuery(query);
    setSearchFocusedNodeId(undefined);
  }

  function allocatePreviewPath() {
    if (!allocationPath || allocationPath.pointCost === 0) return;
    clearOptimizedRouteState();
    setAllocationPlan((current) => ({
      committedNodePath: current.previewNodePath,
      committedEdgeKeys: current.previewEdgeKeys,
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    }));
  }

  function addBuildGoal(nodeId: string) {
    const node = graph.nodes[nodeId];
    if (!node || !isBuildGoalableNode(node)) return;
    clearOptimizedRouteState();
    setBuildGoalNodeIds((current) => (current.includes(nodeId) ? current : [...current, nodeId]));
  }

  function removeBuildGoal(nodeId: string) {
    clearOptimizedRouteState();
    setBuildGoalNodeIds((current) => current.filter((currentNodeId) => currentNodeId !== nodeId));
  }

  function clearBuildGoals() {
    clearOptimizedRouteState();
    setBuildGoalNodeIds([]);
  }

  function optimizeBuildGoalsRoute() {
    if (buildGoalNodeIds.length === 0) return;

    optimizerRun.current?.cancel();
    setOptimizedPreview(undefined);
    setBuildGoalStatus({ kind: "running" });

    const baseNodeIds = allocationPlan.previewNodePath.length > 0
      ? allocationPlan.previewNodePath
      : allocationPlan.committedNodePath;
    const baseEdgeKeys = allocationPlan.previewEdgeKeys.length > 0
      ? allocationPlan.previewEdgeKeys
      : allocationPlan.committedEdgeKeys;
    const run = runBuildGoalsOptimization({
      graph,
      baseNodeIds,
      baseEdgeKeys,
      goalNodeIds: buildGoalNodeIds,
      mode: "shortest",
    });

    optimizerRun.current = run;
    run.promise.then((result) => {
      if (optimizerRun.current !== run) return;
      optimizerRun.current = undefined;
      handleOptimizedResult(result);
    });
  }

  function cancelBuildGoalsOptimization() {
    if (!optimizerRun.current) return;
    optimizerRun.current.cancel();
    optimizerRun.current = undefined;
    setBuildGoalStatus({ kind: "cancelled" });
  }

  function handleOptimizedResult(result: BuildGoalsOptimizeResult) {
    if (result.status === "cancelled") {
      setBuildGoalStatus({ kind: "cancelled" });
      return;
    }

    if (result.status === "error") {
      setBuildGoalStatus({ kind: "error", message: result.message ?? "Build goal optimization failed." });
      return;
    }

    if (result.status === "unreachable") {
      setBuildGoalStatus({
        kind: "unreachable",
        unreachableGoals: result.unreachableGoalNodeIds.flatMap((nodeId) => graph.nodes[nodeId] ? [graph.nodes[nodeId]] : []),
      });
      return;
    }

    if (result.pointCost === 0) {
      setBuildGoalStatus({ kind: "already-reached" });
      return;
    }

    setOptimizedPreview(result);
    setBuildGoalStatus({ kind: "success", pointCost: result.pointCost });
    setAllocationPlan((current) => ({
      ...current,
      previewNodePath: result.totalNodeIds,
      previewEdgeKeys: result.totalEdgeKeys,
      previewRouteNodePath: [],
      previewHighlightNodeIds: result.addedNodeIds,
      previewHighlightEdgeKeys: result.addedEdgeKeys,
      noAllocationPathNodeId: undefined,
    }));
  }

  function applyOptimizedRoute() {
    if (!optimizedPreview || optimizedPreview.pointCost === 0) return;

    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setAllocationPlan({
      committedNodePath: optimizedPreview.orderedNodeIds,
      committedEdgeKeys: optimizedPreview.totalEdgeKeys,
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    });
    setOptimizedPreview(undefined);
    setBuildGoalStatus({ kind: "already-reached" });
  }

  function selectTreeNode(nodeId: string) {
    clearOptimizedRouteState();
    setSelectedNodeId(nodeId);
    setAllocationPlan((current) => {
      const committedNodeIndex = current.committedNodePath.lastIndexOf(nodeId);
      if (committedNodeIndex !== -1) {
        const committedNodePath = current.committedNodePath.slice(0, committedNodeIndex + 1);
        return {
          committedNodePath,
          committedEdgeKeys: filterEdgeKeysToNodeIds(current.committedEdgeKeys, committedNodePath),
          previewNodePath: [],
          previewEdgeKeys: [],
          previewRouteNodePath: [],
        };
      }

      const previewNodeIndex = current.previewNodePath.lastIndexOf(nodeId);
      if (previewNodeIndex !== -1) {
        const previewNodePath = current.previewNodePath.slice(0, previewNodeIndex + 1);
        const previewRouteNodePath = sliceRouteToNode(current.previewRouteNodePath, nodeId);
        return {
          ...current,
          previewNodePath,
          previewEdgeKeys: filterEdgeKeysToNodeIds(current.previewEdgeKeys, previewNodePath),
          previewRouteNodePath,
          previewHighlightNodeIds: current.previewHighlightNodeIds?.filter((highlightNodeId) => previewNodePath.includes(highlightNodeId)),
          previewHighlightEdgeKeys: current.previewHighlightEdgeKeys
            ? filterEdgeKeysToNodeIds(current.previewHighlightEdgeKeys, previewNodePath)
            : undefined,
          noAllocationPathNodeId: undefined,
        };
      }

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
        ? findShortestAllocationPathFromAllocated(graph, new Set(pathStartNodePath), nodeId)
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
  }

  useEffect(() => {
    setPathStartNodeId((current) => (current && graph.nodes[current] ? current : classStartEntries[0]?.[1]));
  }, [classStartEntries, graph.nodes]);

  useEffect(() => {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setBuildGoalStatus({ kind: "idle" });
    setAllocationPlan({
      committedNodePath: pathStartNodeId && graph.nodes[pathStartNodeId] ? [pathStartNodeId] : [],
      committedEdgeKeys: [],
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    });
  }, [graph.nodes, pathStartNodeId]);

  useEffect(() => {
    setBuildGoalNodeIds((current) => {
      const next = current.filter((nodeId) => {
      const node = graph.nodes[nodeId];
      return node && isBuildGoalableNode(node);
      });
      return next.length === current.length ? current : next;
    });
  }, [graph.nodes]);

  useEffect(() => () => {
    optimizerRun.current?.cancel();
  }, []);

  useEffect(() => {
    fetch("/tree-graph.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((loaded: TreeGraph) => setGraph(loaded))
      .catch(() => setGraph(sampleGraph));
  }, []);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>PoE2 Passive Tree Viewer</h1>
          <p>{Object.keys(graph.nodes).length} nodes, {graph.edges.length} links, version {graph.gameVersion}</p>
        </div>
        <div className="top-controls">
          <label className="path-start-control">
            Path start{" "}
            <select
              value={pathStartNodeId ?? ""}
              onChange={(event) => setPathStartNodeId(event.currentTarget.value)}
            >
              {classStartEntries.map(([classId, nodeId]) => (
                <option key={nodeId} value={nodeId}>{classId}</option>
              ))}
            </select>
          </label>
          <label className="node-size-control">
            Node size{" "}
            <select
              value={nodeVisualScale}
              onChange={(event) => setNodeVisualScale(Number(event.currentTarget.value))}
            >
              {nodeVisualScaleOptions.map((scale) => (
                <option key={scale} value={scale}>{scale}x</option>
              ))}
            </select>
          </label>
          <div className="allocation-control" aria-label="Allocation summary">
            <span>{formatAllocatedPointCount(allocatedPointCount)}</span>
            <button
              className="tool-button"
              type="button"
              onClick={resetAllocation}
              disabled={allocatedPointCount === 0}
            >
              Reset allocation
            </button>
          </div>
          <DebugControls value={debug} onChange={setDebug} />
        </div>
      </header>
      <section className="workspace">
        <TreeViewer
          graph={graph}
          selectedNodeId={selectedNodeId}
          pathStartNodeId={pathStartNodeId}
          noAllocationPathNodeId={noAllocationPathNodeId}
          nodeVisualScale={nodeVisualScale}
          searchMatchNodeIds={searchMatchNodeIds}
          searchFocusedNodeId={searchFocusedNodeId}
          buildGoalNodeIds={buildGoalNodeIdSet}
          allocatedNodeIds={allocatedNodeIds}
          allocatedEdgeKeys={allocatedEdgeKeys}
          allocationPathNodeIds={allocationPathNodeIds}
          allocationPathEdgeKeys={allocationPathEdgeKeys}
          hoverAllocationPathNodeIds={hoverAllocationPathNodeIds}
          hoverAllocationPathEdgeKeys={hoverAllocationPathEdgeKeys}
          onSelectNode={selectTreeNode}
          onHoverNode={setHoverPreviewTargetNodeId}
          debug={debug}
        />
        <div className="side-panel">
          <PassiveSearchPanel
            query={searchQuery}
            results={searchResultsWithAllocationDistance}
            selectedNodeId={selectedNodeId}
            buildGoalNodeIds={buildGoalNodeIdSet}
            onQueryChange={updateSearchQuery}
            onSelectNode={selectTreeNode}
            onHoverNode={setSearchFocusedNodeId}
            canAddBuildGoal={isBuildGoalableNode}
            onAddBuildGoal={addBuildGoal}
          />
          <BuildGoalsPanel
            goals={buildGoalPanelGoals}
            status={buildGoalStatus}
            canApplyOptimizedRoute={Boolean(optimizedPreview && optimizedPreview.pointCost > 0)}
            onRemoveGoal={removeBuildGoal}
            onClearGoals={clearBuildGoals}
            onOptimize={optimizeBuildGoalsRoute}
            onCancel={cancelBuildGoalsOptimization}
            onApplyOptimizedRoute={applyOptimizedRoute}
          />
          <NodeInspector
            node={selectedNode}
            edges={graph.edges}
            allocationPath={allocationPath}
            allocationPathNodeNames={allocationPathNodeNames}
            pathStartName={currentPathEndpointNodeId ? graph.nodes[currentPathEndpointNodeId]?.name : undefined}
            canAllocatePath={allocationPlan.previewNodePath.length > 0 && (allocationPath?.pointCost ?? 0) > 0}
            onAllocatePath={allocatePreviewPath}
            canAddBuildGoal={selectedNode ? isBuildGoalableNode(selectedNode) : false}
            isBuildGoal={selectedNodeId ? buildGoalNodeIdSet.has(selectedNodeId) : false}
            onAddBuildGoal={selectedNodeId ? () => addBuildGoal(selectedNodeId) : undefined}
          />
        </div>
      </section>
    </main>
  );
}

function formatAllocatedPointCount(pointCount: number): string {
  return `Allocated ${pointCount} ${pointCount === 1 ? "point" : "points"}`;
}

function compareAllocationDistances(left: number | undefined, right: number | undefined): number {
  return allocationDistanceSortValue(left) - allocationDistanceSortValue(right);
}

function allocationDistanceSortValue(distance: number | undefined): number {
  return distance ?? Number.POSITIVE_INFINITY;
}

function allocationPathFromNodePath(nodePath: string[]): AllocationPath | undefined {
  const startNodeId = nodePath[0];
  const targetNodeId = nodePath[nodePath.length - 1];
  if (!startNodeId || !targetNodeId) return undefined;

  return {
    startNodeId,
    targetNodeId,
    nodeIds: nodePath,
    edgeKeys: Array.from(edgeKeysFromNodePath(nodePath)),
    pointCost: Math.max(0, nodePath.length - 1),
  };
}

function appendUniqueNodePath(currentNodePath: string[], routeNodePath: string[]): string[] {
  const nodeIds = [...currentNodePath];
  const seen = new Set(nodeIds);

  for (const nodeId of routeNodePath) {
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    nodeIds.push(nodeId);
  }

  return nodeIds;
}

function edgeKeysFromNodePath(nodePath: string[]): Set<string> {
  return new Set(nodePath.slice(1).map((nodeId, index) => treeEdgeKey(nodePath[index], nodeId)));
}

function mergeEdgeKeys(...edgeKeyGroups: string[][]): string[] {
  return Array.from(new Set(edgeKeyGroups.flat()));
}

function pendingAllocationNodeIds(
  previewNodePath: string[],
  committedNodePath: string[],
  previewRouteNodePath: string[],
  previewHighlightNodeIds?: string[],
): Set<string> {
  if (previewHighlightNodeIds) return new Set(previewHighlightNodeIds);

  const committedNodeIds = new Set(committedNodePath);
  const nodeIds = new Set(previewNodePath.filter((nodeId) => !committedNodeIds.has(nodeId)));
  const routeStartNodeId = previewRouteNodePath[0];
  if (routeStartNodeId) nodeIds.add(routeStartNodeId);
  return nodeIds;
}

function pendingAllocationEdgeKeys(
  previewEdgeKeys: string[],
  committedEdgeKeys: string[],
  previewHighlightEdgeKeys?: string[],
): Set<string> {
  if (previewHighlightEdgeKeys) return new Set(previewHighlightEdgeKeys);

  const committed = new Set(committedEdgeKeys);
  return new Set(previewEdgeKeys.filter((edgeKey) => !committed.has(edgeKey)));
}

function filterEdgeKeysToNodeIds(edgeKeys: string[], nodePath: string[]): string[] {
  const nodeIds = new Set(nodePath);
  return edgeKeys.filter((edgeKey) => {
    const [from, to] = edgeKeyNodeIds(edgeKey);
    return nodeIds.has(from) && nodeIds.has(to);
  });
}

function edgeKeyNodeIds(edgeKey: string): [string, string] {
  const [from, to] = edgeKey.split("::");
  return [from, to];
}

function sliceRouteToNode(routeNodePath: string[], nodeId: string): string[] {
  const routeNodeIndex = routeNodePath.lastIndexOf(nodeId);
  return routeNodeIndex === -1 ? [] : routeNodePath.slice(0, routeNodeIndex + 1);
}

function nodePathEndpoint(nodePath: string[]): string | undefined {
  return nodePath[nodePath.length - 1];
}

function isBuildGoalableNode(node: TreeNode): boolean {
  return Boolean(node.flags.notable || node.flags.keystone || node.flags.jewelSocket);
}
