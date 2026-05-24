import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type InventoryFile = {
  relativePath: string;
  sizeBytes: number;
};

export type GameDataInventory = {
  installPath: string;
  contentGgpk: { exists: boolean; sizeBytes: number };
  passiveCandidates: InventoryFile[];
  archiveCandidates: InventoryFile[];
};

const passivePattern = /passive|skill.?tree|tree\.lua|tree\.json|\.psg$/i;
const archivePattern = /content\.ggpk|bundles2|\.datc64$/i;

export function inventoryGameData(installPath: string): GameDataInventory {
  const contentGgpkPath = join(installPath, "Content.ggpk");
  const contentGgpkExists = existsSync(contentGgpkPath);
  const files = walkFiles(installPath, 4);

  return {
    installPath,
    contentGgpk: {
      exists: contentGgpkExists,
      sizeBytes: contentGgpkExists ? statSync(contentGgpkPath).size : 0,
    },
    passiveCandidates: files.filter((file) => passivePattern.test(file.relativePath)),
    archiveCandidates: files.filter((file) => archivePattern.test(file.relativePath)),
  };
}

function walkFiles(root: string, maxDepth: number): InventoryFile[] {
  const output: InventoryFile[] = [];

  function walk(current: string, depth: number): void {
    if (depth > maxDepth || !existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
        continue;
      }
      const stats = statSync(fullPath);
      output.push({
        relativePath: relative(root, fullPath),
        sizeBytes: stats.size,
      });
    }
  }

  walk(root, 0);
  return output;
}
