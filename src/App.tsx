import { useEffect, useMemo, useState } from "react";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";
import { TreeViewer } from "./viewer/TreeViewer";

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
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
      </header>
      <section className="workspace">
        <TreeViewer graph={graph} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        <aside className="inspector">
          <h2>{selectedNode?.name ?? "Select a node"}</h2>
          <pre>{selectedNode ? JSON.stringify(selectedNode, null, 2) : "No node selected."}</pre>
        </aside>
      </section>
    </main>
  );
}
