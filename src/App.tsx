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
import {
  emptyWeaponSetAllocations,
  type AllocationMode,
  type WeaponSetAllocationNodeIds,
} from "./app/weaponSetAllocation";
import { filterVisibleTreeGraph } from "./tree/treeVisibility";
import { BuildSummaryPanel } from "./viewer/BuildSummaryPanel";
import { AppHeader } from "./viewer/AppHeader";
import { SidePanel } from "./viewer/SidePanel";
import { TreeViewerPanel } from "./viewer/TreeViewerPanel";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;
const defaultNodeVisualScale = 3;
const treeDataVersionLabel = "PoE2 0.5.0";

export default function App() {
  const { allocationPlan, setAllocationPlan, resetAllocationPlan } = useAllocationPlanState();
  const [activeAllocationMode, setActiveAllocationMode] = useState<AllocationMode>("main");
  const [weaponSetAllocationNodeIds, setWeaponSetAllocationNodeIds] = useState<WeaponSetAllocationNodeIds>(
    () => emptyWeaponSetAllocations(),
  );
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
    canExportSavedBuilds,
    saveCurrentBuild,
    loadSavedBuild: selectSavedBuild,
    newUnsavedBuild: markNewUnsavedBuild,
    deleteSelectedBuild: deleteSelectedSavedBuild,
    exportSavedBuildsJson,
    importSavedBuildsJson,
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
    routeCandidateSummaries,
    selectedRouteDetails,
    appliedOptimizedRouteChoice,
    setAppliedOptimizedRouteChoice,
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
    mainPassivePointCount,
    weaponSet1PointCount,
    weaponSet2PointCount,
    weaponSet1EdgeKeys,
    weaponSet2EdgeKeys,
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
    activeAllocationMode,
    weaponSetAllocationNodeIds,
  });
  const weaponSet1NodeIdSet = useMemo(
    () => new Set(weaponSetAllocationNodeIds[1]),
    [weaponSetAllocationNodeIds],
  );
  const weaponSet2NodeIdSet = useMemo(
    () => new Set(weaponSetAllocationNodeIds[2]),
    [weaponSetAllocationNodeIds],
  );
  const weaponSet1EdgeKeySet = useMemo(
    () => new Set(weaponSet1EdgeKeys),
    [weaponSet1EdgeKeys],
  );
  const weaponSet2EdgeKeySet = useMemo(
    () => new Set(weaponSet2EdgeKeys),
    [weaponSet2EdgeKeys],
  );
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
    treeInteractionNotice,
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
    activeAllocationMode,
    weaponSetAllocationNodeIds,
    setWeaponSetAllocationNodeIds,
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
    setActiveAllocationMode,
    weaponSetAllocationNodeIds,
    setWeaponSetAllocationNodeIds,
    buildGoalNodeIds,
    buildGoalNodeIdSet,
    setBuildGoalNodeIds,
    setAppliedOptimizedRouteChoice,
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
      activeAllocationMode,
      weaponSetAllocationNodeIds,
      optimizedRouteChoice: appliedOptimizedRouteChoice,
    });
  }

  function exportSavedBuildsFile() {
    const savedBuildsJson = exportSavedBuildsJson();
    if (!savedBuildsJson) return;
    downloadTextFile("poe2-tree-optimizer-builds.json", savedBuildsJson, "application/json");
  }

  async function importSavedBuildsFile(file: File) {
    try {
      importSavedBuildsJson(await file.text());
    } catch {
      importSavedBuildsJson("");
    }
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
        canExportSavedBuilds={canExportSavedBuilds}
        classStartOptions={classStartOptions}
        selectedClassStartId={selectedClassStartId}
        nodeVisualScale={nodeVisualScale}
        nodeVisualScaleOptions={nodeVisualScaleOptions}
        activeAllocationMode={activeAllocationMode}
        hoverPathPreviewEnabled={hoverPathPreviewEnabled}
        allocatedPointCount={allocatedPointCount}
        mainPassivePointCount={mainPassivePointCount}
        weaponSet1PointCount={weaponSet1PointCount}
        weaponSet2PointCount={weaponSet2PointCount}
        activeAscendancyPointCount={activeAscendancyPointCount}
        hasSelectedAscendancy={Boolean(selectedAscendancy)}
        canResetAllocation={canResetAllocation}
        onLoadSavedBuild={loadSavedBuild}
        onSavedBuildNameChange={setSavedBuildName}
        onNewUnsavedBuild={newUnsavedBuild}
        onSaveCurrentBuild={saveCurrentBuild}
        onDeleteSelectedBuild={deleteSelectedBuild}
        onExportSavedBuilds={exportSavedBuildsFile}
        onImportSavedBuildsFile={importSavedBuildsFile}
        onChangeSelectedClassStart={changeSelectedClassStart}
        onNodeVisualScaleChange={setNodeVisualScale}
        onChangeActiveAllocationMode={setActiveAllocationMode}
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
        <TreeViewerPanel
          graph={visibleGraph}
          graphLoadStatus={graphLoadStatus}
          selectedNodeId={selectedNodeId}
          pathStartNodeId={pathStartNodeId}
          pathStartClassName={selectedClassStartOption?.className}
          activeAscendancyId={selectedAscendancy?.id}
          noAllocationPathNodeId={noAllocationPathNodeId}
          nodeVisualScale={nodeVisualScale}
          searchMatchNodeIds={searchMatchNodeIds}
          searchFocusedNodeId={searchFocusedNodeId}
          buildGoalNodeIds={buildGoalNodeIdSet}
          activeAllocationMode={activeAllocationMode}
          weaponSet1NodeIds={weaponSet1NodeIdSet}
          weaponSet2NodeIds={weaponSet2NodeIdSet}
          weaponSet1EdgeKeys={weaponSet1EdgeKeySet}
          weaponSet2EdgeKeys={weaponSet2EdgeKeySet}
          allocatedNodeIds={displayAllocatedNodeIds}
          allocatedEdgeKeys={displayAllocatedEdgeKeys}
          allocationPathNodeIds={allocationPathNodeIds}
          allocationPathEdgeKeys={allocationPathEdgeKeys}
          hoverAllocationPathNodeIds={hoverAllocationPathNodeIds}
          hoverAllocationPathEdgeKeys={hoverAllocationPathEdgeKeys}
          treeInteractionNotice={treeInteractionNotice}
          onSelectNode={selectTreeNode}
          onAddBuildGoal={toggleMapBuildGoal}
          onHoverNode={updateHoverPreviewTarget}
        />
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
          routeCandidateSummaries={routeCandidateSummaries}
          selectedRouteDetails={selectedRouteDetails}
          appliedOptimizedRouteChoice={appliedOptimizedRouteChoice}
          selectedRouteIndex={optimizedRouteIndex}
          activeAllocationMode={activeAllocationMode}
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

function downloadTextFile(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
