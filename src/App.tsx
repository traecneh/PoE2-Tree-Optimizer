import { useEffect, useMemo, useState } from "react";
import { findShortestAllocationPathFromAllocated } from "./tree/pathAllocation";
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
  const [allocatedNodeIds, setAllocatedNodeIds] = useState<Set<string>>(new Set());
  const [allocatedEdgeKeys, setAllocatedEdgeKeys] = useState<Set<string>>(new Set());
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
  const allocationStartNodeIds = useMemo(
    () => (allocatedNodeIds.size > 0 ? allocatedNodeIds : new Set(pathStartNodeId ? [pathStartNodeId] : [])),
    [allocatedNodeIds, pathStartNodeId],
  );
  const allocationPath = useMemo(
    () => (selectedNodeId
      ? findShortestAllocationPathFromAllocated(graph, allocationStartNodeIds, selectedNodeId)
      : undefined),
    [allocationStartNodeIds, graph, selectedNodeId],
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
  const allocatedPointCount = Math.max(
    0,
    allocatedNodeIds.size - (pathStartNodeId && allocatedNodeIds.has(pathStartNodeId) ? 1 : 0),
  );
  const allocationPathNodeNames = useMemo(
    () => allocationPath?.nodeIds.map((nodeId) => graph.nodes[nodeId]?.name ?? nodeId) ?? [],
    [allocationPath, graph.nodes],
  );

  function resetAllocation() {
    setAllocatedNodeIds(new Set(pathStartNodeId ? [pathStartNodeId] : []));
    setAllocatedEdgeKeys(new Set());
  }

  function allocatePreviewPath() {
    if (!allocationPath || allocationPath.pointCost === 0) return;
    setAllocatedNodeIds((current) => new Set([...current, ...allocationPath.nodeIds]));
    setAllocatedEdgeKeys((current) => new Set([...current, ...allocationPath.edgeKeys]));
  }

  useEffect(() => {
    setPathStartNodeId((current) => (current && graph.nodes[current] ? current : classStartEntries[0]?.[1]));
  }, [classStartEntries, graph.nodes]);

  useEffect(() => {
    setAllocatedNodeIds(new Set(pathStartNodeId && graph.nodes[pathStartNodeId] ? [pathStartNodeId] : []));
    setAllocatedEdgeKeys(new Set());
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
          nodeVisualScale={nodeVisualScale}
          searchMatchNodeIds={searchMatchNodeIds}
          allocatedNodeIds={allocatedNodeIds}
          allocatedEdgeKeys={allocatedEdgeKeys}
          allocationPathNodeIds={allocationPathNodeIds}
          allocationPathEdgeKeys={allocationPathEdgeKeys}
          onSelectNode={setSelectedNodeId}
          debug={debug}
        />
        <div className="side-panel">
          <PassiveSearchPanel
            query={searchQuery}
            results={searchResults}
            selectedNodeId={selectedNodeId}
            onQueryChange={setSearchQuery}
            onSelectNode={setSelectedNodeId}
          />
          <NodeInspector
            node={selectedNode}
            edges={graph.edges}
            allocationPath={allocationPath}
            allocationPathNodeNames={allocationPathNodeNames}
            pathStartName={pathStartNodeId ? graph.nodes[pathStartNodeId]?.name : undefined}
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
