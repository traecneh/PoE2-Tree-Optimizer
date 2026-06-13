import type { TreeGraph } from "../tree/types";
import type { TreeInteractionNotice } from "../app/useTreeInteractionState";
import type { AllocationMode } from "../app/weaponSetAllocation";
import { TreeViewer, type DebugOverlayState } from "./TreeViewer";

type TreeViewerPanelLoadStatus = "loading" | "loaded" | "fallback";

type TreeViewerPanelProps = {
  graph: TreeGraph;
  graphLoadStatus: TreeViewerPanelLoadStatus;
  selectedNodeId: string | undefined;
  pathStartNodeId: string | undefined;
  pathStartClassName: string | undefined;
  activeAscendancyId: string | undefined;
  noAllocationPathNodeId: string | undefined;
  nodeVisualScale: number;
  searchMatchNodeIds: ReadonlySet<string>;
  searchFocusedNodeId: string | undefined;
  buildGoalNodeIds: ReadonlySet<string>;
  activeAllocationMode: AllocationMode;
  weaponSet1NodeIds: ReadonlySet<string>;
  weaponSet2NodeIds: ReadonlySet<string>;
  weaponSet1EdgeKeys: ReadonlySet<string>;
  weaponSet2EdgeKeys: ReadonlySet<string>;
  allocatedNodeIds: ReadonlySet<string>;
  allocatedEdgeKeys: ReadonlySet<string>;
  allocationPathNodeIds: ReadonlySet<string>;
  allocationPathEdgeKeys: ReadonlySet<string>;
  hoverAllocationPathNodeIds: ReadonlySet<string>;
  hoverAllocationPathEdgeKeys: ReadonlySet<string>;
  treeInteractionNotice?: TreeInteractionNotice;
  onSelectNode: (nodeId: string) => void;
  onAddBuildGoal: (nodeId: string) => void;
  onHoverNode: (nodeId: string | undefined) => void;
};

const debugOverlayOff: DebugOverlayState = {
  showNodeIds: false,
  highlightMissingStats: false,
  highlightOrphans: false,
  showEdgeRoutes: false,
  showEdgeRouteLabels: false,
};

export function TreeViewerPanel({
  graph,
  graphLoadStatus,
  selectedNodeId,
  pathStartNodeId,
  pathStartClassName,
  activeAscendancyId,
  noAllocationPathNodeId,
  nodeVisualScale,
  searchMatchNodeIds,
  searchFocusedNodeId,
  buildGoalNodeIds,
  activeAllocationMode,
  weaponSet1NodeIds,
  weaponSet2NodeIds,
  weaponSet1EdgeKeys,
  weaponSet2EdgeKeys,
  allocatedNodeIds,
  allocatedEdgeKeys,
  allocationPathNodeIds,
  allocationPathEdgeKeys,
  hoverAllocationPathNodeIds,
  hoverAllocationPathEdgeKeys,
  treeInteractionNotice,
  onSelectNode,
  onAddBuildGoal,
  onHoverNode,
}: TreeViewerPanelProps) {
  const loading = graphLoadStatus === "loading";

  return (
    <section
      className={`tree-viewer-shell${loading ? " tree-viewer-shell-loading" : ""}`}
      role="region"
      aria-label="Passive tree viewer"
      aria-busy={loading}
    >
      {loading ? (
        <div className="tree-loading-state">
          Loading passive tree...
        </div>
      ) : null}
      {treeInteractionNotice ? (
        <div
          className={`tree-interaction-notice tree-interaction-notice-${treeInteractionNotice.tone}`}
          role="status"
          aria-live="polite"
        >
          {treeInteractionNotice.message}
        </div>
      ) : null}
      <TreeViewer
        graph={graph}
        selectedNodeId={selectedNodeId}
        pathStartNodeId={pathStartNodeId}
        pathStartClassName={pathStartClassName}
        activeAscendancyId={activeAscendancyId}
        noAllocationPathNodeId={noAllocationPathNodeId}
        nodeVisualScale={nodeVisualScale}
        searchMatchNodeIds={searchMatchNodeIds}
        searchFocusedNodeId={searchFocusedNodeId}
        buildGoalNodeIds={buildGoalNodeIds}
        activeAllocationMode={activeAllocationMode}
        weaponSet1NodeIds={weaponSet1NodeIds}
        weaponSet2NodeIds={weaponSet2NodeIds}
        weaponSet1EdgeKeys={weaponSet1EdgeKeys}
        weaponSet2EdgeKeys={weaponSet2EdgeKeys}
        allocatedNodeIds={allocatedNodeIds}
        allocatedEdgeKeys={allocatedEdgeKeys}
        allocationPathNodeIds={allocationPathNodeIds}
        allocationPathEdgeKeys={allocationPathEdgeKeys}
        hoverAllocationPathNodeIds={hoverAllocationPathNodeIds}
        hoverAllocationPathEdgeKeys={hoverAllocationPathEdgeKeys}
        onSelectNode={onSelectNode}
        onAddBuildGoal={onAddBuildGoal}
        onHoverNode={onHoverNode}
        debug={debugOverlayOff}
      />
    </section>
  );
}
