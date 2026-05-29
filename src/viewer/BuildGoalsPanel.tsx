import type { TreeNode } from "../tree/types";
import { ControlTooltip } from "./ControlTooltip";

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
    pathStart?: PobBuildImportPathStartStatus;
  }
  | { kind: "error"; message: string };

export type PobBuildImportPathStartStatus =
  | { kind: "matched"; label: string; source: "metadata" | "allocated-start" }
  | { kind: "ambiguous"; labels: string[] }
  | { kind: "not-found"; label: string };

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
        <ControlTooltip
          id="clear-build-goals-tooltip"
          text="Remove every selected build goal from the optimizer list."
        >
          <button
            className="tool-button build-goals-clear"
            type="button"
            aria-describedby="clear-build-goals-tooltip"
            onClick={onClearGoals}
            disabled={goals.length === 0 || running}
          >
            Clear goals
          </button>
        </ControlTooltip>
      </div>
      <div className="pob-import-control">
        <label className="pob-import-label" htmlFor="pob-build-code-input">PoB build code</label>
        <ControlTooltip
          id="pob-build-code-tooltip"
          text="Paste a Path of Building code to import eligible goals and path start."
          block
        >
          <textarea
            id="pob-build-code-input"
            className="pob-import-input"
            aria-describedby="pob-build-code-tooltip"
            value={pobImportCode}
            onChange={(event) => onPobImportCodeChange(event.currentTarget.value)}
            rows={3}
          />
        </ControlTooltip>
        <ControlTooltip
          id="import-pob-goals-tooltip"
          text="Decode the pasted PoB code and add eligible passives as Build goals."
        >
          <button
            className="tool-button pob-import-action"
            type="button"
            aria-describedby="import-pob-goals-tooltip"
            onClick={onImportPobBuildGoals}
            disabled={pobImportCode.trim().length === 0 || running}
          >
            Import PoB goals
          </button>
        </ControlTooltip>
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
              <ControlTooltip
                id={tooltipId("remove-build-goal-tooltip", node.id)}
                text="Remove this goal from the optimizer target list."
              >
                <button
                  className="tool-button build-goal-remove"
                  type="button"
                  aria-label={`Remove ${node.name ?? node.id} build goal`}
                  aria-describedby={tooltipId("remove-build-goal-tooltip", node.id)}
                  onClick={() => onRemoveGoal(node.id)}
                  disabled={running}
                >
                  Remove
                </button>
              </ControlTooltip>
            </li>
          ))}
        </ol>
      ) : (
        <p className="build-goals-empty">No build goals selected.</p>
      )}
      <div className="build-goals-actions">
        <ControlTooltip
          id="optimize-route-tooltip"
          text="Preview the shortest route through current goals from the visible allocation."
        >
          <button
            className="tool-button"
            type="button"
            aria-describedby="optimize-route-tooltip"
            onClick={onOptimize}
            disabled={goals.length === 0 || running}
          >
            Optimize route
          </button>
        </ControlTooltip>
        <ControlTooltip
          id="cancel-optimization-tooltip"
          text="Stop the running optimizer worker."
        >
          <button
            className="tool-button"
            type="button"
            aria-describedby="cancel-optimization-tooltip"
            onClick={onCancel}
            disabled={!running}
          >
            Cancel
          </button>
        </ControlTooltip>
        <ControlTooltip
          id="apply-optimized-route-tooltip"
          text="Commit the optimized preview to the current allocation."
          block
          className="optimized-route-action-tooltip"
        >
          <button
            className="tool-button optimized-route-action"
            type="button"
            aria-describedby="apply-optimized-route-tooltip"
            onClick={onApplyOptimizedRoute}
            disabled={!canApplyOptimizedRoute}
          >
            Apply optimized route
          </button>
        </ControlTooltip>
      </div>
      {hasRouteCandidates ? (
        <div className="optimized-route-nav" aria-label="Optimized route candidates">
          <ControlTooltip
            id="previous-optimized-route-tooltip"
            text="Preview the previous optimized route candidate."
          >
            <button
              className="tool-button optimized-route-nav-button"
              type="button"
              aria-label="Previous optimized route"
              aria-describedby="previous-optimized-route-tooltip"
              onClick={onPreviousRoute}
              disabled={!onPreviousRoute}
            >
              {"<"}
            </button>
          </ControlTooltip>
          <span>{`Route ${selectedRouteIndex + 1} of ${routeCandidateCount}`}</span>
          <ControlTooltip
            id="next-optimized-route-tooltip"
            text="Preview the next optimized route candidate."
          >
            <button
              className="tool-button optimized-route-nav-button"
              type="button"
              aria-label="Next optimized route"
              aria-describedby="next-optimized-route-tooltip"
              onClick={onNextRoute}
              disabled={!onNextRoute}
            >
              {">"}
            </button>
          </ControlTooltip>
        </div>
      ) : null}
      <BuildGoalStatusMessage status={status} />
    </section>
  );
}

function tooltipId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
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
      {status.pathStart ? (
        <span>{` ${formatPobPathStartStatus(status.pathStart)}`}</span>
      ) : null}
    </p>
  );
}

function formatPobPathStartStatus(status: PobBuildImportPathStartStatus): string {
  if (status.kind === "matched" && status.source === "metadata") {
    return `Path start set to ${status.label} from PoB.`;
  }
  if (status.kind === "matched") {
    return `Path start inferred as ${status.label} from allocated start.`;
  }
  if (status.kind === "ambiguous") {
    return `Path start unchanged because the allocated start is shared by ${status.labels.join(", ")}.`;
  }
  return `Path start unchanged because ${status.label} was not found in this tree.`;
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
