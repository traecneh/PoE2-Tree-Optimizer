import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { AllocationPlan } from "./allocationPlan";
import { emptyAllocationPlanForStart } from "./allocationPlan";
import { useClassStartAllocationActions } from "./useClassStartAllocationActions";

describe("useClassStartAllocationActions", () => {
  it("reports whether allocation state can be reset", () => {
    const { result, rerender } = renderHook((props: HookProps) => renderActions(props), {
      initialProps: defaultHookProps(),
    });

    expect(result.current.canResetAllocation).toBe(false);

    rerender({
      ...defaultHookProps(),
      allocationPlan: {
        ...emptyAllocationPlanForStart("witch_start"),
        committedNodePath: ["witch_start", "first_passive"],
      },
    });

    expect(result.current.canResetAllocation).toBe(true);

    rerender({
      ...defaultHookProps(),
      allocationPlan: {
        ...emptyAllocationPlanForStart("witch_start"),
        noAllocationPathNodeId: "blocked_node",
      },
    });

    expect(result.current.canResetAllocation).toBe(true);

    rerender({
      ...defaultHookProps(),
      activeAscendancyAllocationNodeIds: ["ascendancy_node"],
    });

    expect(result.current.canResetAllocation).toBe(true);
  });

  it("clears route state and resets the current allocation", () => {
    const clearOptimizedRouteState = vi.fn();
    const resetAscendancyAllocation = vi.fn();
    const resetAllocationPlan = vi.fn();
    const { result } = renderHook(() => renderActions({
      ...defaultHookProps(),
      clearOptimizedRouteState,
      resetAscendancyAllocation,
      resetAllocationPlan,
    }));

    act(() => {
      result.current.resetAllocation();
    });

    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(1);
    expect(resetAscendancyAllocation).toHaveBeenCalledTimes(1);
    expect(resetAllocationPlan).toHaveBeenCalledWith("witch_start");
  });

  it("applies known class starts and ignores unknown class start ids", () => {
    const clearOptimizedRouteState = vi.fn();
    const clearTreeInteractionState = vi.fn();
    const resetAscendancyAllocation = vi.fn();
    const resetAllocationPlan = vi.fn();
    const { result } = renderHook(() => renderActions({
      ...defaultHookProps(),
      clearOptimizedRouteState,
      clearTreeInteractionState,
      resetAscendancyAllocation,
      resetAllocationPlan,
    }));

    act(() => {
      result.current.changeSelectedClassStart("huntress");
    });

    expect(result.current.selectedClassStartId).toBe("huntress");
    expect(result.current.pathStartNodeId).toBe("ranger_start");
    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(1);
    expect(clearTreeInteractionState).toHaveBeenCalledTimes(1);
    expect(resetAscendancyAllocation).toHaveBeenCalledTimes(1);
    expect(resetAllocationPlan).toHaveBeenCalledWith("ranger_start");

    act(() => {
      result.current.changeSelectedClassStart("missing");
    });

    expect(result.current.selectedClassStartId).toBe("huntress");
    expect(result.current.pathStartNodeId).toBe("ranger_start");
    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(1);
    expect(clearTreeInteractionState).toHaveBeenCalledTimes(1);
    expect(resetAscendancyAllocation).toHaveBeenCalledTimes(1);
    expect(resetAllocationPlan).toHaveBeenCalledTimes(1);
  });
});

type HookProps = {
  allocationPlan: AllocationPlan;
  activeAscendancyAllocationNodeIds: string[];
  classStartOptions: ClassStartOption[];
  clearOptimizedRouteState: () => void;
  clearTreeInteractionState: () => void;
  resetAllocationPlan: (pathStartNodeId: string | undefined) => void;
  resetAscendancyAllocation: () => void;
};

function renderActions({
  allocationPlan,
  activeAscendancyAllocationNodeIds,
  classStartOptions,
  clearOptimizedRouteState,
  clearTreeInteractionState,
  resetAllocationPlan,
  resetAscendancyAllocation,
}: HookProps) {
  const [selectedClassStartId, setSelectedClassStartId] = useState<string | undefined>("witch");
  const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>("witch_start");
  const actions = useClassStartAllocationActions({
    allocationPlan,
    activeAscendancyAllocationNodeIds,
    classStartOptions,
    pathStartNodeId,
    setSelectedClassStartId,
    setPathStartNodeId,
    resetAllocationPlan,
    resetAscendancyAllocation,
    clearOptimizedRouteState,
    clearTreeInteractionState,
  });

  return {
    ...actions,
    pathStartNodeId,
    selectedClassStartId,
  };
}

function defaultHookProps(): HookProps {
  return {
    allocationPlan: emptyAllocationPlanForStart("witch_start"),
    activeAscendancyAllocationNodeIds: [],
    classStartOptions: [
      {
        id: "witch",
        label: "Witch",
        className: "Witch",
        rootClassId: "WITCH",
        nodeId: "witch_start",
      },
      {
        id: "huntress",
        label: "Huntress",
        className: "Huntress",
        rootClassId: "RANGER",
        nodeId: "ranger_start",
      },
    ],
    clearOptimizedRouteState: vi.fn(),
    clearTreeInteractionState: vi.fn(),
    resetAllocationPlan: vi.fn(),
    resetAscendancyAllocation: vi.fn(),
  };
}
