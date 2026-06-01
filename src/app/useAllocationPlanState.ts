import { useCallback, useState } from "react";
import {
  emptyAllocationPlanForStart,
  type AllocationPlan,
} from "./allocationPlan";

export function useAllocationPlanState() {
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(() => emptyAllocationPlanForStart(undefined));
  const resetAllocationPlan = useCallback((pathStartNodeId: string | undefined) => {
    setAllocationPlan(emptyAllocationPlanForStart(pathStartNodeId));
  }, []);

  return {
    allocationPlan,
    setAllocationPlan,
    resetAllocationPlan,
  };
}
