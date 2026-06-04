import type { AllocationPath } from "../tree/pathAllocation";
import type { TreeEdge, TreeNode } from "../tree/types";
import {
  BuildGoalsPanel,
  type BuildGoalsPanelGoal,
  type BuildGoalsPanelStatus,
  type BuildGoalsRouteCandidateSummary,
  type PobBuildImportStatus,
} from "./BuildGoalsPanel";
import { NodeInspector } from "./NodeInspector";
import { PassiveSearchPanel, type PassiveSearchPanelResult } from "./PassiveSearchPanel";

type SidePanelProps = {
  searchQuery: string;
  searchResults: PassiveSearchPanelResult[];
  selectedNodeId: string | undefined;
  buildGoalNodeIds: ReadonlySet<string>;
  onSearchQueryChange: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
  onHoverSearchNode: (nodeId: string | undefined) => void;
  canAddSearchBuildGoal: (node: TreeNode) => boolean;
  onAddBuildGoal: (nodeId: string) => void;
  canAddMatchingBuildGoal: (node: TreeNode) => boolean;
  onAddMatchingBuildGoals: (nodeIds: string[]) => void;
  buildGoals: BuildGoalsPanelGoal[];
  buildGoalStatus: BuildGoalsPanelStatus;
  pobImportCode: string;
  pobImportStatus: PobBuildImportStatus;
  canApplyOptimizedRoute: boolean;
  routeCandidateSummaries: BuildGoalsRouteCandidateSummary[];
  selectedRouteIndex: number;
  onPobImportCodeChange: (code: string) => void;
  onImportPobBuildGoals: () => void;
  onRemoveGoal: (nodeId: string) => void;
  onClearGoals: () => void;
  onOptimize: () => void;
  onCancel: () => void;
  onApplyOptimizedRoute: () => void;
  onSelectOptimizedRoute: (routeIndex: number) => void;
  selectedNode: TreeNode | undefined;
  visibleEdges: TreeEdge[];
  allocationPath: AllocationPath | undefined;
  allocationPathNodeNames: string[];
  pathStartName: string | undefined;
  canAllocatePath: boolean;
  onAllocatePath: () => void;
  canAddSelectedBuildGoal: boolean;
  isSelectedNodeBuildGoal: boolean;
};

export function SidePanel({
  searchQuery,
  searchResults,
  selectedNodeId,
  buildGoalNodeIds,
  onSearchQueryChange,
  onSelectNode,
  onHoverSearchNode,
  canAddSearchBuildGoal,
  onAddBuildGoal,
  canAddMatchingBuildGoal,
  onAddMatchingBuildGoals,
  buildGoals,
  buildGoalStatus,
  pobImportCode,
  pobImportStatus,
  canApplyOptimizedRoute,
  routeCandidateSummaries,
  selectedRouteIndex,
  onPobImportCodeChange,
  onImportPobBuildGoals,
  onRemoveGoal,
  onClearGoals,
  onOptimize,
  onCancel,
  onApplyOptimizedRoute,
  onSelectOptimizedRoute,
  selectedNode,
  visibleEdges,
  allocationPath,
  allocationPathNodeNames,
  pathStartName,
  canAllocatePath,
  onAllocatePath,
  canAddSelectedBuildGoal,
  isSelectedNodeBuildGoal,
}: SidePanelProps) {
  return (
    <div className="side-panel">
      <PassiveSearchPanel
        query={searchQuery}
        results={searchResults}
        selectedNodeId={selectedNodeId}
        buildGoalNodeIds={buildGoalNodeIds}
        onQueryChange={onSearchQueryChange}
        onSelectNode={onSelectNode}
        onHoverNode={onHoverSearchNode}
        canAddBuildGoal={canAddSearchBuildGoal}
        onAddBuildGoal={onAddBuildGoal}
        canAddMatchingBuildGoal={canAddMatchingBuildGoal}
        onAddMatchingBuildGoals={onAddMatchingBuildGoals}
      />
      <BuildGoalsPanel
        goals={buildGoals}
        status={buildGoalStatus}
        pobImportCode={pobImportCode}
        pobImportStatus={pobImportStatus}
        canApplyOptimizedRoute={canApplyOptimizedRoute}
        routeCandidateSummaries={routeCandidateSummaries}
        selectedRouteIndex={selectedRouteIndex}
        onPobImportCodeChange={onPobImportCodeChange}
        onImportPobBuildGoals={onImportPobBuildGoals}
        onRemoveGoal={onRemoveGoal}
        onClearGoals={onClearGoals}
        onOptimize={onOptimize}
        onCancel={onCancel}
        onApplyOptimizedRoute={onApplyOptimizedRoute}
        onPreviousRoute={() => onSelectOptimizedRoute(selectedRouteIndex - 1)}
        onNextRoute={() => onSelectOptimizedRoute(selectedRouteIndex + 1)}
        onSelectRouteCandidate={onSelectOptimizedRoute}
      />
      <NodeInspector
        node={selectedNode}
        edges={visibleEdges}
        allocationPath={allocationPath}
        allocationPathNodeNames={allocationPathNodeNames}
        pathStartName={pathStartName}
        canAllocatePath={canAllocatePath}
        onAllocatePath={onAllocatePath}
        canAddBuildGoal={canAddSelectedBuildGoal}
        isBuildGoal={isSelectedNodeBuildGoal}
        onAddBuildGoal={selectedNode ? () => onAddBuildGoal(selectedNode.id) : undefined}
      />
    </div>
  );
}
