import { useEffect, useRef, useState } from "react";
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

export type BuildGoalsRouteCandidateSummary = {
  index: number;
  pointCost: number;
  pointCostRouteNumber: number;
  pointCostRouteCount: number;
};

export type PobBuildImportStatus =
  | { kind: "idle" }
  | {
    kind: "success";
    importedGoalCount: number;
    pobBasePassivePointCount: number;
    selectedAscendancyNodeCount: number;
    alreadySelectedGoalCount: number;
    missingNodeCount: number;
    pathStart?: PobBuildImportPathStartStatus;
    details?: PobBuildImportReportDetails;
  }
  | { kind: "error"; message: string };

export type PobBuildImportPathStartStatus =
  | { kind: "matched"; label: string; source: "metadata" | "allocated-start" }
  | { kind: "ambiguous"; labels: string[] }
  | { kind: "not-found"; label: string };

export type PobBuildImportReportDetails = {
  activeSpecTitle?: string;
  importedGoalNodes: PobBuildImportNodeReference[];
  alreadySelectedGoalNodes: PobBuildImportNodeReference[];
  selectedAscendancyNodes: PobBuildImportNodeReference[];
  missingNodeIds: string[];
  weaponSetNodeIds: string[];
  ignoredNodes: PobBuildImportIgnoredNodeReference[];
};

export type PobBuildImportNodeReference = {
  nodeId: string;
  label?: string;
};

export type PobBuildImportIgnoredReason =
  | "class-start"
  | "ascendancy"
  | "hidden"
  | "not-goalable"
  | "not-main-tree"
  | "not-connected";

export type PobBuildImportIgnoredNodeReference = PobBuildImportNodeReference & {
  reason: PobBuildImportIgnoredReason;
};

type BuildGoalsPanelProps = {
  goals: BuildGoalsPanelGoal[];
  status: BuildGoalsPanelStatus;
  pobImportCode: string;
  pobImportStatus: PobBuildImportStatus;
  canApplyOptimizedRoute: boolean;
  routeCandidateSummaries?: BuildGoalsRouteCandidateSummary[];
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
  onSelectRouteCandidate?: (routeIndex: number) => void;
};

const optimizerNoImprovementSeconds = 60;

export function BuildGoalsPanel({
  goals,
  status,
  pobImportCode,
  pobImportStatus,
  canApplyOptimizedRoute,
  routeCandidateSummaries = [],
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
  onSelectRouteCandidate,
}: BuildGoalsPanelProps) {
  const running = status.kind === "running";
  const routeCandidateCount = routeCandidateSummaries.length;
  const selectedRouteCandidate = routeCandidateSummaries[selectedRouteIndex];
  const routeCandidateCostGroups = groupRouteCandidateCostSummaries(routeCandidateSummaries);
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
        <div className="optimized-route-options" aria-label="Optimized route candidates">
          <div className="optimized-route-nav">
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
            <span className="optimized-route-nav-label">
              <span>{`Route ${selectedRouteIndex + 1} of ${routeCandidateCount}`}</span>
              {selectedRouteCandidate ? (
                <span className="optimized-route-nav-detail">
                  {formatRouteCandidateDetail(selectedRouteCandidate)}
                </span>
              ) : null}
            </span>
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
          {routeCandidateCostGroups.length > 1 ? (
            <div className="optimized-route-cost-groups" aria-label="Route point costs">
              {routeCandidateCostGroups.map((group) => (
                <button
                  key={group.pointCost}
                  className={`optimized-route-cost-chip${group.pointCost === selectedRouteCandidate?.pointCost ? " active" : ""}`}
                  type="button"
                  aria-label={`${formatPointCost(group.pointCost)} (${group.routeCount} ${group.routeCount === 1 ? "route" : "routes"})`}
                  aria-current={group.pointCost === selectedRouteCandidate?.pointCost ? "true" : undefined}
                  onClick={() => onSelectRouteCandidate?.(group.firstRouteIndex)}
                  disabled={!onSelectRouteCandidate}
                >
                  {`${group.pointCost} (${group.routeCount})`}
                </button>
              ))}
            </div>
          ) : null}
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
    <>
      <p className="pob-import-status success" role="status">
        <span>{`Imported ${formatGoalCount(status.importedGoalCount)}.`}</span>
        <span>{` PoB base passives: ${status.pobBasePassivePointCount}.`}</span>
        {status.selectedAscendancyNodeCount > 0 ? (
          <span>{` Selected ${formatAscendancyPassiveCount(status.selectedAscendancyNodeCount)}.`}</span>
        ) : null}
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
      <PobImportReport details={status.details} />
    </>
  );
}

function PobImportReport({ details }: { details: PobBuildImportReportDetails | undefined }) {
  if (!details || !hasPobImportReportDetails(details)) return null;
  const ignoredGroups = groupIgnoredNodes(details.ignoredNodes);

  return (
    <details className="pob-import-report">
      <summary>Import details</summary>
      {details.activeSpecTitle ? (
        <p className="pob-import-report-spec">{`PoB tree spec: ${details.activeSpecTitle}`}</p>
      ) : null}
      <PobImportNodeGroup title="New build goals" nodes={details.importedGoalNodes} />
      <PobImportNodeGroup title="Already selected goals" nodes={details.alreadySelectedGoalNodes} />
      <PobImportNodeGroup title="Selected ascendancy passives" nodes={details.selectedAscendancyNodes} />
      <PobImportIdGroup title="Not found in current tree data" nodeIds={details.missingNodeIds} limit={24} />
      <PobImportIdGroup title="Ignored weapon-set passives" nodeIds={details.weaponSetNodeIds} limit={16} />
      {ignoredGroups.map((group) => (
        <PobImportNodeGroup
          key={group.reason}
          title={formatIgnoredReasonLabel(group.reason)}
          nodes={group.nodes}
          limit={12}
        />
      ))}
    </details>
  );
}

function hasPobImportReportDetails(details: PobBuildImportReportDetails): boolean {
  return Boolean(
    details.activeSpecTitle
    || details.importedGoalNodes.length > 0
    || details.alreadySelectedGoalNodes.length > 0
    || details.selectedAscendancyNodes.length > 0
    || details.missingNodeIds.length > 0
    || details.weaponSetNodeIds.length > 0
    || details.ignoredNodes.length > 0
  );
}

function PobImportNodeGroup({
  title,
  nodes,
  limit = 16,
}: {
  title: string;
  nodes: PobBuildImportNodeReference[];
  limit?: number;
}) {
  if (nodes.length === 0) return null;
  const visibleNodes = nodes.slice(0, limit);
  const hiddenCount = nodes.length - visibleNodes.length;

  return (
    <section className="pob-import-report-group">
      <h3>{`${title} (${nodes.length})`}</h3>
      <ul>
        {visibleNodes.map((node) => (
          <li key={node.nodeId}>{formatImportNodeReference(node)}</li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <p className="pob-import-report-more">{`and ${hiddenCount} more`}</p>
      ) : null}
    </section>
  );
}

function PobImportIdGroup({
  title,
  nodeIds,
  limit = 16,
}: {
  title: string;
  nodeIds: string[];
  limit?: number;
}) {
  if (nodeIds.length === 0) return null;
  return (
    <PobImportNodeGroup
      title={title}
      nodes={nodeIds.map((nodeId) => ({ nodeId }))}
      limit={limit}
    />
  );
}

function groupIgnoredNodes(nodes: PobBuildImportIgnoredNodeReference[]) {
  const groups = new Map<PobBuildImportIgnoredReason, PobBuildImportIgnoredNodeReference[]>();
  for (const node of nodes) {
    const group = groups.get(node.reason);
    if (group) group.push(node);
    else groups.set(node.reason, [node]);
  }

  return Array.from(groups, ([reason, groupNodes]) => ({ reason, nodes: groupNodes }));
}

function formatImportNodeReference(node: PobBuildImportNodeReference): string {
  return node.label ? `${node.label} (${node.nodeId})` : node.nodeId;
}

function formatIgnoredReasonLabel(reason: PobBuildImportIgnoredReason): string {
  if (reason === "class-start") return "Ignored class starts";
  if (reason === "ascendancy") return "Ignored ascendancy passives";
  if (reason === "hidden") return "Ignored gated or hidden passives";
  if (reason === "not-goalable") return "Ignored pathing passives";
  if (reason === "not-main-tree") return "Ignored non-main-tree passives";
  return "Ignored disconnected build goals";
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
  const countdownResetKey = optimizerCountdownResetKey(status);
  const secondsUntilNoImprovementStop = useOptimizerImprovementCountdown(countdownResetKey);

  if (status.kind === "idle") return null;
  if (status.kind === "running" && status.pointCost !== undefined) {
    return (
      <div className="build-goals-status running" role="status">
        <p>{`Best found so far: ${formatPointCost(status.pointCost)}`}</p>
        {status.improvementHistory && status.improvementHistory.length > 1 ? (
          <p>{`Improved: ${status.improvementHistory.map((pointCost) => String(pointCost)).join(" -> ")}`}</p>
        ) : null}
        <p>Still searching...</p>
        <OptimizerCountdown secondsRemaining={secondsUntilNoImprovementStop} />
      </div>
    );
  }

  const message = formatStatusMessage(status);
  if (!message) return null;

  if (status.kind === "success") {
    const detail = formatSuccessStatusDetail(status);
    return (
      <div className="build-goals-status success" role="status">
        <p>{message}</p>
        {detail ? <p className="build-goals-status-detail">{detail}</p> : null}
      </div>
    );
  }

  return (
    <p className={`build-goals-status ${status.kind}`} role="status">
      {message}
    </p>
  );
}

function OptimizerCountdown({ secondsRemaining }: { secondsRemaining: number }) {
  return (
    <div className="optimizer-countdown">
      <progress
        className="optimizer-countdown-progress"
        aria-label="Optimizer improvement countdown"
        max={optimizerNoImprovementSeconds}
        value={secondsRemaining}
      />
      <p className="optimizer-countdown-label">
        {`Stopping in ${secondsRemaining}s unless a better route is found.`}
      </p>
    </div>
  );
}

function useOptimizerImprovementCountdown(resetKey: string | undefined): number {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const startAtMsRef = useRef(nowMs);
  const resetKeyRef = useRef(resetKey);

  if (resetKey !== resetKeyRef.current) {
    resetKeyRef.current = resetKey;
    startAtMsRef.current = Date.now();
  }

  useEffect(() => {
    if (!resetKey) return undefined;

    setNowMs(Date.now());
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [resetKey]);

  const elapsedMs = resetKey ? nowMs - startAtMsRef.current : 0;
  const secondsRemaining = Math.ceil((optimizerNoImprovementSeconds * 1_000 - elapsedMs) / 1_000);
  return Math.min(optimizerNoImprovementSeconds, Math.max(0, secondsRemaining));
}

function optimizerCountdownResetKey(status: BuildGoalsPanelStatus): string | undefined {
  if (status.kind !== "running" || status.pointCost === undefined) return undefined;
  return `${status.pointCost}:${status.improvementHistory?.join("|") ?? ""}`;
}

function formatSuccessStatusDetail(status: Extract<BuildGoalsPanelStatus, { kind: "success" }>): string | undefined {
  if (status.completeReason === "exact") return "Exact route found.";
  if (status.completeReason === "bounded") return "Bounded route search completed.";
  if (status.completeReason === "no-improvement") return "Stopped after 60s without improvement.";
  if (status.completeReason === "iteration-limit") return "Stopped after the iteration limit.";
  if (status.completeReason === "cancelled") return "Cancelled after showing the best route found.";
  if (status.searchType === "exact") return "Exact route found.";
  if (status.searchType === "bounded") return "Bounded route search completed.";
  if (status.searchType === "anytime") return "Search completed.";
  return undefined;
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

function formatRouteCandidateDetail(candidate: BuildGoalsRouteCandidateSummary): string {
  return `${formatPointCost(candidate.pointCost)} · variant ${candidate.pointCostRouteNumber} of ${candidate.pointCostRouteCount}`;
}

function groupRouteCandidateCostSummaries(routeCandidates: BuildGoalsRouteCandidateSummary[]) {
  const groups = new Map<number, { pointCost: number; routeCount: number; firstRouteIndex: number }>();
  for (const candidate of routeCandidates) {
    const group = groups.get(candidate.pointCost);
    if (group) {
      group.routeCount += 1;
      continue;
    }

    groups.set(candidate.pointCost, {
      pointCost: candidate.pointCost,
      routeCount: 1,
      firstRouteIndex: candidate.index,
    });
  }

  return Array.from(groups.values()).sort((left, right) => left.pointCost - right.pointCost);
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

function formatAscendancyPassiveCount(passiveCount: number): string {
  return `${passiveCount} ascendancy ${passiveCount === 1 ? "passive" : "passives"}`;
}

function nodeTypeLabel(node: TreeNode): string {
  if (node.flags.keystone) return "Keystone";
  if (node.flags.notable) return "Notable";
  if (node.flags.jewelSocket) return "Jewel socket";
  return "Passive";
}
