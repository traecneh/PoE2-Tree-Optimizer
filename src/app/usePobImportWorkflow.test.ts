import { deflateSync } from "node:zlib";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { TreeGraph } from "../tree/types";
import type { PobBuildImportStatus } from "../viewer/BuildGoalsPanel";
import { usePobImportWorkflow } from "./usePobImportWorkflow";

describe("usePobImportWorkflow", () => {
  it("imports goals, ascendancy allocations, path start, and status together", () => {
    const graph = fixtureGraph();
    const rangerOption: ClassStartOption = {
      id: "ranger",
      label: "Ranger",
      className: "Ranger",
      rootClassId: "RANGER",
      nodeId: "100",
    };
    const amazonOption: ClassStartOption = {
      ...rangerOption,
      id: "ranger:amazon",
      label: "Ranger - Amazon",
      ascendancy: {
        id: "amazon",
        name: "Amazon",
        startNodeId: "200",
      },
    };
    const applyClassStartOption = vi.fn();
    const clearOptimizedRouteState = vi.fn();
    const pobImportCode = encodePobXml(`
      <PathOfBuilding2>
        <Build className="Ranger" ascendClassName="Amazon" />
        <Tree activeSpec="1">
          <Spec title="Active" nodes="100,101,102,103,201" />
        </Tree>
      </PathOfBuilding2>
    `);

    const { result } = renderHook(() => {
      const [buildGoalNodeIds, setBuildGoalNodeIds] = useState(["101"]);
      const [ascendancyNodeIds, setAscendancyAllocationNodeIds] = useState<string[]>([]);
      const [pobImportStatus, setPobImportStatus] = useState<PobBuildImportStatus>({ kind: "idle" });
      const workflow = usePobImportWorkflow({
        graph,
        classStartOptions: [rangerOption, amazonOption],
        selectedClassStartOption: rangerOption,
        buildGoalNodeIds,
        setBuildGoalNodeIds,
        pobImportCode,
        setAscendancyAllocationNodeIds,
        setPobImportStatus,
        applyClassStartOption,
        clearOptimizedRouteState,
      });

      return {
        ...workflow,
        buildGoalNodeIds,
        ascendancyNodeIds,
        pobImportStatus,
      };
    });

    act(() => {
      result.current.importPobBuildGoals();
    });

    expect(applyClassStartOption).toHaveBeenCalledWith(amazonOption);
    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(1);
    expect(result.current.buildGoalNodeIds).toEqual(["101", "103"]);
    expect(result.current.ascendancyNodeIds).toEqual(["201"]);
    expect(result.current.pobImportStatus).toMatchObject({
      kind: "success",
      importedGoalCount: 1,
      alreadySelectedGoalCount: 1,
      pobBasePassivePointCount: 3,
      selectedAscendancyNodeCount: 1,
      missingNodeCount: 0,
      pathStart: {
        kind: "matched",
        label: "Ranger - Amazon",
        source: "metadata",
      },
    });
  });
});

function encodePobXml(xml: string): string {
  return deflateSync(xml).toString("base64").replaceAll("+", "-").replaceAll("/", "_");
}

function fixtureGraph(): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "pob-workflow-fixture",
    extractedAt: "2026-06-03T00:00:00.000Z",
    source: { kind: "fixture", path: "src/app/usePobImportWorkflow.test.ts" },
    nodes: {
      "100": {
        id: "100",
        name: "Ranger Start",
        stats: [],
        position: { x: 0, y: 0 },
        flags: { classStart: true },
      },
      "101": {
        id: "101",
        name: "Already Selected",
        stats: ["10% increased Damage"],
        position: { x: 100, y: 0 },
        flags: { notable: true },
      },
      "102": {
        id: "102",
        name: "Pathing",
        stats: ["5% increased Damage"],
        position: { x: 200, y: 0 },
        flags: { small: true },
      },
      "103": {
        id: "103",
        name: "New Goal",
        stats: [],
        position: { x: 300, y: 0 },
        flags: { jewelSocket: true },
      },
      "200": {
        id: "200",
        name: "Amazon Start",
        stats: [],
        position: { x: 10_000, y: 0 },
        flags: { ascendancy: true, classStart: true },
        ascendancy: {
          id: "amazon",
          name: "Amazon",
          className: "Ranger",
          disabled: false,
          startNode: true,
        },
      },
      "201": {
        id: "201",
        name: "Amazon Notable",
        stats: ["20% increased Ascendancy Power"],
        position: { x: 10_100, y: 0 },
        flags: { ascendancy: true, notable: true },
        ascendancy: {
          id: "amazon",
          name: "Amazon",
          className: "Ranger",
          disabled: false,
        },
      },
    },
    groups: {},
    edges: [
      { from: "100", to: "101" },
      { from: "101", to: "102" },
      { from: "102", to: "103" },
      { from: "200", to: "201" },
    ],
    classStarts: { RANGER: "100" },
    bounds: { minX: 0, maxX: 300, minY: 0, maxY: 0 },
  };
}
