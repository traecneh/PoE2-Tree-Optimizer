import { maxAscendancyAllocationCount } from "../app/ascendancyAllocation";
import { defaultWeaponSetPointLimit, type AllocationMode } from "../app/weaponSetAllocation";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { SavedBuild } from "../tree/savedBuilds";
import { maxPassiveAllocationPointCount } from "../tree/passivePointBudget";
import { BuildControls } from "./BuildControls";
import { ControlTooltip } from "./ControlTooltip";

type AppHeaderProps = {
  treeDataVersionLabel: string;
  savedBuilds: SavedBuild[];
  selectedSavedBuildId: string;
  savedBuildName: string;
  savedBuildStatus: string;
  savedBuildStatusFeedbackKey: number;
  canDeleteSelectedBuild: boolean;
  canExportSavedBuilds: boolean;
  classStartOptions: ClassStartOption[];
  selectedClassStartId: string | undefined;
  activeAllocationMode: AllocationMode;
  allocatedPointCount: number;
  mainPassivePointCount: number;
  weaponSet1PointCount: number;
  weaponSet2PointCount: number;
  activeAscendancyPointCount: number;
  hasSelectedAscendancy: boolean;
  canResetAllocation: boolean;
  onLoadSavedBuild: (buildId: string) => void;
  onNewUnsavedBuild: () => void;
  onSaveCurrentBuild: (name?: string) => void;
  onRenameSelectedBuild: (name: string) => void;
  onDeleteSelectedBuild: () => void;
  onExportSavedBuilds: () => void;
  onImportSavedBuildsFile: (file: File) => void;
  onChangeSelectedClassStart: (classStartId: string) => void;
  onChangeActiveAllocationMode: (mode: AllocationMode) => void;
  onResetAllocation: () => void;
};

export function AppHeader(props: AppHeaderProps) {
  const { treeDataVersionLabel, classStartOptions, selectedClassStartId, activeAllocationMode,
    allocatedPointCount, mainPassivePointCount, weaponSet1PointCount, weaponSet2PointCount,
    activeAscendancyPointCount, hasSelectedAscendancy, canResetAllocation,
    onChangeSelectedClassStart, onChangeActiveAllocationMode, onResetAllocation,
    savedBuildStatus, savedBuildStatusFeedbackKey } = props;
  const showWeaponCounts = weaponSet1PointCount > 0 || weaponSet2PointCount > 0 || activeAllocationMode !== "main";

  return <header className="top-bar">
    <div className="top-brand">
      <h1>PoE2 Tree Optimizer for Boomslang</h1>
      <div className="brand-support">
        <span className="tree-data-version" aria-label="Tree data version">Tree data: {treeDataVersionLabel}</span>
        <ControlTooltip id="site-help-tooltip" detailsLabel="How to use the site" triggerClassName="site-help-trigger" className="site-usage-help" text={<>
          <strong>Quick controls</strong>
          <ul>
            <li>Ctrl + left click a node to add or remove it from Build goals.</li>
            <li>Click nodes on the tree to preview allocation paths, then apply the path from the node inspector.</li>
            <li>Use Passive search to find passives, add one result, or add all matching nodes with the same effect.</li>
            <li>Open Import PoB in Build goals to pull build goals from a Path of Building code.</li>
            <li>Optimize route previews a route through all Build goals. Shortest minimizes points; Build Focus favors chosen effects within an extra-point budget. Apply commits the selected route.</li>
            <li>Mode: Main edits the normal passive tree and is used by Build goals and Optimize route.</li>
            <li>Mode: W1 and W2 edit weapon-set-specific passives manually; select W1 or W2, then left-click eligible nodes on the tree.</li>
            <li>Open View settings beside the zoom controls to adjust Node size or enable Hover path preview.</li>
            <li>Use Path start for class or ascendancy start, and Reset allocation to clear selected nodes.</li>
            <li>Outer ascendancies are faded. Hover, keyboard-focus, or tap a cluster to inspect it without allocating; choose its Path start to use it in the center.</li>
            <li>With only a class selected, its ascendancy options are slightly brighter than the other outer trees.</li>
            <li>Use New build, Save build and the build dropdown to manage trees. Save asks for a name the first time. Build actions contains Rename, Delete, Export all builds and Import builds.</li>
          </ul>
        </>}>How to use the site</ControlTooltip>
      </div>
    </div>
    <div className="top-controls">
      <BuildControls {...props} />
      <div className="header-control-group tree-setup-control" role="group" aria-label="Tree setup">
        <label className="path-start-control">Path start
          <ControlTooltip id="path-start-tooltip" text="Choose the class or ascendancy start used for pathing.">
            <select aria-label="Path start" aria-describedby="path-start-tooltip" value={selectedClassStartId ?? ""}
              onChange={event => onChangeSelectedClassStart(event.currentTarget.value)}>
              {classStartOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </ControlTooltip>
        </label>
        <div className="allocation-mode-control" role="group" aria-label="Allocation mode">
          <span className="allocation-mode-label">Mode</span>
          <div className="allocation-mode-buttons">
            {(["main", "weapon1", "weapon2"] as const).map((mode, index) => {
              const label = index === 0 ? "Main" : `Weapon Set ${index}`;
              const tooltipId = `allocation-mode-${mode}-tooltip`;
              return <ControlTooltip key={mode} id={tooltipId} text={index === 0
                ? "View and edit main tree allocations that apply to both weapon sets."
                : `View and edit Weapon Set ${index} passives manually. Route optimizer still uses the main tree.`}>
                <button className="mode-button" type="button" aria-label={`${label} allocation mode`} aria-describedby={tooltipId}
                  aria-pressed={activeAllocationMode === mode} onClick={() => onChangeActiveAllocationMode(mode)}>{index === 0 ? "Main" : `W${index}`}</button>
              </ControlTooltip>;
            })}
          </div>
        </div>
      </div>
      <div className="header-control-group allocation-control" role="group" aria-label="Allocation summary">
        <div className="allocation-counts">
          <ControlTooltip id="allocated-count-tooltip" text="PoB-style base passive total: main tree plus the larger weapon set side.">
            <span className="allocation-count-row" aria-describedby="allocated-count-tooltip">Allocated {allocatedPointCount}/{maxPassiveAllocationPointCount}</span>
          </ControlTooltip>
          {showWeaponCounts || hasSelectedAscendancy ? <span className="allocation-count-row allocation-count-breakdown">
            {mainPassivePointCount !== allocatedPointCount ? <ControlTooltip id="main-passive-count-tooltip" text="Committed main tree passives, excluding the class start.">
              <span aria-describedby="main-passive-count-tooltip">Main {mainPassivePointCount}/{maxPassiveAllocationPointCount}</span>
            </ControlTooltip> : null}
            {showWeaponCounts ? <ControlTooltip id="weapon-set-count-tooltip" text="Weapon-set-specific passive points. Each set can use up to 24 points, within the overall passive budget.">
              <span aria-describedby="weapon-set-count-tooltip">W1 {weaponSet1PointCount}/{defaultWeaponSetPointLimit} · W2 {weaponSet2PointCount}/{defaultWeaponSetPointLimit}</span>
            </ControlTooltip> : null}
            {hasSelectedAscendancy ? <ControlTooltip id="ascendancy-count-tooltip" text="Allocated ascendancy passives for the selected ascendancy.">
              <span aria-describedby="ascendancy-count-tooltip">Ascendancy {activeAscendancyPointCount}/{maxAscendancyAllocationCount}</span>
            </ControlTooltip> : null}
          </span> : null}
        </div>
        <ControlTooltip id="reset-allocation-tooltip" text="Clear committed allocation and the current preview path.">
          <button className="tool-button" type="button" aria-label="Reset allocation" aria-describedby="reset-allocation-tooltip" onClick={onResetAllocation} disabled={!canResetAllocation}>Reset</button>
        </ControlTooltip>
      </div>
    </div>
    {savedBuildStatus ? <div key={savedBuildStatusFeedbackKey} className="saved-build-toast" role="status" aria-live="polite" aria-atomic="true" data-feedback-key={savedBuildStatusFeedbackKey}>{savedBuildStatus}</div> : null}
  </header>;
}
