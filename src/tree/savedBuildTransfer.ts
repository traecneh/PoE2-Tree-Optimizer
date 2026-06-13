import { normalizeSavedBuilds, type SavedBuild } from "./savedBuilds";

const savedBuildExportSchemaVersion = 1;

export function serializeSavedBuildExport(
  builds: SavedBuild[],
  exportedAt = new Date().toISOString(),
): string {
  return JSON.stringify({
    schemaVersion: savedBuildExportSchemaVersion,
    exportedAt,
    builds,
  }, null, 2);
}

export function parseSavedBuildExport(json: string): SavedBuild[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Saved build import file is not valid JSON.");
  }

  const rawBuilds = isRecord(parsed) && Array.isArray(parsed.builds) ? parsed.builds : parsed;
  const builds = normalizeSavedBuilds(rawBuilds);
  if (builds.length === 0) {
    throw new Error("No saved builds found in import file.");
  }

  return builds;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
