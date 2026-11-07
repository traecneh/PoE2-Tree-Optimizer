import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverPoe2Install } from "./discovery";

describe("discoverPoe2Install", () => {
  const originalPoe2InstallPath = process.env.POE2_INSTALL_PATH;

  afterEach(() => {
    process.env.POE2_INSTALL_PATH = originalPoe2InstallPath;
  });

  it("uses an explicit path when it contains Content.ggpk", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-install-"));
    writeFileSync(join(root, "Content.ggpk"), "");

    const result = discoverPoe2Install({ explicitPath: root, commonPaths: [] });

    expect(result.installPath).toBe(root);
    expect(result.contentGgpkPath).toBe(join(root, "Content.ggpk"));
  });

  it("throws invalid-install-path for an invalid explicit path without falling back", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-explicit-fallback-"));
    const explicit = join(root, "wrong-path");
    const envInstall = join(root, "env-install");
    const commonInstall = join(root, "common-install");
    mkdirSync(explicit, { recursive: true });
    mkdirSync(envInstall, { recursive: true });
    mkdirSync(commonInstall, { recursive: true });
    writeFileSync(join(envInstall, "Content.ggpk"), "");
    writeFileSync(join(commonInstall, "Content.ggpk"), "");
    process.env.POE2_INSTALL_PATH = envInstall;

    expect(() => discoverPoe2Install({ explicitPath: explicit, commonPaths: [commonInstall], steamRoots: [] })).toThrow(
      expect.objectContaining({ code: "invalid-install-path" }),
    );
  });

  it("accepts a Steam install with an indexed bundle directory and no Content.ggpk", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-bundles-"));
    mkdirSync(join(root, "Bundles2"));
    writeFileSync(join(root, "Bundles2", "_.index.bin"), "");

    const result = discoverPoe2Install({ explicitPath: root, commonPaths: [], steamRoots: [] });

    expect(result.installPath).toBe(root);
    expect(result.contentGgpkPath).toBeUndefined();
    expect(result.bundleIndexPath).toBe(join(root, "Bundles2", "_.index.bin"));
  });

  it("discovers indexed bundle installs automatically", () => {
    delete process.env.POE2_INSTALL_PATH;
    const root = mkdtempSync(join(tmpdir(), "poe2-bundles-common-"));
    mkdirSync(join(root, "Bundles2"));
    writeFileSync(join(root, "Bundles2", "_.index.bin"), "");

    expect(discoverPoe2Install({ commonPaths: [root], steamRoots: [] }).installPath).toBe(root);
  });

  it("rejects a bundle directory without its index", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-bundles-missing-index-"));
    mkdirSync(join(root, "Bundles2"));

    expect(() => discoverPoe2Install({ explicitPath: root })).toThrow(
      expect.objectContaining({ code: "invalid-install-path" }),
    );
  });

  it("reads Steam libraryfolders.vdf and finds Path of Exile 2", () => {
    delete process.env.POE2_INSTALL_PATH;
    const root = mkdtempSync(join(tmpdir(), "poe2-steam-"));
    const steam = join(root, "Steam");
    const library = join(root, "SteamLibrary");
    const poe2 = join(library, "steamapps", "common", "Path of Exile 2");
    mkdirSync(join(steam, "steamapps"), { recursive: true });
    mkdirSync(poe2, { recursive: true });
    writeFileSync(join(poe2, "Content.ggpk"), "");
    writeFileSync(join(steam, "steamapps", "libraryfolders.vdf"), `"libraryfolders" { "1" { "path" "${library.replaceAll("\\", "\\\\")}" } }`);

    const result = discoverPoe2Install({ explicitPath: undefined, commonPaths: [], steamRoots: [steam] });

    expect(result.installPath).toBe(poe2);
  });
});
