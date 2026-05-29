import { useEffect, useRef, useState } from "react";
import type { PassiveSearchResult } from "../tree/passiveSearch";
import type { TreeNode } from "../tree/types";
import { ControlTooltip } from "./ControlTooltip";

export type PassiveSearchPanelResult = PassiveSearchResult & {
  allocationDistance?: number;
  allocated?: boolean;
};

type PassiveSearchPanelProps = {
  query: string;
  results: PassiveSearchPanelResult[];
  selectedNodeId?: string;
  buildGoalNodeIds?: ReadonlySet<string>;
  onQueryChange: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
  onHoverNode?: (nodeId: string | undefined) => void;
  canAddBuildGoal?: (node: TreeNode) => boolean;
  onAddBuildGoal?: (nodeId: string) => void;
  canAddMatchingBuildGoal?: (node: TreeNode) => boolean;
  onAddMatchingBuildGoals?: (nodeIds: string[]) => void;
};

export const passiveSearchCommitDelayMs = 1000;

export function PassiveSearchPanel({
  query,
  results,
  selectedNodeId,
  buildGoalNodeIds,
  onQueryChange,
  onSelectNode,
  onHoverNode,
  canAddBuildGoal,
  onAddBuildGoal,
  canAddMatchingBuildGoal,
  onAddMatchingBuildGoals,
}: PassiveSearchPanelProps) {
  const [draftQuery, setDraftQuery] = useState(query);
  const lastCommittedDraftQuery = useRef(query);
  const trimmedQuery = query.trim();
  const matchingBuildGoalGroups = buildMatchingBuildGoalGroups(
    results,
    buildGoalNodeIds,
    canAddMatchingBuildGoal,
  );

  useEffect(() => {
    if (query === lastCommittedDraftQuery.current) return;
    lastCommittedDraftQuery.current = query;
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    if (draftQuery === query) return;

    const timer = window.setTimeout(() => {
      lastCommittedDraftQuery.current = draftQuery;
      onQueryChange(draftQuery);
    }, passiveSearchCommitDelayMs);

    return () => window.clearTimeout(timer);
  }, [draftQuery, onQueryChange, query]);

  return (
    <section className="passive-search-panel" aria-label="Passive search panel">
      <label className="passive-search-label" htmlFor="passive-search-input">Passive search</label>
      <ControlTooltip
        id="passive-search-tooltip"
        text={<PassiveSearchTooltipContent />}
        block
        className="passive-search-help-tooltip"
      >
        <input
          id="passive-search-input"
          className="passive-search-input"
          type="search"
          aria-describedby="passive-search-tooltip"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.currentTarget.value)}
          placeholder="Name, stat, effect, socket"
        />
      </ControlTooltip>
      {trimmedQuery ? (
        <>
          <div className="search-summary">{formatMatchCount(results.length)}</div>
          {results.length > 0 ? (
            <ol className="search-results">
              {results.map(({ node, matchedText, allocationDistance, allocated = false }) => {
                const goalable = canAddBuildGoal?.(node) ?? false;
                const alreadyBuildGoal = buildGoalNodeIds?.has(node.id) ?? false;
                const matchingGroup = matchingBuildGoalGroups.get(matchedText);
                const canAddMatchingGroup = Boolean(matchingGroup && onAddMatchingBuildGoals);

                return (
                <li key={node.id} className="search-result-row">
                  <ControlTooltip
                    id={tooltipId("search-result-tooltip", node.id)}
                    text="Select this passive on the tree and focus its details."
                    block
                  >
                    <button
                      className={`search-result${node.id === selectedNodeId ? " selected" : ""}`}
                      type="button"
                      aria-label={formatResultLabel(node)}
                      aria-describedby={tooltipId("search-result-tooltip", node.id)}
                      onClick={() => {
                        onHoverNode?.(node.id);
                        onSelectNode(node.id);
                      }}
                      onMouseEnter={() => onHoverNode?.(node.id)}
                      onMouseLeave={() => onHoverNode?.(undefined)}
                      onFocus={() => onHoverNode?.(node.id)}
                      onBlur={() => onHoverNode?.(undefined)}
                    >
                      <span className="search-result-name">{node.name ?? node.id}</span>
                      <span className="search-result-meta">{formatResultMeta(node, allocationDistance, allocated)}</span>
                      <span className="search-result-match">{matchedText}</span>
                    </button>
                  </ControlTooltip>
                  {goalable || canAddMatchingGroup ? (
                    <div className="search-result-actions">
                      {goalable ? (
                        <ControlTooltip
                          id={tooltipId("search-goal-tooltip", node.id)}
                          text="Add this passive to Build goals."
                        >
                          <button
                            className="tool-button search-result-goal-action"
                            type="button"
                            aria-describedby={tooltipId("search-goal-tooltip", node.id)}
                            aria-label={alreadyBuildGoal
                              ? `${node.name ?? node.id} build goal added`
                              : `Add ${node.name ?? node.id} to build goals`}
                            onClick={() => onAddBuildGoal?.(node.id)}
                            disabled={alreadyBuildGoal}
                          >
                            {alreadyBuildGoal ? "Added" : "Goal"}
                          </button>
                        </ControlTooltip>
                      ) : null}
                      {matchingGroup && onAddMatchingBuildGoals ? (
                        <ControlTooltip
                          id={tooltipId("search-all-tooltip", node.id)}
                          text="Add every current result with this same matched effect to Build goals."
                        >
                          <button
                            className="tool-button search-result-goal-action"
                            type="button"
                            aria-describedby={tooltipId("search-all-tooltip", node.id)}
                            aria-label={`Add all ${matchingGroup.totalCount} nodes matching ${matchedText} to build goals`}
                            onClick={() => onAddMatchingBuildGoals?.(matchingGroup.addableNodeIds)}
                          >
                            All
                          </button>
                        </ControlTooltip>
                      ) : null}
                    </div>
                  ) : null}
                </li>
                );
              })}
            </ol>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function PassiveSearchTooltipContent() {
  return (
    <span className="passive-search-tooltip-guide">
      <strong>Search examples</strong>
      <span>keystone - all keystone passives</span>
      <span>notable - all notable passives</span>
      <span>empty jewel slots - jewel sockets</span>
      <span>Minion Attack Speed - minion attack speed, including attack/cast speed wording</span>
      <span>"Stun Threshold" "Energy Shield" - exact ES stun-threshold wording</span>
      <span>Flask Charges -Life -Mana - flask charge nodes excluding Life/Mana flask nodes</span>
    </span>
  );
}

function tooltipId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

type MatchingBuildGoalGroup = {
  totalCount: number;
  addableNodeIds: string[];
};

function buildMatchingBuildGoalGroups(
  results: PassiveSearchPanelResult[],
  buildGoalNodeIds: ReadonlySet<string> | undefined,
  canAddMatchingBuildGoal: ((node: TreeNode) => boolean) | undefined,
): Map<string, MatchingBuildGoalGroup> {
  const grouped = new Map<string, MatchingBuildGoalGroup>();
  if (!canAddMatchingBuildGoal) return grouped;

  for (const { node, matchedText } of results) {
    if (!canAddMatchingBuildGoal(node)) continue;

    const current = grouped.get(matchedText) ?? { totalCount: 0, addableNodeIds: [] };
    current.totalCount += 1;
    if (!buildGoalNodeIds?.has(node.id)) {
      current.addableNodeIds.push(node.id);
    }
    grouped.set(matchedText, current);
  }

  for (const [matchedText, group] of grouped) {
    if (group.totalCount < 2 || group.addableNodeIds.length === 0) {
      grouped.delete(matchedText);
    }
  }

  return grouped;
}

function formatMatchCount(count: number): string {
  return `${count} ${count === 1 ? "match" : "matches"}`;
}

function formatResultLabel(node: TreeNode): string {
  const statText = node.stats[0];
  return statText ? `${node.name ?? node.id} ${statText}` : `${node.name ?? node.id} ${nodeTypeLabel(node)}`;
}

function formatResultMeta(node: TreeNode, allocationDistance: number | undefined, allocated: boolean): string {
  return `${nodeTypeLabel(node)} · ${formatAllocationDistance(allocationDistance, allocated)}`;
}

function formatAllocationDistance(distance: number | undefined, allocated: boolean): string {
  if (allocated) return "Allocated";
  if (distance === undefined) return "No allocated path";
  return `${distance} ${distance === 1 ? "point" : "points"} from allocation`;
}

function nodeTypeLabel(node: TreeNode): string {
  if (node.flags.classStart) return "Class start";
  if (node.flags.keystone) return "Keystone";
  if (node.flags.notable) return "Notable";
  if (node.flags.jewelSocket) return "Jewel socket";
  if (node.flags.attribute) return "Attribute";
  return "Small";
}
