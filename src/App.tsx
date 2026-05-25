import { useEffect, useMemo, useState } from "react";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";
import { DebugControls, type DebugOverlayState } from "./viewer/DebugControls";
import { NodeInspector } from "./viewer/NodeInspector";
import { TreeViewer } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [nodeVisualScale, setNodeVisualScale] = useState<number>(2);
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
          <DebugControls value={debug} onChange={setDebug} />
        </div>
      </header>
      <section className="workspace">
        <TreeViewer
          graph={graph}
          selectedNodeId={selectedNodeId}
          nodeVisualScale={nodeVisualScale}
          onSelectNode={setSelectedNodeId}
          debug={debug}
        />
        <NodeInspector node={selectedNode} edges={graph.edges} />
      </section>
    </main>
  );
}
