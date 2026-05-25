import type { AllocationPath } from "../tree/pathAllocation";
import type { TreeEdge, TreeNode } from "../tree/types";

export function NodeInspector({
  node,
  edges,
  allocationPath,
  allocationPathNodeNames = [],
  pathStartName,
  canAllocatePath = false,
  onAllocatePath,
}: {
  node?: TreeNode;
  edges: TreeEdge[];
  allocationPath?: AllocationPath;
  allocationPathNodeNames?: string[];
  pathStartName?: string;
  canAllocatePath?: boolean;
  onAllocatePath?: () => void;
}) {
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
      <AllocationPathDetails
        path={allocationPath}
        nodeNames={allocationPathNodeNames}
        pathStartName={pathStartName}
        targetName={node.name ?? node.id}
        canAllocatePath={canAllocatePath}
        onAllocatePath={onAllocatePath}
      />
      <h3>Stats</h3>
      <ul>{node.stats.map((stat, index) => <li key={`${stat}-${index}`}>{stat}</li>)}</ul>
      <h3>Flags</h3>
      <pre>{JSON.stringify(node.flags, null, 2)}</pre>
    </aside>
  );
}

function AllocationPathDetails({
  path,
  nodeNames,
  pathStartName,
  targetName,
  canAllocatePath,
  onAllocatePath,
}: {
  path?: AllocationPath;
  nodeNames: string[];
  pathStartName?: string;
  targetName: string;
  canAllocatePath: boolean;
  onAllocatePath?: () => void;
}) {
  if (!path) {
    return pathStartName ? (
      <section className="allocation-path-summary">
        <h3>Allocation path</h3>
        <p>No allocatable path from {pathStartName} to {targetName}.</p>
      </section>
    ) : null;
  }

  return (
    <section className="allocation-path-summary">
      <h3>Allocation path</h3>
      <p className="allocation-path-cost">{formatPointCost(path.pointCost)}</p>
      <p className="allocation-path-route">{nodeNames.join(" -> ")}</p>
      <button
        className="tool-button allocation-path-action"
        type="button"
        onClick={onAllocatePath}
        disabled={!canAllocatePath}
      >
        Allocate path
      </button>
    </section>
  );
}

function formatPointCost(pointCost: number): string {
  return `${pointCost} ${pointCost === 1 ? "point" : "points"}`;
}
