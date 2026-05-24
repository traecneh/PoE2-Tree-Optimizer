import { describe, expect, it } from "vitest";
import type { PassiveIconAsset } from "../tree/passiveIconAssets";
import {
  buildPathOfExileDatIconConfig,
  pathOfExileDatPngFileName,
} from "./passiveIconAssets";

describe("passive icon asset extraction", () => {
  it("builds a pathofexile-dat config for icon files", () => {
    const assets: PassiveIconAsset[] = [
      {
        source: "Art/2DArt/SkillIcons/passives/alpha.dds",
        assetKey: "alpha",
        publicPath: "/tree-assets/icons/alpha.png",
      },
      {
        source: "Art/2DArt/SkillIcons/passives/zeta.dds",
        assetKey: "zeta",
        publicPath: "/tree-assets/icons/zeta.png",
      },
    ];

    expect(buildPathOfExileDatIconConfig("C:/Games/Path of Exile 2", assets)).toEqual({
      steam: "C:/Games/Path of Exile 2",
      files: [
        "Art/2DArt/SkillIcons/passives/alpha.dds",
        "Art/2DArt/SkillIcons/passives/zeta.dds",
      ],
    });
  });

  it("matches pathofexile-dat PNG output names for DDS file paths", () => {
    expect(pathOfExileDatPngFileName("Art/2DArt/SkillIcons/passives/PathFinder/PathfinderNode.dds")).toBe(
      "Art@2DArt@SkillIcons@passives@PathFinder@PathfinderNode.png",
    );
  });
});
