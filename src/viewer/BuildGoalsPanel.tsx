import type { TreeNode } from "../tree/types";

export type BuildGoalsPanelGoal = {
  node: TreeNode;
  allocationDistance?: number;
  reached: boolean;
};

export type BuildGoalsPanelStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "cancelled" }
  | { kind: "already-reached" }
  | { kind: "success"; pointCost: number }
  | { kind: "unreachable"; unreachableGoals: TreeNode[] }
  | { kind: "error"; message: string };

type BuildGoalsPanelProps = {
  goals: BuildGoalsPanelGoal[];
  status: BuildGoalsPanelStatus;
  canApplyOptimizedRoute: boolean;
  onRemoveGoal: (nodeId: string) => void;
  onClearGoals: () => void;
  onOptimize: () => void;
  onCancel: () => void;
  onApplyOptimizedRoute: () => void;
};

export function BuildGoalsPanel({
  goals,
  status,
  canApplyOptimizedRoute,
  onRemoveGoal,
  onClearGoals,
  onOptimize,
  onCancel,
  onApplyOptimizedRoute,
}: BuildGoalsPanelProps) {
  const running = status.kind === "running";

  return (
    <section className="build-goals-panel" aria-label="Build goals">
      <div className="build-goals-header">
        <h2>Build goals</h2>
        <button
          className="tool-button build-goals-clear"
          type="button"
          onClick={onClearGoals}
          disabled={goals.length === 0 || running}
        >
          Clear goals
        </button>
      </div>
      {goals.length > 0 ? (
        <ol className="build-goal-list">
          {goals.map(({ node, allocationDistance, reached }) => (
            <li key={node.id} className="build-goal-item">
              <span>
                <span className="build-goal-name">{node.name ?? node.id}</span>
                <span className="build-goal-meta">{formatGoalMeta(node, allocationDistance, reached)}</span>
              </span>
              <button
                className="tool-button build-goal-remove"
                type="button"
                aria-label={`Remove ${node.name ?? node.id} build goal`}
                onClick={() => onRemoveGoal(node.id)}
                disabled={running}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="build-goals-empty">No build goals selected.</p>
      )}
      <div className="build-goals-actions">
        <button
          className="tool-button"
          type="button"
          onClick={onOptimize}
          disabled={goals.length === 0 || running}
        >
          Optimize route
        </button>
        <button
          className="tool-button"
          type="button"
          onClick={onCancel}
          disabled={!running}
        >
          Cancel
        </button>
        <button
          className="tool-button optimized-route-action"
          type="button"
          onClick={onApplyOptimizedRoute}
          disabled={!canApplyOptimizedRoute || running}
        >
          Apply optimized route
        </button>
      </div>
      <BuildGoalStatusMessage status={status} />
    </section>
  );
}

function BuildGoalStatusMessage({ status }: { status: BuildGoalsPanelStatus }) {
  const message = formatStatusMessage(status);
  if (!message) return null;

  return (
    <p className={`build-goals-status ${status.kind}`} role="status">
      {message}
    </p>
  );
}

function formatStatusMessage(status: BuildGoalsPanelStatus): string | undefined {
  if (status.kind === "idle") return undefined;
  if (status.kind === "running") return "Optimizing...";
  if (status.kind === "cancelled") return "Optimization cancelled.";
  if (status.kind === "already-reached") return "All goals reached";
  if (status.kind === "success") return `Optimized route: ${formatPointCost(status.pointCost)}`;
  if (status.kind === "unreachable") {
    return `Unreachable: ${status.unreachableGoals.map((node) => node.name ?? node.id).join(", ")}`;
  }
  return status.message;
}

function formatGoalMeta(node: TreeNode, allocationDistance: number | undefined, reached: boolean): string {
  if (reached) return `${nodeTypeLabel(node)} · Reached`;
  if (allocationDistance === undefined) return `${nodeTypeLabel(node)} · No allocated path`;
  return `${nodeTypeLabel(node)} · ${formatPointCost(allocationDistance)} from allocation`;
}

function formatPointCost(pointCost: number): string {
  return `${pointCost} ${pointCost === 1 ? "point" : "points"}`;
}

function nodeTypeLabel(node: TreeNode): string {
  if (node.flags.keystone) return "Keystone";
  if (node.flags.notable) return "Notable";
  if (node.flags.jewelSocket) return "Jewel socket";
  return "Passive";
}
