import { maxAscendancyAllocationCount } from "../app/ascendancyAllocation";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { SavedBuild } from "../tree/savedBuilds";
import { ControlTooltip } from "./ControlTooltip";

const maxPassiveAllocationPointCount = 123;

type AppHeaderProps = {
  treeDataVersionLabel: string;
  savedBuilds: SavedBuild[];
  selectedSavedBuildId: string;
  savedBuildName: string;
  savedBuildStatus: string;
  savedBuildStatusFeedbackKey: number;
  canSaveCurrentBuild: boolean;
  canDeleteSelectedBuild: boolean;
  classStartOptions: ClassStartOption[];
  selectedClassStartId: string | undefined;
  nodeVisualScale: number;
  nodeVisualScaleOptions: readonly number[];
  hoverPathPreviewEnabled: boolean;
  allocatedPointCount: number;
  activeAscendancyPointCount: number;
  hasSelectedAscendancy: boolean;
  canResetAllocation: boolean;
  onLoadSavedBuild: (buildId: string) => void;
  onSavedBuildNameChange: (name: string) => void;
  onNewUnsavedBuild: () => void;
  onSaveCurrentBuild: () => void;
  onDeleteSelectedBuild: () => void;
  onChangeSelectedClassStart: (classStartId: string) => void;
  onNodeVisualScaleChange: (scale: number) => void;
  onToggleHoverPathPreview: (enabled: boolean) => void;
  onResetAllocation: () => void;
};

export function AppHeader({
  treeDataVersionLabel,
  savedBuilds,
  selectedSavedBuildId,
  savedBuildName,
  savedBuildStatus,
  savedBuildStatusFeedbackKey,
  canSaveCurrentBuild,
  canDeleteSelectedBuild,
  classStartOptions,
  selectedClassStartId,
  nodeVisualScale,
  nodeVisualScaleOptions,
  hoverPathPreviewEnabled,
  allocatedPointCount,
  activeAscendancyPointCount,
  hasSelectedAscendancy,
  canResetAllocation,
  onLoadSavedBuild,
  onSavedBuildNameChange,
  onNewUnsavedBuild,
  onSaveCurrentBuild,
  onDeleteSelectedBuild,
  onChangeSelectedClassStart,
  onNodeVisualScaleChange,
  onToggleHoverPathPreview,
  onResetAllocation,
}: AppHeaderProps) {
  return (
    <header className="top-bar">
      <div className="top-brand">
        <h1>PoE2 Tree Optimizer for Boomslang</h1>
        <div className="brand-support">
          <span className="tree-data-version" aria-label="Tree data version">
            Tree data: {treeDataVersionLabel}
          </span>
          <div className="site-help">
            <button
              className="site-help-trigger"
              type="button"
              aria-describedby="site-help-tooltip"
            >
              How to use the site
            </button>
            <div
              id="site-help-tooltip"
              className="site-help-tooltip"
              role="tooltip"
              aria-label="Site usage help"
            >
              <strong>Quick controls</strong>
              <ul>
                <li>Ctrl + left click a node to add or remove it from Build goals.</li>
                <li>Click nodes on the tree to preview allocation paths, then apply the path from the node inspector.</li>
                <li>Use Passive search to find passives, add one result, or add all matching nodes with the same effect.</li>
                <li>Import PoB goals to pull build goals from a Path of Building code.</li>
                <li>Optimize route previews the shortest route through current Build goals; Apply optimized route commits it.</li>
                <li>Check Hover path preview to see routes while hovering unallocated nodes.</li>
                <li>Use Path start for class or ascendancy start, Node size for visibility, and Reset allocation to clear selected nodes.</li>
                <li>Use New build, Save build, the build dropdown, and Delete build to manage saved trees in this browser.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="top-controls">
        <div className="header-control-group saved-build-control" role="group" aria-label="Build management">
          <label className="saved-build-select-control">
            Build{" "}
            <ControlTooltip id="saved-build-tooltip" text="Load a saved build stored in this browser.">
              <select
                aria-label="Saved build"
                aria-describedby="saved-build-tooltip"
                value={selectedSavedBuildId}
                onChange={(event) => onLoadSavedBuild(event.currentTarget.value)}
              >
                <option value="">Unsaved build</option>
                {savedBuilds.map((build) => (
                  <option key={build.id} value={build.id}>{build.name}</option>
                ))}
              </select>
            </ControlTooltip>
          </label>
          <label className="saved-build-name-control">
            Name{" "}
            <ControlTooltip id="build-name-tooltip" text="Name used when saving the current build.">
              <input
                aria-label="Build name"
                aria-describedby="build-name-tooltip"
                value={savedBuildName}
                onChange={(event) => onSavedBuildNameChange(event.currentTarget.value)}
                placeholder="Build name"
              />
            </ControlTooltip>
          </label>
          <ControlTooltip id="new-build-tooltip" text="Start a new unsaved build without deleting saved builds.">
            <button
              className="tool-button saved-build-button"
              type="button"
              aria-label="New build"
              aria-describedby="new-build-tooltip"
              onClick={() => onNewUnsavedBuild()}
            >
              New
            </button>
          </ControlTooltip>
          <ControlTooltip id="save-build-tooltip" text="Save the current build name, path, goals, and settings.">
            <button
              className="tool-button saved-build-button"
              type="button"
              aria-label="Save build"
              aria-describedby="save-build-tooltip"
              onClick={() => onSaveCurrentBuild()}
              disabled={!canSaveCurrentBuild}
            >
              Save
            </button>
          </ControlTooltip>
          <ControlTooltip id="delete-build-tooltip" text="Delete the selected saved build from this browser.">
            <button
              className="tool-button saved-build-button"
              type="button"
              aria-label="Delete build"
              aria-describedby="delete-build-tooltip"
              onClick={() => onDeleteSelectedBuild()}
              disabled={!canDeleteSelectedBuild}
            >
              Delete
            </button>
          </ControlTooltip>
        </div>
        <div className="header-control-group tree-setup-control" role="group" aria-label="Tree setup">
          <label className="path-start-control">
            Path start{" "}
            <ControlTooltip id="path-start-tooltip" text="Choose the class or ascendancy start used for pathing.">
              <select
                aria-label="Path start"
                aria-describedby="path-start-tooltip"
                value={selectedClassStartId ?? ""}
                onChange={(event) => onChangeSelectedClassStart(event.currentTarget.value)}
              >
                {classStartOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </ControlTooltip>
          </label>
          <label className="node-size-control">
            Node size{" "}
            <ControlTooltip id="node-size-tooltip" text="Scale passive node icons in the tree viewer.">
              <select
                aria-label="Node size"
                aria-describedby="node-size-tooltip"
                value={nodeVisualScale}
                onChange={(event) => onNodeVisualScaleChange(Number(event.currentTarget.value))}
              >
                {nodeVisualScaleOptions.map((scale) => (
                  <option key={scale} value={scale}>{scale}x</option>
                ))}
              </select>
            </ControlTooltip>
          </label>
          <label className="hover-preview-control">
            <ControlTooltip id="hover-preview-tooltip" text="Show a temporary path preview while hovering unallocated nodes.">
              <input
                type="checkbox"
                aria-label="Hover path preview"
                aria-describedby="hover-preview-tooltip"
                checked={hoverPathPreviewEnabled}
                onChange={(event) => onToggleHoverPathPreview(event.currentTarget.checked)}
              />
            </ControlTooltip>
            Hover preview
          </label>
        </div>
        <div className="header-control-group allocation-control" role="group" aria-label="Allocation summary">
          <div className="allocation-counts">
            <ControlTooltip id="allocated-count-tooltip" text="Current committed main tree passive points out of 123.">
              <span className="allocation-count-row" aria-describedby="allocated-count-tooltip">
                {formatAllocatedPointCount(allocatedPointCount)}
              </span>
            </ControlTooltip>
            <span className="allocation-count-row">
              {hasSelectedAscendancy ? formatAscendancyPointCount(activeAscendancyPointCount) : "\u00a0"}
            </span>
          </div>
          <ControlTooltip id="reset-allocation-tooltip" text="Clear committed allocation and the current preview path.">
            <button
              className="tool-button"
              type="button"
              aria-label="Reset allocation"
              aria-describedby="reset-allocation-tooltip"
              onClick={() => onResetAllocation()}
              disabled={!canResetAllocation}
            >
              Reset
            </button>
          </ControlTooltip>
        </div>
      </div>
      {savedBuildStatus ? (
        <div
          key={savedBuildStatusFeedbackKey}
          className="saved-build-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-feedback-key={savedBuildStatusFeedbackKey}
        >
          {savedBuildStatus}
        </div>
      ) : null}
    </header>
  );
}

function formatAllocatedPointCount(pointCount: number): string {
  return `Allocated ${pointCount}/${maxPassiveAllocationPointCount}`;
}

function formatAscendancyPointCount(pointCount: number): string {
  return `Ascendancy ${pointCount}/${maxAscendancyAllocationCount}`;
}
