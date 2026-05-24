import type { TreeEdge, TreeNode } from "../tree/types";

export function NodeInspector({ node, edges }: { node?: TreeNode; edges: TreeEdge[] }) {
  if (!node) {
    return (
      <aside className="inspector">
        <h2>Select a node</h2>
        <p>No node selected.</p>
      </aside>
    );
  }

  const connected = edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .map((edge) => (edge.from === node.id ? edge.to : edge.from));

  return (
    <aside className="inspector">
      <h2>{node.name ?? node.id}</h2>
      <dl>
        <dt>ID</dt>
        <dd>{node.id}</dd>
        <dt>Group</dt>
        <dd>{node.groupId ?? "none"}</dd>
        <dt>Position</dt>
        <dd>
          {node.position.x}, {node.position.y}
        </dd>
        <dt>Connected</dt>
        <dd>{connected.join(", ") || "none"}</dd>
      </dl>
      <h3>Stats</h3>
      <ul>{node.stats.map((stat) => <li key={stat}>{stat}</li>)}</ul>
      <h3>Flags</h3>
      <pre>{JSON.stringify(node.flags, null, 2)}</pre>
    </aside>
  );
}
