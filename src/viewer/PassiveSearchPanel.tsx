import type { PassiveSearchResult } from "../tree/passiveSearch";
import type { TreeNode } from "../tree/types";

type PassiveSearchPanelProps = {
  query: string;
  results: PassiveSearchResult[];
  selectedNodeId?: string;
  onQueryChange: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
};

export function PassiveSearchPanel({
  query,
  results,
  selectedNodeId,
  onQueryChange,
  onSelectNode,
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
              {results.map(({ node, matchedText }) => (
                <li key={node.id}>
                  <button
                    className={`search-result${node.id === selectedNodeId ? " selected" : ""}`}
                    type="button"
                    aria-label={formatResultLabel(node)}
                    onClick={() => onSelectNode(node.id)}
                  >
                    <span className="search-result-name">{node.name ?? node.id}</span>
                    <span className="search-result-meta">{nodeTypeLabel(node)} · {node.id}</span>
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

function nodeTypeLabel(node: TreeNode): string {
  if (node.flags.classStart) return "Class start";
  if (node.flags.keystone) return "Keystone";
  if (node.flags.notable) return "Notable";
  if (node.flags.jewelSocket) return "Jewel socket";
  if (node.flags.attribute) return "Attribute";
  return "Small";
}
