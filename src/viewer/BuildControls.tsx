import { useRef, useState } from "react";
import { Download, FilePlus2, MoreHorizontal, Pencil, Save, Trash2, Upload } from "lucide-react";
import type { SavedBuild } from "../tree/savedBuilds";
import { ControlPopover } from "./ControlPopover";
import { ControlTooltip } from "./ControlTooltip";

type Props = {
  savedBuilds: SavedBuild[];
  selectedSavedBuildId: string;
  savedBuildName: string;
  canDeleteSelectedBuild: boolean;
  canExportSavedBuilds: boolean;
  onLoadSavedBuild: (id: string) => void;
  onNewUnsavedBuild: () => void;
  onSaveCurrentBuild: (name?: string) => void;
  onRenameSelectedBuild: (name: string) => void;
  onDeleteSelectedBuild: () => void;
  onExportSavedBuilds: () => void;
  onImportSavedBuildsFile: (file: File) => void;
};

export function BuildControls(props: Props) {
  const { savedBuilds, selectedSavedBuildId, savedBuildName, canDeleteSelectedBuild, canExportSavedBuilds,
    onLoadSavedBuild, onNewUnsavedBuild, onSaveCurrentBuild, onRenameSelectedBuild, onDeleteSelectedBuild,
    onExportSavedBuilds, onImportSavedBuildsFile } = props;
  const [action, setAction] = useState<"list" | "rename" | "delete">("list");
  const importInputRef = useRef<HTMLInputElement>(null);
  const selectedBuild = savedBuilds.find(build => build.id === selectedSavedBuildId);
  const choice = selectedBuild?.state.optimizedRouteChoice;
  const routeDetails = choice ? `Saved optimized route: route ${choice.routeNumber} of ${choice.routeCount}, ${choice.pointCost} ${choice.pointCost === 1 ? "point" : "points"}, ${choice.pointDeltaFromBest > 0 ? `+${choice.pointDeltaFromBest} vs best` : "matches best"}.` : undefined;

  return <div className="header-control-group saved-build-control" role="group" aria-label="Build management">
    <label className="saved-build-select-control">Build
      <ControlTooltip id="saved-build-tooltip" text={<>Load a saved build stored in this browser.{routeDetails ? <p>{routeDetails}</p> : null}</>}>
        <select aria-label="Saved build" aria-describedby="saved-build-tooltip" value={selectedSavedBuildId}
          onChange={event => onLoadSavedBuild(event.currentTarget.value)}>
          <option value="">Unsaved build</option>
          {savedBuilds.map(build => <option key={build.id} value={build.id}>{build.name}</option>)}
        </select>
      </ControlTooltip>
    </label>
    <ControlTooltip id="new-build-tooltip" text="Start a new unsaved build without deleting saved builds.">
      <button className="tool-button saved-build-button" type="button" aria-label="New build" aria-describedby="new-build-tooltip" onClick={() => onNewUnsavedBuild()}>
        <FilePlus2 size={14} aria-hidden="true" />New
      </button>
    </ControlTooltip>
    <ControlTooltip id="save-build-tooltip" text="Save the current build, path, goals, and settings. New builds ask for a name.">
      <ControlPopover label="Save build" trigger={<><Save size={14} aria-hidden="true" />Save</>}
        onAction={selectedBuild ? () => onSaveCurrentBuild() : undefined}
        triggerClassName="tool-button saved-build-button" describedBy="save-build-tooltip">
        {close => <BuildNameForm initialName={savedBuildName} submitLabel="Save" onCancel={close}
          onSubmit={name => { onSaveCurrentBuild(name); close(); }} />}
      </ControlPopover>
    </ControlTooltip>
    <ControlTooltip id="build-actions-tooltip" text="Rename or delete this build, or import and export saved-build backups.">
      <ControlPopover label="Build actions" trigger={<MoreHorizontal size={17} aria-hidden="true" />}
        triggerClassName="tool-button header-icon-button" describedBy="build-actions-tooltip" onOpenChange={() => setAction("list")}>
        {close => action === "rename" ? <BuildNameForm initialName={selectedBuild?.name ?? ""} submitLabel="Rename" onCancel={close}
          onSubmit={name => { onRenameSelectedBuild(name); close(); }} />
          : action === "delete" ? <div className="build-delete-confirmation">
            <p>Delete <strong>{selectedBuild?.name}</strong> from this browser?</p>
            <div className="popover-form-actions">
              <button type="button" className="tool-button" onClick={close}>Cancel</button>
              <button type="button" className="tool-button danger-button" aria-label="Confirm delete build" onClick={() => { onDeleteSelectedBuild(); close(); }}>Delete</button>
            </div>
          </div> : <div className="build-action-list">
            <button type="button" className="popover-action" aria-label="Rename build" disabled={!selectedBuild} onClick={() => setAction("rename")}><Pencil size={15} aria-hidden="true" />Rename build</button>
            <button type="button" className="popover-action danger-action" aria-label="Delete build" disabled={!canDeleteSelectedBuild} onClick={() => setAction("delete")}><Trash2 size={15} aria-hidden="true" />Delete build</button>
            <hr />
            <button type="button" className="popover-action" aria-label="Export builds" disabled={!canExportSavedBuilds} onClick={() => { onExportSavedBuilds(); close(); }}><Download size={15} aria-hidden="true" />Export all builds</button>
            <button type="button" className="popover-action" aria-label="Import builds" onClick={() => { importInputRef.current?.click(); close(); }}><Upload size={15} aria-hidden="true" />Import builds</button>
          </div>}
      </ControlPopover>
    </ControlTooltip>
    <input ref={importInputRef} hidden tabIndex={-1} className="saved-build-import-input" type="file" aria-label="Import builds file" accept="application/json,.json"
      onChange={event => { const file = event.currentTarget.files?.[0]; if (file) onImportSavedBuildsFile(file); event.currentTarget.value = ""; }} />
  </div>;
}

function BuildNameForm({ initialName, submitLabel, onSubmit, onCancel }: {
  initialName: string; submitLabel: string; onSubmit: (name: string) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  return <form className="build-name-form" onSubmit={event => { event.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}>
    <label>Build name<input autoFocus aria-label="Build name" value={name} onChange={event => setName(event.currentTarget.value)}
      onFocus={event => event.currentTarget.select()} placeholder="Build name" autoComplete="off" /></label>
    <div className="popover-form-actions">
      <button type="button" className="tool-button" onClick={onCancel}>Cancel</button>
      <button type="submit" className="tool-button" disabled={!name.trim()}>{submitLabel}</button>
    </div>
  </form>;
}
