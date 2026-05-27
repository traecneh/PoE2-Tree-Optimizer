import type { TreeNode } from "../tree/types";

export type BuildGoalsPanelGoal = {
  node: TreeNode;
  allocationDistance?: number;
  reached: boolean;
};

export type BuildGoalsPanelStatus =
  | { kind: "idle" }
  | { kind: "running"; pointCost?: number; improvementHistory?: number[] }
  | { kind: "cancelled" }
  | { kind: "already-reached" }
  | {
    kind: "success";
    pointCost: number;
    searchType?: "exact" | "bounded" | "anytime";
    completeReason?: "exact" | "bounded" | "no-improvement" | "iteration-limit" | "cancelled";
    improvementHistory?: number[];
  }
  | { kind: "unreachable"; unreachableGoals: TreeNode[] }
  | { kind: "error"; message: string };

export type PobBuildImportStatus =
  | { kind: "idle" }
  | {
    kind: "success";
    importedGoalCount: number;
    allocatedNodeCount: number;
    alreadySelectedGoalCount: number;
    missingNodeCount: number;
  }
  | { kind: "error"; message: string };

type BuildGoalsPanelProps = {
  goals: BuildGoalsPanelGoal[];
  status: BuildGoalsPanelStatus;
  pobImportCode: string;
  pobImportStatus: PobBuildImportStatus;
  canApplyOptimizedRoute: boolean;
  routeCandidateCount?: number;
  selectedRouteIndex?: number;
  onPobImportCodeChange: (code: string) => void;
  onImportPobBuildGoals: () => void;
  onRemoveGoal: (nodeId: string) => void;
  onClearGoals: () => void;
  onOptimize: () => void;
  onCancel: () => void;
  onApplyOptimizedRoute: () => void;
  onPreviousRoute?: () => void;
  onNextRoute?: () => void;
};

export function BuildGoalsPanel({
  goals,
  status,
  pobImportCode,
  pobImportStatus,
  canApplyOptimizedRoute,
  routeCandidateCount = 0,
  selectedRouteIndex = 0,
  onPobImportCodeChange,
  onImportPobBuildGoals,
  onRemoveGoal,
  onClearGoals,
  onOptimize,
  onCancel,
  onApplyOptimizedRoute,
  onPreviousRoute,
  onNextRoute,
}: BuildGoalsPanelProps) {
  const running = status.kind === "running";
  const hasRouteCandidates = routeCandidateCount > 1;

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
      <div className="pob-import-control">
        <label className="pob-import-label" htmlFor="pob-build-code-input">PoB build code</label>
        <textarea
          id="pob-build-code-input"
          className="pob-import-input"
          value={pobImportCode}
          onChange={(event) => onPobImportCodeChange(event.currentTarget.value)}
          rows={3}
        />
        <button
          className="tool-button pob-import-action"
          type="button"
          onClick={onImportPobBuildGoals}
          disabled={pobImportCode.trim().length === 0 || running}
        >
          Import PoB goals
        </button>
        <PobImportStatusMessage status={pobImportStatus} />
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
          disabled={!canApplyOptimizedRoute}
        >
          Apply optimized route
        </button>
      </div>
      {hasRouteCandidates ? (
        <div className="optimized-route-nav" aria-label="Optimized route candidates">
          <button
            className="tool-button optimized-route-nav-button"
            type="button"
            aria-label="Previous optimized route"
            onClick={onPreviousRoute}
            disabled={!onPreviousRoute}
          >
            {"<"}
          </button>
          <span>{`Route ${selectedRouteIndex + 1} of ${routeCandidateCount}`}</span>
          <button
            className="tool-button optimized-route-nav-button"
            type="button"
            aria-label="Next optimized route"
            onClick={onNextRoute}
            disabled={!onNextRoute}
          >
            {">"}
          </button>
        </div>
      ) : null}
      <BuildGoalStatusMessage status={status} />
    </section>
  );
}

function PobImportStatusMessage({ status }: { status: PobBuildImportStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "error") {
    return <p className="pob-import-status error" role="status">{status.message}</p>;
  }

  return (
    <p className="pob-import-status success" role="status">
      <span>{`Imported ${formatGoalCount(status.importedGoalCount)} from ${formatPassiveCount(status.allocatedNodeCount)}.`}</span>
      {status.alreadySelectedGoalCount > 0 ? (
        <span>{` ${formatGoalCount(status.alreadySelectedGoalCount)} already selected.`}</span>
      ) : null}
      {status.missingNodeCount > 0 ? (
        <span>{` ${formatPassiveCount(status.missingNodeCount)} not found in this tree.`}</span>
      ) : null}
    </p>
  );
}

function BuildGoalStatusMessage({ status }: { status: BuildGoalsPanelStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "running" && status.pointCost !== undefined) {
    return (
      <div className="build-goals-status running" role="status">
        <p>{`Best found so far: ${formatPointCost(status.pointCost)}`}</p>
        {status.improvementHistory && status.improvementHistory.length > 1 ? (
          <p>{`Improved: ${status.improvementHistory.map((pointCost) => String(pointCost)).join(" -> ")}`}</p>
        ) : null}
        <p>Still searching...</p>
      </div>
    );
  }

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
  if (status.kind === "success") {
    if (status.searchType === "anytime") {
      return `Best route found: ${formatPointCost(status.pointCost)}`;
    }
    return `Optimized route: ${formatPointCost(status.pointCost)}`;
  }
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

function formatGoalCount(goalCount: number): string {
  return `${goalCount} build ${goalCount === 1 ? "goal" : "goals"}`;
}

function formatPassiveCount(passiveCount: number): string {
  return `${passiveCount} allocated ${passiveCount === 1 ? "passive" : "passives"}`;
}

function nodeTypeLabel(node: TreeNode): string {
  if (node.flags.keystone) return "Keystone";
  if (node.flags.notable) return "Notable";
  if (node.flags.jewelSocket) return "Jewel socket";
  return "Passive";
}
