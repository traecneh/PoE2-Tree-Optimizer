import { useEffect, useRef, useState } from "react";
import type { AllocationMode } from "../app/weaponSetAllocation";
import type { BuildSummary } from "../tree/buildSummary";
import type { OptimizedRouteChoice } from "../tree/optimizedRouteChoice";
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

export type BuildGoalsRouteCandidateDetails = {
  pointCost: number;
  pointDeltaFromBest: number;
  addedNodeCount: number;
  selectedOnlyNodeNames: string[];
  bestOnlyNodeNames: string[];
  selectedOnlyEdgeCount: number;
  bestOnlyEdgeCount: number;
  routeSummary: BuildSummary;
  selectedOnlySummary: BuildSummary;
  bestOnlySummary: BuildSummary;
};

export type PobBuildImportStatus =
  | { kind: "idle" }
  | {
    kind: "success";
    importedGoalCount: number;
    pobBasePassivePointCount: number;
    selectedAscendancyNodeCount: number;
    selectedWeaponSet1NodeCount: number;
    selectedWeaponSet2NodeCount: number;
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
  routeDetails?: BuildGoalsRouteCandidateDetails;
  appliedRouteChoice?: OptimizedRouteChoice;
  selectedRouteIndex?: number;
  activeAllocationMode?: AllocationMode;
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
  routeDetails,
  appliedRouteChoice,
  selectedRouteIndex = 0,
  activeAllocationMode = "main",
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
  const applyRouteLabel = hasRouteCandidates ? "Apply selected route" : "Apply optimized route";
  const applyRouteTooltip = hasRouteCandidates
    ? "Commit the selected optimized route candidate to the current allocation."
    : "Commit the optimized preview to the current allocation.";

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
      <WeaponSetModeNotice mode={activeAllocationMode} />
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
          text={applyRouteTooltip}
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
            {applyRouteLabel}
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
      {routeDetails ? <OptimizedRouteDetails details={routeDetails} /> : null}
      {appliedRouteChoice ? <AppliedOptimizedRouteChoiceMessage choice={appliedRouteChoice} /> : null}
      <BuildGoalStatusMessage status={status} />
    </section>
  );
}

function WeaponSetModeNotice({ mode }: { mode: AllocationMode }) {
  if (mode === "main") return null;
  const label = mode === "weapon1" ? "Weapon Set 1" : "Weapon Set 2";

  return (
    <div className="build-goals-weapon-set-note" role="note">
      <strong>{`${label} mode is active.`}</strong>
      <span>Build goals and Optimize route still affect the main tree only.</span>
      <span>{`To add ${label} passives, left-click eligible nodes directly on the tree.`}</span>
    </div>
  );
}

function tooltipId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

function AppliedOptimizedRouteChoiceMessage({ choice }: { choice: OptimizedRouteChoice }) {
  const deltaText = choice.pointDeltaFromBest > 0
    ? `+${choice.pointDeltaFromBest} vs best`
    : "matches best";

  return (
    <p className="optimized-route-applied" role="status">
      <span>{`Applied route ${choice.routeNumber} of ${choice.routeCount} · ${formatPointCost(choice.pointCost)} · ${deltaText}.`}</span>
      <span>Saving this build keeps the selected route.</span>
    </p>
  );
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
        {status.selectedWeaponSet1NodeCount > 0 || status.selectedWeaponSet2NodeCount > 0 ? (
          <span>{` Selected weapon sets: ${status.selectedWeaponSet1NodeCount}/${status.selectedWeaponSet2NodeCount}.`}</span>
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
      <PobImportIdGroup title="Selected weapon-set passives" nodeIds={details.weaponSetNodeIds} limit={16} />
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

function OptimizedRouteDetails({ details }: { details: BuildGoalsRouteCandidateDetails }) {
  return (
    <section className="optimized-route-details" aria-label="Selected route details">
      <div className="optimized-route-details-header">
        <h3>Route details</h3>
        <span>{formatRouteDelta(details.pointDeltaFromBest)}</span>
      </div>
      <p className="optimized-route-details-count">{formatAddedPassiveCount(details.addedNodeCount)}</p>
      <RouteDifferenceList
        title="Only in this route"
        nodeNames={details.selectedOnlyNodeNames}
        emptyText={details.pointDeltaFromBest === 0 ? "No passive difference from the best route." : "No extra passives beyond the best route."}
      />
      {details.bestOnlyNodeNames.length > 0 ? (
        <RouteDifferenceList
          title="Only in best route"
          nodeNames={details.bestOnlyNodeNames}
          emptyText="No passives only in the best route."
        />
      ) : null}
      {details.selectedOnlyEdgeCount > 0 || details.bestOnlyEdgeCount > 0 ? (
        <p className="optimized-route-edge-delta">
          {formatEdgeDelta(details.selectedOnlyEdgeCount, details.bestOnlyEdgeCount)}
        </p>
      ) : null}
      <RouteEffectSummary
        title="Route effects"
        summary={details.routeSummary}
        emptyText="This route adds no stat lines."
      />
      {details.selectedOnlyNodeNames.length > 0 ? (
        <RouteEffectSummary
          title="Unique effects here"
          summary={details.selectedOnlySummary}
          emptyText="The unique passives here add no stat lines."
        />
      ) : null}
    </section>
  );
}

function RouteDifferenceList({
  title,
  nodeNames,
  emptyText,
}: {
  title: string;
  nodeNames: string[];
  emptyText: string;
}) {
  const visibleNodeNames = nodeNames.slice(0, 6);
  const hiddenCount = nodeNames.length - visibleNodeNames.length;

  return (
    <section className="optimized-route-difference">
      <h4>{title}</h4>
      {visibleNodeNames.length > 0 ? (
        <>
          <ul>
            {visibleNodeNames.map((nodeName) => <li key={nodeName}>{nodeName}</li>)}
          </ul>
          {hiddenCount > 0 ? <p>{`and ${hiddenCount} more`}</p> : null}
        </>
      ) : (
        <p>{emptyText}</p>
      )}
    </section>
  );
}

function RouteEffectSummary({
  title,
  summary,
  emptyText,
}: {
  title: string;
  summary: BuildSummary;
  emptyText: string;
}) {
  const visibleSummedStats = summary.summedStats.slice(0, 5);
  const visibleOtherStats = summary.otherStats.slice(0, 3);
  const hiddenCount = (summary.summedStats.length - visibleSummedStats.length)
    + (summary.otherStats.length - visibleOtherStats.length);

  return (
    <section className="optimized-route-effect-summary">
      <h4>{title}</h4>
      {visibleSummedStats.length > 0 || visibleOtherStats.length > 0 ? (
        <>
          <ul>
            {visibleSummedStats.map((stat) => (
              <li key={stat.key} title={formatSourceTitle(stat.sourceNodeNames)}>
                {stat.text}
              </li>
            ))}
            {visibleOtherStats.map((stat) => (
              <li key={stat.text} title={formatSourceTitle(stat.sourceNodeNames)}>
                <span>{stat.text}</span>
                {stat.count > 1 ? <span className="optimized-route-effect-count">{`x${stat.count}`}</span> : null}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 ? <p>{`and ${hiddenCount} more effects`}</p> : null}
        </>
      ) : (
        <p>{emptyText}</p>
      )}
    </section>
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

function formatRouteDelta(pointDeltaFromBest: number): string {
  if (pointDeltaFromBest === 0) return "Current best route";
  return `+${formatPointCost(pointDeltaFromBest)} compared with best route`;
}

function formatAddedPassiveCount(addedNodeCount: number): string {
  return `${addedNodeCount} added ${addedNodeCount === 1 ? "passive" : "passives"}`;
}

function formatEdgeDelta(selectedOnlyEdgeCount: number, bestOnlyEdgeCount: number): string {
  return `${selectedOnlyEdgeCount} route ${selectedOnlyEdgeCount === 1 ? "link differs" : "links differ"} here; ${bestOnlyEdgeCount} route ${bestOnlyEdgeCount === 1 ? "link" : "links"} only in best.`;
}

function formatSourceTitle(sourceNodeNames: string[]): string | undefined {
  if (sourceNodeNames.length < 2) return undefined;
  return `${sourceNodeNames.length} sources: ${sourceNodeNames.join("; ")}`;
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
