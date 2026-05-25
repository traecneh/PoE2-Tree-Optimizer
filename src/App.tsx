import { useEffect, useMemo, useState } from "react";
import { findShortestAllocationPath, treeEdgeKey } from "./tree/pathAllocation";
import { searchPassiveTree } from "./tree/passiveSearch";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";
import { DebugControls, type DebugOverlayState } from "./viewer/DebugControls";
import { NodeInspector } from "./viewer/NodeInspector";
import { PassiveSearchPanel } from "./viewer/PassiveSearchPanel";
import { TreeViewer } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>();
  const [allocatedNodePath, setAllocatedNodePath] = useState<string[]>([]);
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
  const allocatedNodeIds = useMemo(
    () => new Set(allocatedNodePath),
    [allocatedNodePath],
  );
  const allocatedEdgeKeys = useMemo(
    () => edgeKeysFromNodePath(allocatedNodePath),
    [allocatedNodePath],
  );
  const allocationStartNodeId = allocatedNodePath.length > 0
    ? allocatedNodePath[allocatedNodePath.length - 1]
    : pathStartNodeId;
  const allocationPath = useMemo(
    () => (selectedNodeId && allocationStartNodeId
      ? findShortestAllocationPath(graph, allocationStartNodeId, selectedNodeId)
      : undefined),
    [allocationStartNodeId, graph, selectedNodeId],
  );
  const searchMatchNodeIds = useMemo(
    () => new Set(searchResults.map(({ node }) => node.id)),
    [searchResults],
  );
  const allocationPathNodeIds = useMemo(
    () => new Set(allocationPath?.nodeIds ?? []),
    [allocationPath],
  );
  const allocationPathEdgeKeys = useMemo(
    () => new Set(allocationPath?.edgeKeys ?? []),
    [allocationPath],
  );
  const noAllocationPathNodeId = selectedNodeId && allocationStartNodeId && !allocationPath
    ? selectedNodeId
    : undefined;
  const allocatedPointCount = Math.max(0, allocatedNodePath.length - 1);
  const allocationPathNodeNames = useMemo(
    () => allocationPath?.nodeIds.map((nodeId) => graph.nodes[nodeId]?.name ?? nodeId) ?? [],
    [allocationPath, graph.nodes],
  );

  function resetAllocation() {
    setAllocatedNodePath(pathStartNodeId ? [pathStartNodeId] : []);
  }

  function allocatePreviewPath() {
    if (!allocationPath || allocationPath.pointCost === 0) return;
    setAllocatedNodePath((current) => appendAllocationPath(current, allocationPath.nodeIds));
  }

  function selectTreeNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setAllocatedNodePath((current) => {
      const nodeIndex = current.lastIndexOf(nodeId);
      return nodeIndex === -1 ? current : current.slice(0, nodeIndex + 1);
    });
  }

  useEffect(() => {
    setPathStartNodeId((current) => (current && graph.nodes[current] ? current : classStartEntries[0]?.[1]));
  }, [classStartEntries, graph.nodes]);

  useEffect(() => {
    setAllocatedNodePath(pathStartNodeId && graph.nodes[pathStartNodeId] ? [pathStartNodeId] : []);
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
            pathStartName={allocationStartNodeId ? graph.nodes[allocationStartNodeId]?.name : undefined}
            canAllocatePath={(allocationPath?.pointCost ?? 0) > 0}
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
