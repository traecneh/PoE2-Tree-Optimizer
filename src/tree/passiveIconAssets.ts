import type { TreeGraph } from "./types";

export type PassiveIconAsset = {
  source: string;
  assetKey: string;
  publicPath: string;
};

export type PassiveIconAssetManifest = {
  generatedAt: string;
  totalIcons: number;
  icons: PassiveIconAsset[];
};

const defaultPublicIconBasePath = "/tree-assets/icons";

export function buildPassiveIconAssetManifest(
  graph: TreeGraph,
  publicIconBasePath = defaultPublicIconBasePath,
): PassiveIconAssetManifest {
  const uniqueIcons = new Map<string, string>();
  for (const node of Object.values(graph.nodes)) {
    const icon = node.art?.icon;
    if (!icon) continue;
    const source = normalizePassiveIconPath(icon);
    uniqueIcons.set(source.toLowerCase(), source);
  }

  const icons = Array.from(uniqueIcons.values())
    .sort((left, right) => left.localeCompare(right))
    .map((source) => ({
      source,
      assetKey: passiveIconAssetKey(source),
      publicPath: passiveIconPublicPath(source, undefined, publicIconBasePath),
    }));

  return {
    generatedAt: new Date().toISOString(),
    totalIcons: icons.length,
    icons,
  };
}

export function passiveIconPublicPath(
  iconPath: string,
  assetKey = passiveIconAssetKey(iconPath),
  publicIconBasePath = defaultPublicIconBasePath,
): string {
  const basePath = publicIconBasePath.endsWith("/") ? publicIconBasePath.slice(0, -1) : publicIconBasePath;
  return `${basePath}/${assetKey}.png`;
}

export function passiveIconAssetKey(iconPath: string): string {
  const withoutExtension = normalizePassiveIconPath(iconPath).replace(/\.dds$/i, "");
  const key = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return key || "passive-icon";
}

export function normalizePassiveIconPath(iconPath: string): string {
  return iconPath.trim().replaceAll("\\", "/").replace(/^\/+/, "");
}
