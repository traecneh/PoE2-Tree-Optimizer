export type DebugOverlayState = {
  showNodeIds: boolean;
  highlightMissingStats: boolean;
  highlightOrphans: boolean;
  showEdgeRoutes: boolean;
  showEdgeRouteLabels: boolean;
};

export function DebugControls({
  value,
  onChange,
}: {
  value: DebugOverlayState;
  onChange: (next: DebugOverlayState) => void;
}) {
  return (
    <div className="debug-controls">
      <label>
        <input
          type="checkbox"
          checked={value.showNodeIds}
          onChange={(event) => onChange({ ...value, showNodeIds: event.currentTarget.checked })}
        />{" "}
        Node IDs
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.highlightMissingStats}
          onChange={(event) => onChange({ ...value, highlightMissingStats: event.currentTarget.checked })}
        />{" "}
        Missing stats
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.highlightOrphans}
          onChange={(event) => onChange({ ...value, highlightOrphans: event.currentTarget.checked })}
        />{" "}
        Orphans
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.showEdgeRoutes}
          onChange={(event) => onChange({ ...value, showEdgeRoutes: event.currentTarget.checked })}
        />{" "}
        Edge routes
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.showEdgeRouteLabels}
          onChange={(event) => onChange({ ...value, showEdgeRouteLabels: event.currentTarget.checked })}
        />{" "}
        Route labels
      </label>
    </div>
  );
}
