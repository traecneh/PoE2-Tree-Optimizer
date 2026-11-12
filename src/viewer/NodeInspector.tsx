import type { AllocationPath } from "../tree/pathAllocation";
import type { TreeEdge, TreeNode } from "../tree/types";
import { ControlTooltip, InfoTooltip } from "./ControlTooltip";

export function NodeInspector({
  node,
  edges,
  allocationPath,
  allocationPathNodeNames = [],
  pathStartName,
  canAllocatePath = false,
  canAddBuildGoal = false,
  isBuildGoal = false,
  onAllocatePath,
  onAddBuildGoal,
}: {
  node?: TreeNode;
  edges: TreeEdge[];
  allocationPath?: AllocationPath;
  allocationPathNodeNames?: string[];
  pathStartName?: string;
  canAllocatePath?: boolean;
  canAddBuildGoal?: boolean;
  isBuildGoal?: boolean;
  onAllocatePath?: () => void;
  onAddBuildGoal?: () => void;
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
      <div className="inspector-heading">
        <h2>{node.name ?? node.id}</h2>
        <InfoTooltip id="inspector-node-details" label="Node details">
          <dl>
            <dt>ID</dt><dd>{node.id}</dd>
            <dt>Group</dt><dd>{node.groupId ?? "none"}</dd>
            <dt>Position</dt><dd>{node.position.x}, {node.position.y}</dd>
            <dt>Connected</dt><dd>{connected.join(", ") || "none"}</dd>
          </dl>
          <h4>Flags</h4><pre>{JSON.stringify(node.flags, null, 2)}</pre>
        </InfoTooltip>
      </div>
      {canAddBuildGoal ? (
        <ControlTooltip
          id="inspector-add-build-goal-tooltip"
          text="Add the selected node to Build goals."
        >
          <button
            className="tool-button inspector-goal-action"
            type="button"
            aria-describedby="inspector-add-build-goal-tooltip"
            onClick={onAddBuildGoal}
            disabled={isBuildGoal}
          >
            {isBuildGoal ? "Build goal added" : "Add build goal"}
          </button>
        </ControlTooltip>
      ) : null}
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
      <div className="inspector-heading"><h3>Allocation path</h3>
        <InfoTooltip id="allocation-path-nodes" label="Allocation path nodes">
          <ol>{nodeNames.map((name, index) => <li key={index}>{name}</li>)}</ol>
        </InfoTooltip>
      </div>
      <p className="allocation-path-cost">{formatPointCost(path.pointCost)}</p>
      <ControlTooltip
        id="allocate-path-tooltip"
        text="Commit this preview path to the current allocation."
      >
        <button
          className="tool-button allocation-path-action"
          type="button"
          aria-describedby="allocate-path-tooltip"
          onClick={onAllocatePath}
          disabled={!canAllocatePath}
        >
          Allocate path
        </button>
      </ControlTooltip>
    </section>
  );
}

function formatPointCost(pointCost: number): string {
  return `${pointCost} ${pointCost === 1 ? "point" : "points"}`;
}
