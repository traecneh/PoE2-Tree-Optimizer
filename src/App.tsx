import { useMemo, useState } from "react";
import {
  maxAscendancyAllocationCount,
} from "./app/ascendancyAllocation";
import {
  canAddBuildGoal,
  createSavedBuildState,
  isBuildGoalableNode,
} from "./app/buildWorkflow";
import { useAscendancyAllocationState } from "./app/useAscendancyAllocationState";
import { useAllocationDisplayViewModel } from "./app/useAllocationDisplayViewModel";
import { useAllocationPlanState } from "./app/useAllocationPlanState";
import { useBuildGoalsState } from "./app/useBuildGoalsState";
import { useBuildWorkflowActions } from "./app/useBuildWorkflowActions";
import { useGraphPathStartState } from "./app/useGraphPathStartState";
import { usePassiveGoalViewModel } from "./app/usePassiveGoalViewModel";
import { usePobImportState } from "./app/usePobImportState";
import { useSavedBuildState } from "./app/useSavedBuildState";
import { useTreeInteractionState } from "./app/useTreeInteractionState";
import { useTreeStateCleanupEffects } from "./app/useTreeStateCleanupEffects";
import { filterVisibleTreeGraph } from "./tree/treeVisibility";
import { BuildGoalsPanel } from "./viewer/BuildGoalsPanel";
import { BuildSummaryPanel } from "./viewer/BuildSummaryPanel";
import { ControlTooltip } from "./viewer/ControlTooltip";
import { NodeInspector } from "./viewer/NodeInspector";
import { PassiveSearchPanel } from "./viewer/PassiveSearchPanel";
import { TreeViewer, type DebugOverlayState } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;
const defaultNodeVisualScale = 3;
const maxPassiveAllocationPointCount = 123;
const treeDataVersionLabel = "PoE2 0.5.0";
const debugOverlayOff: DebugOverlayState = {
  showNodeIds: false,
  highlightMissingStats: false,
  highlightOrphans: false,
  showEdgeRoutes: false,
  showEdgeRouteLabels: false,
};

export default function App() {
  const { allocationPlan, setAllocationPlan, resetAllocationPlan } = useAllocationPlanState();
  const [nodeVisualScale, setNodeVisualScale] = useState<number>(defaultNodeVisualScale);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>();
  const {
    pobImportCode,
    setPobImportCode,
    pobImportStatus,
    setPobImportStatus,
    clearPobImport,
    clearPobImportStatus,
  } = usePobImportState();
  const {
    graph,
    graphLoadStatus,
    classStartOptions,
    selectedClassStartId,
    setSelectedClassStartId,
    selectedClassStartOption,
    selectedAscendancy,
    pathStartNodeId,
    setPathStartNodeId,
  } = useGraphPathStartState();
  const {
    setAscendancyAllocationNodeIds,
    activeAscendancyAllocationNodeIds,
    activeAscendancyPointCostByNodeId,
    activeAscendancyPointCount,
    activeAscendancyAllocationEdgeKeys,
    resetAscendancyAllocation,
    toggleAscendancyAllocationNode,
  } = useAscendancyAllocationState(graph, selectedAscendancy);
  const {
    savedBuilds,
    selectedSavedBuild,
    selectedSavedBuildId,
    savedBuildName,
    setSavedBuildName,
    savedBuildStatus,
    savedBuildStatusFeedbackKey,
    canSaveCurrentBuild,
    saveCurrentBuild,
    loadSavedBuild: selectSavedBuild,
    newUnsavedBuild: markNewUnsavedBuild,
    deleteSelectedBuild: deleteSelectedSavedBuild,
  } = useSavedBuildState({ getCurrentState: currentSavedBuildState });
  const visibleGraph = useMemo(
    () => filterVisibleTreeGraph(graph, {
      selectedAscendancyId: selectedAscendancy?.id,
      allocatedAscendancyNodeIds: activeAscendancyAllocationNodeIds,
    }),
    [activeAscendancyAllocationNodeIds, graph, selectedAscendancy?.id],
  );
  const {
    buildGoalNodeIds,
    setBuildGoalNodeIds,
    buildGoalNodeIdSet,
    buildGoalStatus,
    optimizedRouteIndex,
    routeCandidateCount,
    canApplyOptimizedRoute,
    clearOptimizedRouteState,
    addBuildGoal: addBuildGoalNodeId,
    addBuildGoals: addBuildGoalNodeIds,
    removeBuildGoal: removeBuildGoalNodeId,
    clearBuildGoals: clearBuildGoalNodeIds,
    optimizeBuildGoalsRoute,
    cancelBuildGoalsOptimization,
    selectOptimizedRoute,
    applyOptimizedRoute,
  } = useBuildGoalsState({
    visibleGraph,
    allocationPlan,
    setAllocationPlan,
  });
  const {
    allocatedNodePath,
    allocatedPointCount,
    displayAllocatedNodeIds,
    displayAllocatedEdgeKeys,
    allocationDistanceNodeIds,
    currentAllocationEdgeKeys,
    buildSummaryData,
  } = useAllocationDisplayViewModel({
    visibleGraph,
    allocationPlan,
    activeAscendancyAllocationNodeIds,
    activeAscendancyAllocationEdgeKeys,
    activeAscendancyPointCostByNodeId,
  });
  const {
    selectedNodeId,
    selectedNode,
    currentPathEndpointNodeId,
    hoverPathPreviewEnabled,
    allocationPath,
    allocationPathNodeNames,
    allocationPathNodeIds,
    allocationPathEdgeKeys,
    hoverAllocationPathNodeIds,
    hoverAllocationPathEdgeKeys,
    noAllocationPathNodeId,
    clearTreeInteractionState,
    updateHoverPreviewTarget,
    toggleHoverPathPreview,
    selectTreeNode,
    allocatePreviewPath,
  } = useTreeInteractionState({
    visibleGraph,
    allocationPlan,
    setAllocationPlan,
    pathStartNodeId,
    allocationDistanceNodeIds,
    currentAllocationEdgeKeys,
    clearOptimizedRouteState,
    toggleAscendancyAllocationNode,
  });
  const {
    buildGoalPanelGoals,
    searchResultsWithAllocationDistance,
    searchMatchNodeIds,
  } = usePassiveGoalViewModel({
    visibleGraph,
    searchQuery,
    buildGoalNodeIds,
    allocationDistanceNodeIds,
    displayAllocatedNodeIds,
  });
  const {
    canResetAllocation,
    resetAllocation,
    updateSearchQuery,
    changeSelectedClassStart,
    loadSavedBuild,
    newUnsavedBuild,
    deleteSelectedBuild,
    addBuildGoal,
    addMatchingBuildGoals,
    toggleMapBuildGoal,
    removeBuildGoal,
    clearBuildGoals,
    importPobBuildGoals,
  } = useBuildWorkflowActions({
    graph,
    visibleGraph,
    classStartOptions,
    selectedClassStartOption,
    setSelectedClassStartId,
    pathStartNodeId,
    setPathStartNodeId,
    allocationPlan,
    setAllocationPlan,
    resetAllocationPlan,
    nodeVisualScaleOptions,
    defaultNodeVisualScale,
    setNodeVisualScale,
    buildGoalNodeIds,
    buildGoalNodeIdSet,
    setBuildGoalNodeIds,
    addBuildGoalNodeId,
    addBuildGoalNodeIds,
    removeBuildGoalNodeId,
    clearBuildGoalNodeIds,
    activeAscendancyAllocationNodeIds,
    setAscendancyAllocationNodeIds,
    resetAscendancyAllocation,
    clearOptimizedRouteState,
    pobImportCode,
    setPobImportStatus,
    clearPobImport,
    clearPobImportStatus,
    selectSavedBuild,
    markNewUnsavedBuild,
    deleteSelectedSavedBuild,
    setSearchQuery,
    setSearchFocusedNodeId,
    clearTreeInteractionState,
  });

  function currentSavedBuildState() {
    return createSavedBuildState({
      selectedClassStartId,
      pathStartNodeId,
      allocationPlan,
      nodeVisualScale,
      buildGoalNodeIds,
      ascendancyAllocationNodeIds: activeAscendancyAllocationNodeIds,
    });
  }

  useTreeStateCleanupEffects({
    visibleGraph,
    pathStartNodeId,
    setAllocationPlan,
    clearOptimizedRouteState,
    setBuildGoalNodeIds,
    searchFocusedNodeId,
    setSearchFocusedNodeId,
  });

  return (
    <main className="app-shell">
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
                  onChange={(event) => loadSavedBuild(event.currentTarget.value)}
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
                  onChange={(event) => setSavedBuildName(event.currentTarget.value)}
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
                onClick={() => newUnsavedBuild()}
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
                onClick={saveCurrentBuild}
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
                onClick={deleteSelectedBuild}
                disabled={!selectedSavedBuild}
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
                  onChange={(event) => changeSelectedClassStart(event.currentTarget.value)}
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
                  onChange={(event) => setNodeVisualScale(Number(event.currentTarget.value))}
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
                  onChange={(event) => toggleHoverPathPreview(event.currentTarget.checked)}
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
                {selectedAscendancy ? formatAscendancyPointCount(activeAscendancyPointCount) : "\u00a0"}
              </span>
            </div>
            <ControlTooltip id="reset-allocation-tooltip" text="Clear committed allocation and the current preview path.">
              <button
                className="tool-button"
                type="button"
                aria-label="Reset allocation"
                aria-describedby="reset-allocation-tooltip"
                onClick={resetAllocation}
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
      {graphLoadStatus === "fallback" ? (
        <div className="data-warning" role="status">
          <strong>Real tree data is unavailable.</strong>
          <span>Using the sample fixture tree. Run npm run prepare-data before building or serving the full tool.</span>
        </div>
      ) : null}
      <section className="workspace">
        <BuildSummaryPanel summary={buildSummaryData} />
        <section
          className={`tree-viewer-shell${graphLoadStatus === "loading" ? " tree-viewer-shell-loading" : ""}`}
          role="region"
          aria-label="Passive tree viewer"
          aria-busy={graphLoadStatus === "loading"}
        >
          {graphLoadStatus === "loading" ? (
            <div className="tree-loading-state">
              Loading passive tree...
            </div>
          ) : null}
          <TreeViewer
            graph={visibleGraph}
            selectedNodeId={selectedNodeId}
            pathStartNodeId={pathStartNodeId}
            pathStartClassName={selectedClassStartOption?.className}
            activeAscendancyId={selectedAscendancy?.id}
            noAllocationPathNodeId={noAllocationPathNodeId}
            nodeVisualScale={nodeVisualScale}
            searchMatchNodeIds={searchMatchNodeIds}
            searchFocusedNodeId={searchFocusedNodeId}
            buildGoalNodeIds={buildGoalNodeIdSet}
            allocatedNodeIds={displayAllocatedNodeIds}
            allocatedEdgeKeys={displayAllocatedEdgeKeys}
            allocationPathNodeIds={allocationPathNodeIds}
            allocationPathEdgeKeys={allocationPathEdgeKeys}
            hoverAllocationPathNodeIds={hoverAllocationPathNodeIds}
            hoverAllocationPathEdgeKeys={hoverAllocationPathEdgeKeys}
            onSelectNode={selectTreeNode}
            onAddBuildGoal={toggleMapBuildGoal}
            onHoverNode={updateHoverPreviewTarget}
            debug={debugOverlayOff}
          />
        </section>
        <div className="side-panel">
          <PassiveSearchPanel
            query={searchQuery}
            results={searchResultsWithAllocationDistance}
            selectedNodeId={selectedNodeId}
            buildGoalNodeIds={buildGoalNodeIdSet}
            onQueryChange={updateSearchQuery}
            onSelectNode={selectTreeNode}
            onHoverNode={setSearchFocusedNodeId}
            canAddBuildGoal={isBuildGoalableNode}
            onAddBuildGoal={addBuildGoal}
            canAddMatchingBuildGoal={(node) => canAddBuildGoal(node, { allowAnyPassive: true })}
            onAddMatchingBuildGoals={addMatchingBuildGoals}
          />
          <BuildGoalsPanel
            goals={buildGoalPanelGoals}
            status={buildGoalStatus}
            pobImportCode={pobImportCode}
            pobImportStatus={pobImportStatus}
            canApplyOptimizedRoute={canApplyOptimizedRoute}
            routeCandidateCount={routeCandidateCount}
            selectedRouteIndex={optimizedRouteIndex}
            onPobImportCodeChange={setPobImportCode}
            onImportPobBuildGoals={importPobBuildGoals}
            onRemoveGoal={removeBuildGoal}
            onClearGoals={clearBuildGoals}
            onOptimize={optimizeBuildGoalsRoute}
            onCancel={cancelBuildGoalsOptimization}
            onApplyOptimizedRoute={applyOptimizedRoute}
            onPreviousRoute={() => selectOptimizedRoute(optimizedRouteIndex - 1)}
            onNextRoute={() => selectOptimizedRoute(optimizedRouteIndex + 1)}
          />
          <NodeInspector
            node={selectedNode}
            edges={visibleGraph.edges}
            allocationPath={allocationPath}
            allocationPathNodeNames={allocationPathNodeNames}
            pathStartName={currentPathEndpointNodeId ? visibleGraph.nodes[currentPathEndpointNodeId]?.name : undefined}
            canAllocatePath={allocationPlan.previewNodePath.length > 0 && (allocationPath?.pointCost ?? 0) > 0}
            onAllocatePath={allocatePreviewPath}
            canAddBuildGoal={selectedNode ? isBuildGoalableNode(selectedNode) : false}
            isBuildGoal={selectedNodeId ? buildGoalNodeIdSet.has(selectedNodeId) : false}
            onAddBuildGoal={selectedNodeId ? () => addBuildGoal(selectedNodeId) : undefined}
          />
        </div>
      </section>
    </main>
  );
}

function formatAllocatedPointCount(pointCount: number): string {
  return `Allocated ${pointCount}/${maxPassiveAllocationPointCount}`;
}

function formatAscendancyPointCount(pointCount: number): string {
  return `Ascendancy ${pointCount}/${maxAscendancyAllocationCount}`;
}
