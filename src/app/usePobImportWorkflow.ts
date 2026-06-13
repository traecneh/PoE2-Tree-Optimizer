import { useCallback, type Dispatch, type SetStateAction } from "react";
import { resolveClassStartOptionFromPobMetadata, type ClassStartOption } from "../tree/classStartAliases";
import { importBuildGoalsFromPobCode } from "../tree/pobBuildImport";
import type { TreeGraph } from "../tree/types";
import type { PobBuildImportStatus } from "../viewer/BuildGoalsPanel";
import { mergeNodeIds } from "./allocationPlan";
import { sanitizeAscendancyAllocationNodeIds } from "./ascendancyAllocation";
import { buildPobImportReportDetails, pobPathStartStatus } from "./pobImportStatus";
import {
  sanitizeWeaponSetAllocations,
  type WeaponSetAllocationNodeIds,
} from "./weaponSetAllocation";

type UsePobImportWorkflowOptions = {
  graph: TreeGraph;
  classStartOptions: ClassStartOption[];
  selectedClassStartOption: ClassStartOption | undefined;
  buildGoalNodeIds: string[];
  setBuildGoalNodeIds: Dispatch<SetStateAction<string[]>>;
  pobImportCode: string;
  setAscendancyAllocationNodeIds: Dispatch<SetStateAction<string[]>>;
  setWeaponSetAllocationNodeIds: Dispatch<SetStateAction<WeaponSetAllocationNodeIds>>;
  setPobImportStatus: Dispatch<SetStateAction<PobBuildImportStatus>>;
  applyClassStartOption: (option: ClassStartOption) => void;
  clearOptimizedRouteState: () => void;
};

export function usePobImportWorkflow({
  graph,
  classStartOptions,
  selectedClassStartOption,
  buildGoalNodeIds,
  setBuildGoalNodeIds,
  pobImportCode,
  setAscendancyAllocationNodeIds,
  setWeaponSetAllocationNodeIds,
  setPobImportStatus,
  applyClassStartOption,
  clearOptimizedRouteState,
}: UsePobImportWorkflowOptions) {
  const importPobBuildGoals = useCallback(() => {
    if (pobImportCode.trim().length === 0) return;

    try {
      const result = importBuildGoalsFromPobCode(pobImportCode, graph);
      const currentGoalNodeIds = new Set(buildGoalNodeIds);
      const importedGoalNodeIds = result.goalNodeIds.filter((nodeId) => !currentGoalNodeIds.has(nodeId));
      const pathStartResolution = resolveClassStartOptionFromPobMetadata(classStartOptions, {
        className: result.className,
        ascendClassName: result.ascendClassName,
        allocatedNodeIds: result.allocatedNodeIds,
      });
      const nextClassStartOption = pathStartResolution.kind === "matched" ? pathStartResolution.option : selectedClassStartOption;
      const importedAscendancyNodeIds = sanitizeAscendancyAllocationNodeIds(
        result.ascendancyNodeIds,
        graph,
        nextClassStartOption?.ascendancy,
      );
      const importedWeaponSetAllocationNodeIds = sanitizeWeaponSetAllocations({
        1: result.weaponSet1NodeIds,
        2: result.weaponSet2NodeIds,
      }, graph);

      clearOptimizedRouteState();
      if (pathStartResolution.kind === "matched") {
        applyClassStartOption(pathStartResolution.option);
      }
      setAscendancyAllocationNodeIds(importedAscendancyNodeIds);
      setWeaponSetAllocationNodeIds(importedWeaponSetAllocationNodeIds);
      setBuildGoalNodeIds((current) => mergeNodeIds(current, importedGoalNodeIds));
      setPobImportStatus({
        kind: "success",
        importedGoalCount: importedGoalNodeIds.length,
        pobBasePassivePointCount: result.pobBasePassivePointCount,
        selectedAscendancyNodeCount: importedAscendancyNodeIds.length,
        selectedWeaponSet1NodeCount: importedWeaponSetAllocationNodeIds[1].length,
        selectedWeaponSet2NodeCount: importedWeaponSetAllocationNodeIds[2].length,
        alreadySelectedGoalCount: result.goalNodeIds.length - importedGoalNodeIds.length,
        missingNodeCount: result.missingNodeIds.length,
        pathStart: pobPathStartStatus(pathStartResolution),
        details: buildPobImportReportDetails(result, {
          graph,
          importedGoalNodeIds,
          alreadySelectedGoalNodeIds: result.goalNodeIds.filter((nodeId) => currentGoalNodeIds.has(nodeId)),
          selectedAscendancyNodeIds: importedAscendancyNodeIds,
        }),
      });
    } catch (error) {
      clearOptimizedRouteState();
      setPobImportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not import PoB build code.",
      });
    }
  }, [
    applyClassStartOption,
    buildGoalNodeIds,
    classStartOptions,
    clearOptimizedRouteState,
    graph,
    pobImportCode,
    selectedClassStartOption,
    setAscendancyAllocationNodeIds,
    setBuildGoalNodeIds,
    setPobImportStatus,
    setWeaponSetAllocationNodeIds,
  ]);

  return { importPobBuildGoals };
}
