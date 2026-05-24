import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPassiveIconAssetManifest,
  normalizePassiveIconPath,
  type PassiveIconAsset,
  type PassiveIconAssetManifest,
} from "../tree/passiveIconAssets";
import type { TreeGraph } from "../tree/types";

export type PathOfExileDatIconConfig = {
  steam: string;
  files: string[];
};

export type PassiveIconAssetExportOptions = {
  graph: TreeGraph;
  installPath: string;
  assetsDir: string;
  workDir: string;
  publicIconBasePath?: string;
  limit?: number;
  pythonCommand?: string;
};

export type PassiveIconAssetExportResult = {
  manifest: PassiveIconAssetManifest;
  copiedIcons: number;
  assetsDir: string;
  manifestPath: string;
};

export function exportPassiveIconAssets(options: PassiveIconAssetExportOptions): PassiveIconAssetExportResult {
  const manifest = buildPassiveIconAssetManifest(options.graph, options.publicIconBasePath);
  const icons = options.limit === undefined ? manifest.icons : manifest.icons.slice(0, options.limit);
  const exportManifest = { ...manifest, totalIcons: icons.length, icons };
  const config = buildPathOfExileDatIconConfig(options.installPath, icons);
  const iconOutputDir = join(options.assetsDir, "icons");
  const manifestPath = join(options.assetsDir, "icon-manifest.json");

  mkdirSync(options.workDir, { recursive: true });
  mkdirSync(iconOutputDir, { recursive: true });
  writeJson(join(options.workDir, "config.json"), config);
  writeMagickShim(options.workDir, options.pythonCommand ?? "python");
  runPathOfExileDat(options.workDir);

  const missing: string[] = [];
  for (const icon of icons) {
    const sourcePath = join(options.workDir, "files", pathOfExileDatPngFileName(icon.source));
    const targetPath = join(iconOutputDir, `${icon.assetKey}.png`);
    if (!existsSync(sourcePath)) {
      missing.push(icon.source);
      continue;
    }
    copyFileSync(sourcePath, targetPath);
  }

  if (missing.length > 0) {
    throw new Error(`Missing ${missing.length} exported passive icon PNG files. First missing icon: ${missing[0]}`);
  }

  writeJson(manifestPath, exportManifest);
  return {
    manifest: exportManifest,
    copiedIcons: icons.length,
    assetsDir: options.assetsDir,
    manifestPath,
  };
}

export function buildPathOfExileDatIconConfig(
  installPath: string,
  assets: PassiveIconAsset[],
): PathOfExileDatIconConfig {
  return {
    steam: installPath,
    files: assets.map((asset) => asset.source),
  };
}

export function pathOfExileDatPngFileName(iconPath: string): string {
  return normalizePassiveIconPath(iconPath).replaceAll("/", "@").replace(/\.dds$/i, ".png");
}

function runPathOfExileDat(workDir: string): void {
  const command = process.platform === "win32" ? "cmd.exe" : "npx";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npx --yes pathofexile-dat"]
    : ["--yes", "pathofexile-dat"];
  const currentPath = process.env.Path ?? process.env.PATH ?? "";
  const shimPath = `${resolve(workDir, "bin")}${delimiter}${currentPath}`;
  const env = { ...process.env };
  if (process.platform === "win32") {
    delete env.PATH;
    env.Path = shimPath;
  } else {
    env.PATH = shimPath;
  }

  execFileSync(command, args, {
    cwd: workDir,
    stdio: "inherit",
    env,
  });
}

function writeMagickShim(workDir: string, pythonCommand: string): void {
  const binDir = join(workDir, "bin");
  const shimScript = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "tools", "magick-dds-shim.py");
  mkdirSync(binDir, { recursive: true });

  if (process.platform === "win32") {
    writeFileSync(
      join(binDir, "magick.cmd"),
      `@echo off\r\n"${pythonCommand}" "${shimScript}" %*\r\n`,
      "utf8",
    );
    buildWindowsMagickExecutable(workDir, binDir, shimScript);
    return;
  }

  const shimPath = join(binDir, "magick");
  writeFileSync(shimPath, `#!/bin/sh\nexec "${pythonCommand}" "${shimScript}" "$@"\n`, {
    encoding: "utf8",
    mode: 0o755,
  });
}

function buildWindowsMagickExecutable(workDir: string, binDir: string, shimScript: string): void {
  const magickExe = join(binDir, "magick.exe");
  if (existsSync(magickExe)) return;

  try {
    execFileSync(
      "pyinstaller.exe",
      [
        "--onefile",
        "--noconfirm",
        "--name",
        "magick",
        "--distpath",
        binDir,
        "--workpath",
        join(workDir, "pyinstaller-build"),
        "--specpath",
        join(workDir, "pyinstaller-spec"),
        shimScript,
      ],
      { stdio: "inherit" },
    );
  } catch {
    // A real ImageMagick magick.exe later in PATH can still satisfy pathofexile-dat.
  }
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readTreeGraph(path: string): TreeGraph {
  return JSON.parse(readFileSync(path, "utf8")) as TreeGraph;
}
