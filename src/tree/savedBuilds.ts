export const savedBuildsStorageKey = "poe2-skill-tree-optimizer.saved-builds.v1";
const defaultNodeVisualScale = 3;

export type SavedBuildAllocationPlan = {
  committedNodePath: string[];
  committedEdgeKeys: string[];
  previewNodePath: string[];
  previewEdgeKeys: string[];
  previewRouteNodePath: string[];
  previewHighlightNodeIds?: string[];
  previewHighlightEdgeKeys?: string[];
  noAllocationPathNodeId?: string;
};

export type SavedBuildState = {
  selectedClassStartId?: string;
  pathStartNodeId?: string;
  allocationPlan: SavedBuildAllocationPlan;
  nodeVisualScale: number;
  buildGoalNodeIds: string[];
  ascendancyAllocationNodeIds: string[];
};

export type SavedBuild = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: SavedBuildState;
};

export function loadSavedBuilds(storage: Storage | undefined = defaultStorage()): SavedBuild[] {
  if (!storage) return [];

  try {
    const rawBuilds = storage.getItem(savedBuildsStorageKey);
    if (!rawBuilds) return [];
    const parsedBuilds: unknown = JSON.parse(rawBuilds);
    if (!Array.isArray(parsedBuilds)) return [];
    return parsedBuilds.flatMap((build) => normalizeSavedBuild(build));
  } catch {
    return [];
  }
}

export function storeSavedBuilds(builds: SavedBuild[], storage: Storage | undefined = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(savedBuildsStorageKey, JSON.stringify(builds));
  } catch {
    // The in-memory React state still keeps the saved build usable for this session.
  }
}

export function createSavedBuildId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `build-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function normalizeSavedBuild(value: unknown): SavedBuild[] {
  if (!isRecord(value)) return [];

  const allocationPlan = normalizeAllocationPlan(value.state);
  if (!allocationPlan) return [];

  const id = typeof value.id === "string" ? value.id : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : "";
  const state = isRecord(value.state) ? value.state : {};
  const buildGoalNodeIds = isStringArray(state.buildGoalNodeIds) ? state.buildGoalNodeIds : [];
  const ascendancyAllocationNodeIds = isStringArray(state.ascendancyAllocationNodeIds)
    ? state.ascendancyAllocationNodeIds
    : [];

  if (!id || !name) return [];

  return [{
    id,
    name,
    createdAt,
    updatedAt,
    state: {
      selectedClassStartId: typeof state.selectedClassStartId === "string" ? state.selectedClassStartId : undefined,
      pathStartNodeId: typeof state.pathStartNodeId === "string" ? state.pathStartNodeId : undefined,
      allocationPlan,
      nodeVisualScale: typeof state.nodeVisualScale === "number" ? state.nodeVisualScale : defaultNodeVisualScale,
      buildGoalNodeIds,
      ascendancyAllocationNodeIds,
    },
  }];
}

function normalizeAllocationPlan(state: unknown): SavedBuildAllocationPlan | undefined {
  if (!isRecord(state) || !isRecord(state.allocationPlan)) return undefined;

  const allocationPlan = state.allocationPlan;
  if (
    !isStringArray(allocationPlan.committedNodePath)
    || !isStringArray(allocationPlan.committedEdgeKeys)
    || !isStringArray(allocationPlan.previewNodePath)
    || !isStringArray(allocationPlan.previewEdgeKeys)
    || !isStringArray(allocationPlan.previewRouteNodePath)
  ) {
    return undefined;
  }

  return {
    committedNodePath: allocationPlan.committedNodePath,
    committedEdgeKeys: allocationPlan.committedEdgeKeys,
    previewNodePath: allocationPlan.previewNodePath,
    previewEdgeKeys: allocationPlan.previewEdgeKeys,
    previewRouteNodePath: allocationPlan.previewRouteNodePath,
    previewHighlightNodeIds: isStringArray(allocationPlan.previewHighlightNodeIds)
      ? allocationPlan.previewHighlightNodeIds
      : undefined,
    previewHighlightEdgeKeys: isStringArray(allocationPlan.previewHighlightEdgeKeys)
      ? allocationPlan.previewHighlightEdgeKeys
      : undefined,
    noAllocationPathNodeId: typeof allocationPlan.noAllocationPathNodeId === "string"
      ? allocationPlan.noAllocationPathNodeId
      : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
