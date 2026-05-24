import { useEffect, useState } from "react";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);

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
        <div className="viewer-empty-state">Tree viewer loads in Task 10.</div>
      </section>
    </main>
  );
}
