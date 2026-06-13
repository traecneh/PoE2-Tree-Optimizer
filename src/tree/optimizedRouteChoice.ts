export type OptimizedRouteChoice = {
  routeIndex: number;
  routeNumber: number;
  routeCount: number;
  pointCost: number;
  pointDeltaFromBest: number;
  pointCostRouteNumber: number;
  pointCostRouteCount: number;
};

export function normalizeOptimizedRouteChoice(value: unknown): OptimizedRouteChoice | undefined {
  if (!isRecord(value)) return undefined;

  const choice = {
    routeIndex: value.routeIndex,
    routeNumber: value.routeNumber,
    routeCount: value.routeCount,
    pointCost: value.pointCost,
    pointDeltaFromBest: value.pointDeltaFromBest,
    pointCostRouteNumber: value.pointCostRouteNumber,
    pointCostRouteCount: value.pointCostRouteCount,
  };

  if (
    !isNonNegativeInteger(choice.routeIndex)
    || !isPositiveInteger(choice.routeNumber)
    || !isPositiveInteger(choice.routeCount)
    || !isNonNegativeInteger(choice.pointCost)
    || !isNonNegativeInteger(choice.pointDeltaFromBest)
    || !isPositiveInteger(choice.pointCostRouteNumber)
    || !isPositiveInteger(choice.pointCostRouteCount)
    || choice.routeNumber !== choice.routeIndex + 1
    || choice.routeNumber > choice.routeCount
    || choice.pointCostRouteNumber > choice.pointCostRouteCount
  ) {
    return undefined;
  }

  return choice as OptimizedRouteChoice;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
