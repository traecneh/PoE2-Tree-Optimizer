import { Children, memo, useId, type ReactNode } from "react";
import type { BuildSummary } from "../tree/buildSummary";
import { InfoTooltip } from "./ControlTooltip";

type BuildSummaryPanelProps = {
  summary: BuildSummary;
};

export const BuildSummaryPanel = memo(function BuildSummaryPanel({ summary }: BuildSummaryPanelProps) {
  const sourceId = useId();
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
            {summary.summedStats.map((stat, index) => (
              <li key={stat.key} className="build-summary-stat">
                <span>{stat.text}</span>
                <InfoTooltip id={`${sourceId}-total-${index}`} label={`Sources for ${stat.text}`}><SourceList names={stat.sourceNodeNames} /></InfoTooltip>
              </li>
            ))}
          </SummarySection>
          <SummarySection title="Other effects" emptyText="No other effects.">
            {summary.otherStats.map((stat, index) => (
              <li key={stat.text} className="build-summary-stat">
                <span>{stat.text}</span>
                {stat.count > 1 ? <span className="build-summary-count">{`x${stat.count}`}</span> : null}
                <InfoTooltip id={`${sourceId}-other-${index}`} label={`Sources for ${stat.text}`}><SourceList names={stat.sourceNodeNames} /></InfoTooltip>
              </li>
            ))}
          </SummarySection>
        </>
      )}
    </aside>
  );
});

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

function SourceList({ names }: { names: string[] }) {
  return <><p>{names.length} {names.length === 1 ? "source" : "sources"}</p><ul>{names.map((name, index) => <li key={index}>{name}</li>)}</ul></>;
}
