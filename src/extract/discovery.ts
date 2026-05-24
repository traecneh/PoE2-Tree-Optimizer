import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ExtractionError } from "./errors";

export type InstallDiscoveryOptions = {
  explicitPath?: string;
  commonPaths?: string[];
  steamRoots?: string[];
};

export type Poe2Install = {
  installPath: string;
  contentGgpkPath: string;
  gameVersion?: string;
};

const defaultCommonPaths = [
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2",
  "C:\\Program Files\\Epic Games\\PathOfExile2",
  "C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile 2",
  "C:\\Program Files\\Grinding Gear Games\\Path of Exile 2",
];

const defaultSteamRoots = [
  "C:\\Program Files (x86)\\Steam",
  "C:\\Program Files\\Steam",
];

export function discoverPoe2Install(options: InstallDiscoveryOptions = {}): Poe2Install {
  if (options.explicitPath !== undefined) {
    const contentGgpkPath = join(options.explicitPath, "Content.ggpk");
    if (existsSync(contentGgpkPath)) {
      return { installPath: options.explicitPath, contentGgpkPath };
    }

    throw new ExtractionError(`Configured PoE2 path does not contain Content.ggpk: ${options.explicitPath}`, "invalid-install-path");
  }

  const candidates = [
    process.env.POE2_INSTALL_PATH,
    ...steamLibraryCandidates(options.steamRoots ?? defaultSteamRoots),
    ...(options.commonPaths ?? defaultCommonPaths),
  ].filter((path): path is string => Boolean(path));

  for (const candidate of candidates) {
    const contentGgpkPath = join(candidate, "Content.ggpk");
    if (existsSync(contentGgpkPath)) {
      return { installPath: candidate, contentGgpkPath };
    }
  }

  throw new ExtractionError("Could not find a Path of Exile 2 install containing Content.ggpk.", "install-not-found");
}

function steamLibraryCandidates(steamRoots: string[]): string[] {
  const candidates: string[] = [];
  for (const steamRoot of steamRoots) {
    const libraryFolders = join(steamRoot, "steamapps", "libraryfolders.vdf");
    if (!existsSync(libraryFolders)) continue;

    const text = readFileSync(libraryFolders, "utf8");
    const pathMatches = text.matchAll(/"path"\s+"([^"]+)"/g);
    for (const match of pathMatches) {
      const libraryPath = match[1].replaceAll("\\\\", "\\");
      candidates.push(join(libraryPath, "steamapps", "common", "Path of Exile 2"));
    }
  }
  return candidates;
}
