import { Settings2 } from "lucide-react";
import { ControlPopover } from "./ControlPopover";
import { ControlTooltip } from "./ControlTooltip";

type Props = {
  nodeVisualScale: number;
  nodeVisualScaleOptions: readonly number[];
  hoverPathPreviewEnabled: boolean;
  onNodeVisualScaleChange: (scale: number) => void;
  onToggleHoverPathPreview: (enabled: boolean) => void;
};

export function ViewSettings({ nodeVisualScale, nodeVisualScaleOptions, hoverPathPreviewEnabled, onNodeVisualScaleChange, onToggleHoverPathPreview }: Props) {
  return <ControlTooltip id="view-settings-tooltip" text="View settings: node size and hover path preview.">
    <ControlPopover label="View settings" trigger={<Settings2 size={18} aria-hidden="true" />}
      triggerClassName="tool-button viewport-button" describedBy="view-settings-tooltip">
      {() => <div className="view-settings-fields">
        <label className="node-size-control">Node size
          <ControlTooltip id="node-size-tooltip" text="Scale passive node icons in the tree viewer.">
            <select aria-label="Node size" aria-describedby="node-size-tooltip" value={nodeVisualScale} onChange={event => onNodeVisualScaleChange(Number(event.currentTarget.value))}>
              {nodeVisualScaleOptions.map(scale => <option key={scale} value={scale}>{scale}x</option>)}
            </select>
          </ControlTooltip>
        </label>
        <label className="hover-preview-control">
          <ControlTooltip id="hover-preview-tooltip" text="Show a temporary path preview while hovering unallocated nodes.">
            <input type="checkbox" aria-label="Hover path preview" aria-describedby="hover-preview-tooltip" checked={hoverPathPreviewEnabled} onChange={event => onToggleHoverPathPreview(event.currentTarget.checked)} />
          </ControlTooltip>Hover path preview
        </label>
      </div>}
    </ControlPopover>
  </ControlTooltip>;
}
