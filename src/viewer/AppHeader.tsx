import { useRef } from "react";
import { maxAscendancyAllocationCount } from "../app/ascendancyAllocation";
import { defaultWeaponSetPointLimit, type AllocationMode } from "../app/weaponSetAllocation";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { OptimizedRouteChoice } from "../tree/optimizedRouteChoice";
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
  canExportSavedBuilds: boolean;
  classStartOptions: ClassStartOption[];
  selectedClassStartId: string | undefined;
  nodeVisualScale: number;
  nodeVisualScaleOptions: readonly number[];
  activeAllocationMode: AllocationMode;
  hoverPathPreviewEnabled: boolean;
  allocatedPointCount: number;
  mainPassivePointCount: number;
  weaponSet1PointCount: number;
  weaponSet2PointCount: number;
  activeAscendancyPointCount: number;
  hasSelectedAscendancy: boolean;
  canResetAllocation: boolean;
  onLoadSavedBuild: (buildId: string) => void;
  onSavedBuildNameChange: (name: string) => void;
  onNewUnsavedBuild: () => void;
  onSaveCurrentBuild: () => void;
  onDeleteSelectedBuild: () => void;
  onExportSavedBuilds: () => void;
  onImportSavedBuildsFile: (file: File) => void;
  onChangeSelectedClassStart: (classStartId: string) => void;
  onNodeVisualScaleChange: (scale: number) => void;
  onChangeActiveAllocationMode: (mode: AllocationMode) => void;
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
  canExportSavedBuilds,
  classStartOptions,
  selectedClassStartId,
  nodeVisualScale,
  nodeVisualScaleOptions,
  activeAllocationMode,
  hoverPathPreviewEnabled,
  allocatedPointCount,
  mainPassivePointCount,
  weaponSet1PointCount,
  weaponSet2PointCount,
  activeAscendancyPointCount,
  hasSelectedAscendancy,
  canResetAllocation,
  onLoadSavedBuild,
  onSavedBuildNameChange,
  onNewUnsavedBuild,
  onSaveCurrentBuild,
  onDeleteSelectedBuild,
  onExportSavedBuilds,
  onImportSavedBuildsFile,
  onChangeSelectedClassStart,
  onNodeVisualScaleChange,
  onChangeActiveAllocationMode,
  onToggleHoverPathPreview,
  onResetAllocation,
}: AppHeaderProps) {
  const selectedSavedBuild = savedBuilds.find((build) => build.id === selectedSavedBuildId);
  const selectedOptimizedRouteChoice = selectedSavedBuild?.state.optimizedRouteChoice;
  const importInputRef = useRef<HTMLInputElement>(null);

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
                <li>Mode: Main edits the normal passive tree and is used by Build goals and Optimize route.</li>
                <li>Mode: W1 and W2 edit weapon-set-specific passives manually; select W1 or W2, then left-click eligible nodes on the tree.</li>
                <li>Check Hover path preview to see routes while hovering unallocated nodes.</li>
                <li>Use Path start for class or ascendancy start, Node size for visibility, and Reset allocation to clear selected nodes.</li>
                <li>Use New build, Save build, the build dropdown, Delete build, Export, and Import to manage or share saved trees.</li>
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
                  <option key={build.id} value={build.id}>{formatSavedBuildOptionLabel(build)}</option>
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
          <ControlTooltip id="export-builds-tooltip" text="Download all saved builds as a JSON backup file.">
            <button
              className="tool-button saved-build-button"
              type="button"
              aria-label="Export builds"
              aria-describedby="export-builds-tooltip"
              onClick={() => onExportSavedBuilds()}
              disabled={!canExportSavedBuilds}
            >
              Export
            </button>
          </ControlTooltip>
          <ControlTooltip id="import-builds-tooltip" text="Import saved builds from a JSON backup file.">
            <button
              className="tool-button saved-build-button"
              type="button"
              aria-label="Import builds"
              aria-describedby="import-builds-tooltip"
              onClick={() => importInputRef.current?.click()}
            >
              Import
            </button>
          </ControlTooltip>
          <input
            ref={importInputRef}
            className="saved-build-import-input"
            type="file"
            aria-label="Import builds file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              onImportSavedBuildsFile(file);
              event.currentTarget.value = "";
            }}
          />
          {selectedOptimizedRouteChoice ? (
            <span className="saved-build-route-choice">
              {formatSavedOptimizedRouteChoice(selectedOptimizedRouteChoice)}
            </span>
          ) : null}
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
          <div className="allocation-mode-control" role="group" aria-label="Allocation mode">
            <span className="allocation-mode-label">Mode</span>
            <div className="allocation-mode-buttons">
              <ControlTooltip id="allocation-mode-main-tooltip" text="View and edit main tree allocations that apply to both weapon sets.">
                <button
                  className="mode-button"
                  type="button"
                  aria-label="Main allocation mode"
                  aria-describedby="allocation-mode-main-tooltip"
                  aria-pressed={activeAllocationMode === "main"}
                  onClick={() => onChangeActiveAllocationMode("main")}
                >
                  Main
                </button>
              </ControlTooltip>
              <ControlTooltip id="allocation-mode-weapon1-tooltip" text="View Weapon Set 1 passives imported from PoB. Route optimizer still uses the main tree.">
                <button
                  className="mode-button"
                  type="button"
                  aria-label="Weapon Set 1 allocation mode"
                  aria-describedby="allocation-mode-weapon1-tooltip"
                  aria-pressed={activeAllocationMode === "weapon1"}
                  onClick={() => onChangeActiveAllocationMode("weapon1")}
                >
                  W1
                </button>
              </ControlTooltip>
              <ControlTooltip id="allocation-mode-weapon2-tooltip" text="View Weapon Set 2 passives imported from PoB. Route optimizer still uses the main tree.">
                <button
                  className="mode-button"
                  type="button"
                  aria-label="Weapon Set 2 allocation mode"
                  aria-describedby="allocation-mode-weapon2-tooltip"
                  aria-pressed={activeAllocationMode === "weapon2"}
                  onClick={() => onChangeActiveAllocationMode("weapon2")}
                >
                  W2
                </button>
              </ControlTooltip>
            </div>
          </div>
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
            <ControlTooltip id="allocated-count-tooltip" text="PoB-style base passive total: main tree plus the larger weapon set side.">
              <span className="allocation-count-row" aria-describedby="allocated-count-tooltip">
                {formatAllocatedPointCount(allocatedPointCount)}
              </span>
            </ControlTooltip>
            <span className="allocation-count-row allocation-count-breakdown">
              <ControlTooltip id="main-passive-count-tooltip" text="Committed main tree passives, excluding the class start.">
                <span aria-describedby="main-passive-count-tooltip">{formatMainPassivePointCount(mainPassivePointCount)}</span>
              </ControlTooltip>
              <ControlTooltip id="weapon-set-count-tooltip" text="Weapon-set-specific passive points imported from PoB. Each set can use up to 24 points.">
                <span aria-describedby="weapon-set-count-tooltip">{formatWeaponSetPointCounts(weaponSet1PointCount, weaponSet2PointCount)}</span>
              </ControlTooltip>
              <ControlTooltip id="ascendancy-count-tooltip" text="Allocated ascendancy passives for the selected ascendancy.">
                <span aria-describedby="ascendancy-count-tooltip">
                  {hasSelectedAscendancy ? formatAscendancyPointCount(activeAscendancyPointCount) : "Ascendancy --/8"}
                </span>
              </ControlTooltip>
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

function formatMainPassivePointCount(pointCount: number): string {
  return `Main ${pointCount}/${maxPassiveAllocationPointCount}`;
}

function formatWeaponSetPointCounts(weaponSet1PointCount: number, weaponSet2PointCount: number): string {
  return `W1 ${weaponSet1PointCount}/${defaultWeaponSetPointLimit} · W2 ${weaponSet2PointCount}/${defaultWeaponSetPointLimit}`;
}

function formatAscendancyPointCount(pointCount: number): string {
  return `Ascendancy ${pointCount}/${maxAscendancyAllocationCount}`;
}

function formatSavedBuildOptionLabel(build: SavedBuild): string {
  return build.state.optimizedRouteChoice ? `${build.name} - optimized route` : build.name;
}

function formatSavedOptimizedRouteChoice(choice: OptimizedRouteChoice): string {
  const pointDeltaText = choice.pointDeltaFromBest > 0 ? `+${choice.pointDeltaFromBest} vs best` : "matches best";
  return `Saved optimized route: route ${choice.routeNumber} of ${choice.routeCount}, ${formatPointCost(choice.pointCost)}, ${pointDeltaText}.`;
}

function formatPointCost(pointCost: number): string {
  return `${pointCost} ${pointCost === 1 ? "point" : "points"}`;
}
