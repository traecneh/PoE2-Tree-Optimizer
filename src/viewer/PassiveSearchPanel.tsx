import type { PassiveSearchResult } from "../tree/passiveSearch";
import type { TreeNode } from "../tree/types";

export type PassiveSearchPanelResult = PassiveSearchResult & {
  allocationDistance?: number;
  allocated?: boolean;
};

type PassiveSearchPanelProps = {
  query: string;
  results: PassiveSearchPanelResult[];
  selectedNodeId?: string;
  onQueryChange: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
  onHoverNode?: (nodeId: string | undefined) => void;
};

export function PassiveSearchPanel({
  query,
  results,
  selectedNodeId,
  onQueryChange,
  onSelectNode,
  onHoverNode,
}: PassiveSearchPanelProps) {
  const trimmedQuery = query.trim();

  return (
    <section className="passive-search-panel" aria-label="Passive search panel">
      <label className="passive-search-label" htmlFor="passive-search-input">Passive search</label>
      <input
        id="passive-search-input"
        className="passive-search-input"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        placeholder="Name, stat, effect, socket"
      />
      {trimmedQuery ? (
        <>
          <div className="search-summary">{formatMatchCount(results.length)}</div>
          {results.length > 0 ? (
            <ol className="search-results">
              {results.map(({ node, matchedText, allocationDistance, allocated = false }) => (
                <li key={node.id}>
                  <button
                    className={`search-result${node.id === selectedNodeId ? " selected" : ""}`}
                    type="button"
                    aria-label={formatResultLabel(node)}
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
                </li>
              ))}
            </ol>
          ) : null}
        </>
      ) : null}
    </section>
  );
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
