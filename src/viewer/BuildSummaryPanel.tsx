import { Children, type ReactNode } from "react";
import type { BuildSummary } from "../tree/buildSummary";

type BuildSummaryPanelProps = {
  summary: BuildSummary;
};

export function BuildSummaryPanel({ summary }: BuildSummaryPanelProps) {
  const hasStats = summary.summedStats.length > 0 || summary.otherStats.length > 0;

  return (
    <aside className="build-summary-panel" aria-label="Build summary">
      <div className="build-summary-header">
        <h2>Build summary</h2>
        <p>{formatPointCount(summary.pointCount)}</p>
      </div>
      {summary.pointCount === 0 && !hasStats ? (
        <p className="build-summary-empty">No allocated passives yet.</p>
      ) : (
        <>
          <SummarySection title="Totals" emptyText="No numeric effects yet.">
            {summary.summedStats.map((stat) => (
              <li key={stat.key} className="build-summary-stat" title={formatSourceTitle(stat.sourceNodeNames)}>
                <span>{stat.text}</span>
              </li>
            ))}
          </SummarySection>
          <SummarySection title="Other effects" emptyText="No other effects.">
            {summary.otherStats.map((stat) => (
              <li key={stat.text} className="build-summary-stat" title={formatSourceTitle(stat.sourceNodeNames)}>
                <span>{stat.text}</span>
                {stat.count > 1 ? <span className="build-summary-count">{`x${stat.count}`}</span> : null}
              </li>
            ))}
          </SummarySection>
        </>
      )}
    </aside>
  );
}

type SummarySectionProps = {
  title: string;
  emptyText: string;
  children: ReactNode;
};

function SummarySection({ title, emptyText, children }: SummarySectionProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <section className="build-summary-section">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ol className="build-summary-list">{items}</ol>
      ) : (
        <p className="build-summary-section-empty">{emptyText}</p>
      )}
    </section>
  );
}

function formatPointCount(pointCount: number): string {
  return `${pointCount} allocated ${pointCount === 1 ? "point" : "points"}`;
}

function formatSourceTitle(sourceNodeNames: string[]): string | undefined {
  if (sourceNodeNames.length < 2) return undefined;
  return `${sourceNodeNames.length} sources: ${sourceNodeNames.join("; ")}`;
}
