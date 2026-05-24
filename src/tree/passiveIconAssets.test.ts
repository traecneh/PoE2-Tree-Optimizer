import { describe, expect, it } from "vitest";
import type { TreeGraph } from "./types";
import {
  buildPassiveIconAssetManifest,
  passiveIconAssetKey,
  passiveIconPublicPath,
} from "./passiveIconAssets";

describe("passive icon assets", () => {
  it("builds stable public paths for DDS passive icon references", () => {
    const icon = "Art/2DArt/SkillIcons/passives/PathFinder/PathfinderNode.dds";

    expect(passiveIconAssetKey(icon)).toBe("art-2dart-skillicons-passives-pathfinder-pathfindernode");
    expect(passiveIconPublicPath(icon)).toBe(
      "/tree-assets/icons/art-2dart-skillicons-passives-pathfinder-pathfindernode.png",
    );
  });

  it("builds a deduplicated sorted manifest from graph nodes", () => {
    const graph: TreeGraph = {
      schemaVersion: 1,
      gameVersion: "fixture",
      extractedAt: "2026-05-24T00:00:00.000Z",
      source: { kind: "fixture", path: "fixture" },
      nodes: {
        a: {
          id: "a",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { small: true },
          art: { icon: "Art/2DArt/SkillIcons/passives/zeta.dds" },
        },
        b: {
          id: "b",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { small: true },
          art: { icon: "Art/2DArt/SkillIcons/passives/alpha.dds" },
        },
        c: {
          id: "c",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { small: true },
          art: { icon: "Art\\2DArt\\SkillIcons\\passives\\zeta.dds" },
        },
      },
      groups: {},
      edges: [],
      classStarts: {},
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };

    expect(buildPassiveIconAssetManifest(graph)).toEqual({
      generatedAt: expect.any(String),
      totalIcons: 2,
      icons: [
        {
          source: "Art/2DArt/SkillIcons/passives/alpha.dds",
          assetKey: "art-2dart-skillicons-passives-alpha",
          publicPath: "/tree-assets/icons/art-2dart-skillicons-passives-alpha.png",
        },
        {
          source: "Art/2DArt/SkillIcons/passives/zeta.dds",
          assetKey: "art-2dart-skillicons-passives-zeta",
          publicPath: "/tree-assets/icons/art-2dart-skillicons-passives-zeta.png",
        },
      ],
    });
  });
});
