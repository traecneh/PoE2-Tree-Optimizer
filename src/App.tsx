import { useEffect, useMemo, useState } from "react";
import { findShortestAllocationPath, treeEdgeKey, type AllocationPath } from "./tree/pathAllocation";
import { searchPassiveTree } from "./tree/passiveSearch";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";
import { DebugControls, type DebugOverlayState } from "./viewer/DebugControls";
import { NodeInspector } from "./viewer/NodeInspector";
import { PassiveSearchPanel } from "./viewer/PassiveSearchPanel";
import { TreeViewer } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;

type AllocationPlan = {
  committedNodePath: string[];
  previewNodePath: string[];
  noAllocationPathNodeId?: string;
};

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>();
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>({
    committedNodePath: [],
    previewNodePath: [],
  });
  const [nodeVisualScale, setNodeVisualScale] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState("");
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
  const allocatedEdgeKeys = useMemo(
    () => edgeKeysFromNodePath(allocatedNodePath),
    [allocatedNodePath],
  );
  const currentPathEndpointNodeId = nodePathEndpoint(allocationPlan.previewNodePath)
    ?? nodePathEndpoint(allocatedNodePath)
    ?? pathStartNodeId;
  const previewRouteNodePath = useMemo(
    () => allocationPlan.previewNodePath.slice(Math.max(0, allocatedNodePath.length - 1)),
    [allocatedNodePath.length, allocationPlan.previewNodePath],
  );
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
    () => new Set(previewRouteNodePath),
    [previewRouteNodePath],
  );
  const allocationPathEdgeKeys = useMemo(
    () => edgeKeysFromNodePath(previewRouteNodePath),
    [previewRouteNodePath],
  );
  const noAllocationPathNodeId = allocationPlan.noAllocationPathNodeId;
  const allocatedPointCount = Math.max(0, allocatedNodePath.length - 1);
  const allocationPathNodeNames = useMemo(
    () => allocationPath?.nodeIds.map((nodeId) => graph.nodes[nodeId]?.name ?? nodeId) ?? [],
    [allocationPath, graph.nodes],
  );

  function resetAllocation() {
    setAllocationPlan({
      committedNodePath: pathStartNodeId ? [pathStartNodeId] : [],
      previewNodePath: [],
    });
  }

  function allocatePreviewPath() {
    if (!allocationPath || allocationPath.pointCost === 0) return;
    setAllocationPlan((current) => ({
      committedNodePath: current.previewNodePath,
      previewNodePath: [],
    }));
  }

  function selectTreeNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setAllocationPlan((current) => {
      const committedNodeIndex = current.committedNodePath.lastIndexOf(nodeId);
      if (committedNodeIndex !== -1) {
        return {
          committedNodePath: current.committedNodePath.slice(0, committedNodeIndex + 1),
          previewNodePath: [],
        };
      }

      const previewNodeIndex = current.previewNodePath.lastIndexOf(nodeId);
      if (previewNodeIndex !== -1) {
        return {
          ...current,
          previewNodePath: current.previewNodePath.slice(0, previewNodeIndex + 1),
          noAllocationPathNodeId: undefined,
        };
      }

      const baseNodePath = current.previewNodePath.length > 0
        ? current.previewNodePath
        : current.committedNodePath;
      const startNodeId = nodePathEndpoint(baseNodePath) ?? pathStartNodeId;
      const nextPath = startNodeId
        ? findShortestAllocationPath(graph, startNodeId, nodeId)
        : undefined;

      if (!nextPath) {
        return {
          ...current,
          noAllocationPathNodeId: nodeId,
        };
      }

      return {
        ...current,
        previewNodePath: appendAllocationPath(baseNodePath, nextPath.nodeIds),
        noAllocationPathNodeId: undefined,
      };
    });
  }

  useEffect(() => {
    setPathStartNodeId((current) => (current && graph.nodes[current] ? current : classStartEntries[0]?.[1]));
  }, [classStartEntries, graph.nodes]);

  useEffect(() => {
    setAllocationPlan({
      committedNodePath: pathStartNodeId && graph.nodes[pathStartNodeId] ? [pathStartNodeId] : [],
      previewNodePath: [],
    });
  }, [graph.nodes, pathStartNodeId]);

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
          allocatedNodeIds={allocatedNodeIds}
          allocatedEdgeKeys={allocatedEdgeKeys}
          allocationPathNodeIds={allocationPathNodeIds}
          allocationPathEdgeKeys={allocationPathEdgeKeys}
          onSelectNode={selectTreeNode}
          debug={debug}
        />
        <div className="side-panel">
          <PassiveSearchPanel
            query={searchQuery}
            results={searchResults}
            selectedNodeId={selectedNodeId}
            onQueryChange={setSearchQuery}
            onSelectNode={selectTreeNode}
          />
          <NodeInspector
            node={selectedNode}
            edges={graph.edges}
            allocationPath={allocationPath}
            allocationPathNodeNames={allocationPathNodeNames}
            pathStartName={currentPathEndpointNodeId ? graph.nodes[currentPathEndpointNodeId]?.name : undefined}
            canAllocatePath={allocationPlan.previewNodePath.length > 0 && (allocationPath?.pointCost ?? 0) > 0}
            onAllocatePath={allocatePreviewPath}
          />
        </div>
      </section>
    </main>
  );
}

function formatAllocatedPointCount(pointCount: number): string {
  return `Allocated ${pointCount} ${pointCount === 1 ? "point" : "points"}`;
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

function appendAllocationPath(currentNodePath: string[], previewNodePath: string[]): string[] {
  if (previewNodePath.length === 0) return currentNodePath;
  const currentEndpoint = currentNodePath[currentNodePath.length - 1];
  const extension = currentEndpoint && previewNodePath[0] === currentEndpoint
    ? previewNodePath.slice(1)
    : previewNodePath;
  return [...currentNodePath, ...extension];
}

function edgeKeysFromNodePath(nodePath: string[]): Set<string> {
  return new Set(nodePath.slice(1).map((nodeId, index) => treeEdgeKey(nodePath[index], nodeId)));
}

function nodePathEndpoint(nodePath: string[]): string | undefined {
  return nodePath[nodePath.length - 1];
}
