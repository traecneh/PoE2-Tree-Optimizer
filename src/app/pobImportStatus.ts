import type { PobClassStartResolution } from "../tree/classStartAliases";
import type { PobBuildGoalImportResult } from "../tree/pobBuildImport";
import type { TreeGraph } from "../tree/types";
import type {
  PobBuildImportPathStartStatus,
  PobBuildImportReportDetails,
} from "../viewer/BuildGoalsPanel";

export function pobPathStartStatus(
  resolution: PobClassStartResolution,
): PobBuildImportPathStartStatus | undefined {
  if (resolution.kind === "matched") {
    return {
      kind: "matched",
      source: resolution.source,
      label: resolution.option.label,
    };
  }
  if (resolution.kind === "ambiguous") {
    return {
      kind: "ambiguous",
      labels: resolution.labels,
    };
  }
  if (resolution.kind === "not-found") {
    return {
      kind: "not-found",
      label: resolution.ascendClassName
        ? `${resolution.className ?? "PoB class"} - ${resolution.ascendClassName}`
        : resolution.className ?? "the PoB class",
    };
  }
  return undefined;
}

export function buildPobImportReportDetails(
  result: PobBuildGoalImportResult,
  state: {
    graph: TreeGraph;
    importedGoalNodeIds: string[];
    alreadySelectedGoalNodeIds: string[];
    selectedAscendancyNodeIds: string[];
  },
): PobBuildImportReportDetails {
  return {
    activeSpecTitle: result.activeSpecTitle,
    importedGoalNodes: state.importedGoalNodeIds.map((nodeId) => pobImportNodeReference(state.graph, nodeId)),
    alreadySelectedGoalNodes: state.alreadySelectedGoalNodeIds.map((nodeId) => pobImportNodeReference(state.graph, nodeId)),
    selectedAscendancyNodes: state.selectedAscendancyNodeIds.map((nodeId) => pobImportNodeReference(state.graph, nodeId)),
    missingNodeIds: result.missingNodeIds,
    weaponSetNodeIds: result.weaponSetNodeIds,
    ignoredNodes: result.ignoredNodeDetails.map((detail) => ({
      ...pobImportNodeReference(state.graph, detail.nodeId),
      reason: detail.reason,
    })),
  };
}

function pobImportNodeReference(graph: TreeGraph, nodeId: string): { nodeId: string; label?: string } {
  const label = graph.nodes[nodeId]?.name?.trim();
  return label ? { nodeId, label } : { nodeId };
}
