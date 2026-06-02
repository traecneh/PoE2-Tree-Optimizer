import { useMemo, useState } from "react";
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
import { BuildSummaryPanel } from "./viewer/BuildSummaryPanel";
import { AppHeader } from "./viewer/AppHeader";
import { SidePanel } from "./viewer/SidePanel";
import { TreeViewer, type DebugOverlayState } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;
const defaultNodeVisualScale = 3;
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
      <AppHeader
        treeDataVersionLabel={treeDataVersionLabel}
        savedBuilds={savedBuilds}
        selectedSavedBuildId={selectedSavedBuildId}
        savedBuildName={savedBuildName}
        savedBuildStatus={savedBuildStatus}
        savedBuildStatusFeedbackKey={savedBuildStatusFeedbackKey}
        canSaveCurrentBuild={canSaveCurrentBuild}
        canDeleteSelectedBuild={Boolean(selectedSavedBuild)}
        classStartOptions={classStartOptions}
        selectedClassStartId={selectedClassStartId}
        nodeVisualScale={nodeVisualScale}
        nodeVisualScaleOptions={nodeVisualScaleOptions}
        hoverPathPreviewEnabled={hoverPathPreviewEnabled}
        allocatedPointCount={allocatedPointCount}
        activeAscendancyPointCount={activeAscendancyPointCount}
        hasSelectedAscendancy={Boolean(selectedAscendancy)}
        canResetAllocation={canResetAllocation}
        onLoadSavedBuild={loadSavedBuild}
        onSavedBuildNameChange={setSavedBuildName}
        onNewUnsavedBuild={newUnsavedBuild}
        onSaveCurrentBuild={saveCurrentBuild}
        onDeleteSelectedBuild={deleteSelectedBuild}
        onChangeSelectedClassStart={changeSelectedClassStart}
        onNodeVisualScaleChange={setNodeVisualScale}
        onToggleHoverPathPreview={toggleHoverPathPreview}
        onResetAllocation={resetAllocation}
      />
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
        <SidePanel
          searchQuery={searchQuery}
          searchResults={searchResultsWithAllocationDistance}
          selectedNodeId={selectedNodeId}
          buildGoalNodeIds={buildGoalNodeIdSet}
          onSearchQueryChange={updateSearchQuery}
          onSelectNode={selectTreeNode}
          onHoverSearchNode={setSearchFocusedNodeId}
          canAddSearchBuildGoal={isBuildGoalableNode}
          onAddBuildGoal={addBuildGoal}
          canAddMatchingBuildGoal={(node) => canAddBuildGoal(node, { allowAnyPassive: true })}
          onAddMatchingBuildGoals={addMatchingBuildGoals}
          buildGoals={buildGoalPanelGoals}
          buildGoalStatus={buildGoalStatus}
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
          onSelectOptimizedRoute={selectOptimizedRoute}
          selectedNode={selectedNode}
          visibleEdges={visibleGraph.edges}
          allocationPath={allocationPath}
          allocationPathNodeNames={allocationPathNodeNames}
          pathStartName={currentPathEndpointNodeId ? visibleGraph.nodes[currentPathEndpointNodeId]?.name : undefined}
          canAllocatePath={allocationPlan.previewNodePath.length > 0 && (allocationPath?.pointCost ?? 0) > 0}
          onAllocatePath={allocatePreviewPath}
          canAddSelectedBuildGoal={selectedNode ? isBuildGoalableNode(selectedNode) : false}
          isSelectedNodeBuildGoal={selectedNodeId ? buildGoalNodeIdSet.has(selectedNodeId) : false}
        />
      </section>
    </main>
  );
}
