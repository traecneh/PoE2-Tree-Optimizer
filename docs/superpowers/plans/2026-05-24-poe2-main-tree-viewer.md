# PoE2 Main Tree Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reproducible local-game-data pipeline and structural SVG viewer for the PoE2 main passive tree.

**Architecture:** Use a TypeScript/Vite React app with a Node-based extraction CLI. The extractor discovers the local PoE2 install, inventories candidate game data, converts a locally exported passive tree payload into a versioned `TreeGraph`, validates it, and writes JSON artifacts consumed by the viewer. The viewer renders only normalized graph JSON so future optimizer code can reuse the same data contract.

**Tech Stack:** TypeScript, Node.js, npm, Vite, React, SVG, Vitest, Testing Library, jsdom, `tsx` for CLI execution.

---

## Source References

- Design spec: `docs/superpowers/specs/2026-05-24-poe2-main-tree-viewer-design.md`
- Path of Building PoE2 tree data reference: https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/tree/dev/src/TreeData
- GGG PoE1 passive tree JSON reference: https://github.com/grindinggear/skilltree-export
- PoE DAT schema reference: https://github.com/poe-tool-dev/dat-schema
- `pathofexile-dat` local/export tooling reference: https://socket.dev/npm/package/pathofexile-dat
- PoE2 GGPK extraction reference: https://github.com/juddisjudd/ggpk-tool
- RePoE PoE2 exported data shape reference: https://repoe-fork.github.io/poe2/

## File Structure

Create these files:

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`: project tooling.
- `src/main.tsx`, `src/App.tsx`, `src/styles.css`: React entrypoint and application shell.
- `src/tree/types.ts`: normalized graph types.
- `src/tree/sampleGraph.ts`: small fixture for tests and initial viewer.
- `src/tree/validateTreeGraph.ts`: graph validation.
- `src/tree/validateTreeGraph.test.ts`: validator tests.
- `src/extract/errors.ts`: typed extraction errors.
- `src/extract/discovery.ts`: install path discovery.
- `src/extract/discovery.test.ts`: discovery tests.
- `src/extract/inventory.ts`: local game data inventory.
- `src/extract/inventory.test.ts`: inventory tests.
- `src/extract/normalize.ts`: raw passive tree to `TreeGraph` normalization.
- `src/extract/normalize.test.ts`: normalization tests.
- `src/extract/cli.ts`: CLI entrypoint for inventory, graph extraction, and validation.
- `src/viewer/TreeViewer.tsx`: SVG render surface.
- `src/viewer/treeViewBox.ts`: bounds and fit-to-tree math.
- `src/viewer/treeViewBox.test.ts`: viewbox math tests.
- `src/viewer/NodeInspector.tsx`: selected/hovered node details.
- `src/viewer/DebugControls.tsx`: overlay toggles.
- `public/sample-tree-graph.json`: temporary graph loaded by the viewer until local extraction succeeds.

Modify:

- `.gitignore`: ignore generated artifacts: `node_modules/`, `dist/`, `coverage/`, `.env`, `var/`, `public/tree-graph.json`.

Generated at runtime, never committed:

- `var/cache/raw-passive-tree.json`
- `var/output/tree-graph.json`
- `var/output/validation-report.json`
- `var/output/local-data-inventory.json`
- `public/tree-graph.json`

## Task 1: Scaffold The TypeScript App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize package metadata**

Create `package.json`:

```json
{
  "name": "poe2-skill-tree-optimizer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "extract:inventory": "tsx src/extract/cli.ts inventory",
    "extract:graph": "tsx src/extract/cli.ts graph",
    "validate:graph": "tsx src/extract/cli.ts validate"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "tsx": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add TypeScript and Vite config**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PoE2 Skill Tree Optimizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Update ignored files**

Replace `.gitignore` with:

```gitignore
.superpowers/
node_modules/
dist/
coverage/
.env
var/
public/tree-graph.json
```

- [ ] **Step 4: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules/` and `package-lock.json` are created.

- [ ] **Step 5: Commit scaffold**

```powershell
git add .gitignore package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts index.html
git commit -m "chore: scaffold TypeScript React app"
```

## Task 2: Define The Normalized Tree Graph

**Files:**
- Create: `src/tree/types.ts`
- Create: `src/tree/sampleGraph.ts`
- Create: `public/sample-tree-graph.json`

- [ ] **Step 1: Add normalized types**

Create `src/tree/types.ts`:

```ts
export type NodeId = string;
export type GroupId = string;
export type ClassId = string;

export type TreeNodeFlags = {
  classStart?: boolean;
  attribute?: boolean;
  small?: boolean;
  notable?: boolean;
  keystone?: boolean;
  jewelSocket?: boolean;
};

export type TreeNode = {
  id: NodeId;
  groupId?: GroupId;
  name?: string;
  stats: string[];
  position: { x: number; y: number };
  flags: TreeNodeFlags;
  art?: {
    icon?: string;
    assetKey?: string;
  };
};

export type TreeGroup = {
  id: GroupId;
  position?: { x: number; y: number };
  nodeIds: NodeId[];
};

export type TreeEdge = {
  from: NodeId;
  to: NodeId;
};

export type TreeGraph = {
  schemaVersion: 1;
  gameVersion: string;
  extractedAt: string;
  source: {
    kind: "local-game-data" | "fixture";
    path: string;
  };
  nodes: Record<NodeId, TreeNode>;
  groups: Record<GroupId, TreeGroup>;
  edges: TreeEdge[];
  classStarts: Record<ClassId, NodeId>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
};
```

- [ ] **Step 2: Add a small fixture graph**

Create `src/tree/sampleGraph.ts`:

```ts
import type { TreeGraph } from "./types";

export const sampleGraph: TreeGraph = {
  schemaVersion: 1,
  gameVersion: "fixture",
  extractedAt: "2026-05-24T00:00:00.000Z",
  source: { kind: "fixture", path: "src/tree/sampleGraph.ts" },
  nodes: {
    mercenary_start: {
      id: "mercenary_start",
      groupId: "g1",
      name: "Mercenary",
      stats: ["Starting point"],
      position: { x: 0, y: 0 },
      flags: { classStart: true },
    },
    projectile_damage: {
      id: "projectile_damage",
      groupId: "g1",
      name: "Projectile Damage",
      stats: ["12% increased Projectile Damage"],
      position: { x: 120, y: -40 },
      flags: { small: true },
    },
    precise_shot: {
      id: "precise_shot",
      groupId: "g1",
      name: "Precise Shot",
      stats: ["25% increased Critical Hit Chance"],
      position: { x: 240, y: 0 },
      flags: { notable: true },
    },
    jewel_socket: {
      id: "jewel_socket",
      groupId: "g2",
      name: "Jewel Socket",
      stats: [],
      position: { x: 360, y: 90 },
      flags: { jewelSocket: true },
    },
  },
  groups: {
    g1: { id: "g1", position: { x: 0, y: 0 }, nodeIds: ["mercenary_start", "projectile_damage", "precise_shot"] },
    g2: { id: "g2", position: { x: 360, y: 90 }, nodeIds: ["jewel_socket"] },
  },
  edges: [
    { from: "mercenary_start", to: "projectile_damage" },
    { from: "projectile_damage", to: "precise_shot" },
    { from: "precise_shot", to: "jewel_socket" },
  ],
  classStarts: { Mercenary: "mercenary_start" },
  bounds: { minX: 0, maxX: 360, minY: -40, maxY: 90 },
};
```

- [ ] **Step 3: Copy fixture to public JSON**

Create `public/sample-tree-graph.json` using the same object as `sampleGraph`, serialized as JSON.

- [ ] **Step 4: Commit graph types**

```powershell
git add src/tree/types.ts src/tree/sampleGraph.ts public/sample-tree-graph.json
git commit -m "feat: define normalized tree graph schema"
```

## Task 3: Add Graph Validation

**Files:**
- Create: `src/tree/validateTreeGraph.ts`
- Create: `src/tree/validateTreeGraph.test.ts`

- [ ] **Step 1: Write validator tests**

Create `src/tree/validateTreeGraph.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sampleGraph } from "./sampleGraph";
import { validateTreeGraph } from "./validateTreeGraph";
import type { TreeGraph } from "./types";

describe("validateTreeGraph", () => {
  it("accepts the sample graph", () => {
    const report = validateTreeGraph(sampleGraph);
    expect(report.summary.nodeCount).toBe(4);
    expect(report.summary.edgeCount).toBe(3);
    expect(report.issues).toEqual([]);
  });

  it("reports dangling edges", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      edges: [{ from: "mercenary_start", to: "missing" }],
    };

    const report = validateTreeGraph(graph);

    expect(report.summary.danglingEdgeCount).toBe(1);
    expect(report.issues[0]).toMatchObject({ code: "dangling-edge" });
  });

  it("reports missing coordinates and orphan nodes", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        orphan: {
          id: "orphan",
          name: "Broken",
          stats: [],
          position: { x: Number.NaN, y: 10 },
          flags: { small: true },
        },
      },
    };

    const report = validateTreeGraph(graph);

    expect(report.summary.missingCoordinateCount).toBe(1);
    expect(report.summary.orphanNodeCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm test -- src/tree/validateTreeGraph.test.ts
```

Expected: FAIL because `validateTreeGraph.ts` does not exist.

- [ ] **Step 3: Implement validator**

Create `src/tree/validateTreeGraph.ts`:

```ts
import type { NodeId, TreeGraph } from "./types";

export type ValidationIssueCode =
  | "dangling-edge"
  | "missing-coordinate"
  | "missing-stats"
  | "orphan-node"
  | "duplicate-group-node";

export type ValidationIssue = {
  code: ValidationIssueCode;
  nodeId?: NodeId;
  edge?: { from: NodeId; to: NodeId };
  message: string;
};

export type ValidationReport = {
  gameVersion: string;
  extractedAt: string;
  summary: {
    nodeCount: number;
    edgeCount: number;
    groupCount: number;
    classStartCount: number;
    missingCoordinateCount: number;
    missingStatCount: number;
    danglingEdgeCount: number;
    orphanNodeCount: number;
    duplicateNodeIdCount: number;
    bounds: TreeGraph["bounds"];
  };
  issues: ValidationIssue[];
};

export function validateTreeGraph(graph: TreeGraph): ValidationReport {
  const issues: ValidationIssue[] = [];
  const connected = new Set<NodeId>();
  let danglingEdgeCount = 0;
  let missingCoordinateCount = 0;
  let missingStatCount = 0;
  let duplicateGroupNodeCount = 0;
  const groupedNodeIds = new Set<NodeId>();

  for (const edge of graph.edges) {
    const fromExists = Boolean(graph.nodes[edge.from]);
    const toExists = Boolean(graph.nodes[edge.to]);
    if (!fromExists || !toExists) {
      danglingEdgeCount += 1;
      issues.push({
        code: "dangling-edge",
        edge,
        message: `Edge ${edge.from} -> ${edge.to} references a missing node.`,
      });
      continue;
    }
    connected.add(edge.from);
    connected.add(edge.to);
  }

  for (const node of Object.values(graph.nodes)) {
    if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
      missingCoordinateCount += 1;
      issues.push({
        code: "missing-coordinate",
        nodeId: node.id,
        message: `Node ${node.id} has invalid coordinates.`,
      });
    }

    if (!node.flags.classStart && !node.flags.jewelSocket && node.stats.length === 0) {
      missingStatCount += 1;
      issues.push({
        code: "missing-stats",
        nodeId: node.id,
        message: `Node ${node.id} has no stat lines.`,
      });
    }

    if (!connected.has(node.id) && !node.flags.classStart) {
      issues.push({
        code: "orphan-node",
        nodeId: node.id,
        message: `Node ${node.id} is not connected to any other node.`,
      });
    }
  }

  for (const group of Object.values(graph.groups)) {
    for (const nodeId of group.nodeIds) {
      if (groupedNodeIds.has(nodeId)) {
        duplicateGroupNodeCount += 1;
        issues.push({
          code: "duplicate-group-node",
          nodeId,
          message: `Node ${nodeId} appears in more than one group node list.`,
        });
      }
      groupedNodeIds.add(nodeId);
    }
  }

  const orphanNodeCount = issues.filter((issue) => issue.code === "orphan-node").length;

  return {
    gameVersion: graph.gameVersion,
    extractedAt: graph.extractedAt,
    summary: {
      nodeCount: Object.keys(graph.nodes).length,
      edgeCount: graph.edges.length,
      groupCount: Object.keys(graph.groups).length,
      classStartCount: Object.keys(graph.classStarts).length,
      missingCoordinateCount,
      missingStatCount,
      danglingEdgeCount,
      orphanNodeCount,
      duplicateNodeIdCount: duplicateGroupNodeCount,
      bounds: graph.bounds,
    },
    issues,
  };
}
```

- [ ] **Step 4: Run tests**

```powershell
npm test -- src/tree/validateTreeGraph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit validator**

```powershell
git add src/tree/validateTreeGraph.ts src/tree/validateTreeGraph.test.ts
git commit -m "feat: validate normalized tree graph"
```

## Task 4: Discover The Local PoE2 Install

**Files:**
- Create: `src/extract/errors.ts`
- Create: `src/extract/discovery.ts`
- Create: `src/extract/discovery.test.ts`

- [ ] **Step 1: Write discovery tests**

Create `src/extract/discovery.test.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverPoe2Install } from "./discovery";

describe("discoverPoe2Install", () => {
  it("uses an explicit path when it contains Content.ggpk", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-install-"));
    writeFileSync(join(root, "Content.ggpk"), "");

    const result = discoverPoe2Install({ explicitPath: root, commonPaths: [] });

    expect(result.installPath).toBe(root);
    expect(result.contentGgpkPath).toBe(join(root, "Content.ggpk"));
  });

  it("reads Steam libraryfolders.vdf and finds Path of Exile 2", () => {
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
```

- [ ] **Step 2: Run failing tests**

```powershell
npm test -- src/extract/discovery.test.ts
```

Expected: FAIL because discovery files do not exist.

- [ ] **Step 3: Add extraction errors**

Create `src/extract/errors.ts`:

```ts
export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly code:
      | "install-not-found"
      | "invalid-install-path"
      | "required-data-file-missing"
      | "unsupported-passive-tree-source"
      | "parse-failure",
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}
```

- [ ] **Step 4: Implement discovery**

Create `src/extract/discovery.ts`:

```ts
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
  const candidates = [
    options.explicitPath,
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

  if (options.explicitPath) {
    throw new ExtractionError(`Configured PoE2 path does not contain Content.ggpk: ${options.explicitPath}`, "invalid-install-path");
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
```

- [ ] **Step 5: Run tests and commit**

```powershell
npm test -- src/extract/discovery.test.ts
git add src/extract/errors.ts src/extract/discovery.ts src/extract/discovery.test.ts
git commit -m "feat: discover local PoE2 install"
```

Expected: PASS, then commit succeeds.

## Task 5: Inventory Local Game Data

**Files:**
- Create: `src/extract/inventory.ts`
- Create: `src/extract/inventory.test.ts`

- [ ] **Step 1: Write inventory tests**

Create `src/extract/inventory.test.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inventoryGameData } from "./inventory";

describe("inventoryGameData", () => {
  it("finds Content.ggpk and passive-like files", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-inventory-"));
    mkdirSync(join(root, "Data"), { recursive: true });
    writeFileSync(join(root, "Content.ggpk"), "");
    writeFileSync(join(root, "Data", "passive_skill_trees.json"), "{}");

    const inventory = inventoryGameData(root);

    expect(inventory.contentGgpk.exists).toBe(true);
    expect(inventory.passiveCandidates.map((candidate) => candidate.relativePath)).toContain("Data\\passive_skill_trees.json");
  });
});
```

- [ ] **Step 2: Run failing tests**

```powershell
npm test -- src/extract/inventory.test.ts
```

Expected: FAIL because inventory implementation does not exist.

- [ ] **Step 3: Implement inventory**

Create `src/extract/inventory.ts`:

```ts
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
```

- [ ] **Step 4: Run tests and commit**

```powershell
npm test -- src/extract/inventory.test.ts
git add src/extract/inventory.ts src/extract/inventory.test.ts
git commit -m "feat: inventory local game data"
```

Expected: PASS, then commit succeeds.

## Task 6: Normalize A Passive Tree Payload Into TreeGraph

**Files:**
- Create: `src/extract/normalize.ts`
- Create: `src/extract/normalize.test.ts`

- [ ] **Step 1: Write normalization tests**

Create `src/extract/normalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizePassiveTreePayload } from "./normalize";

describe("normalizePassiveTreePayload", () => {
  it("normalizes an official-json-like passive tree payload", () => {
    const graph = normalizePassiveTreePayload({
      gameVersion: "fixture-version",
      sourcePath: "fixture.json",
      payload: {
        groups: {
          "1": { x: 10, y: 20, n: ["100", "101"] },
        },
        nodes: {
          "100": {
            id: 100,
            g: 1,
            dn: "Start",
            sd: ["Starting point"],
            x: 10,
            y: 20,
            out: ["101"],
            isAscendancyStart: false,
            isMultipleChoice: false,
            isJewelSocket: false,
            isKeystone: false,
            isNotable: false,
            isClassStart: true,
          },
          "101": {
            id: 101,
            g: 1,
            dn: "Critical Strike Chance",
            sd: ["15% increased Critical Hit Chance"],
            x: 90,
            y: 20,
            out: [],
            isJewelSocket: false,
            isKeystone: false,
            isNotable: true,
          },
        },
        classes: { Mercenary: { startNodeId: "100" } },
      },
    });

    expect(graph.nodes["100"].flags.classStart).toBe(true);
    expect(graph.nodes["101"].flags.notable).toBe(true);
    expect(graph.edges).toEqual([{ from: "100", to: "101" }]);
    expect(graph.bounds).toEqual({ minX: 10, maxX: 90, minY: 20, maxY: 20 });
  });
});
```

- [ ] **Step 2: Run failing tests**

```powershell
npm test -- src/extract/normalize.test.ts
```

Expected: FAIL because normalizer does not exist.

- [ ] **Step 3: Implement normalizer**

Create `src/extract/normalize.ts`:

```ts
import type { TreeEdge, TreeGraph, TreeGroup, TreeNode } from "../tree/types";

type RawPayload = {
  groups?: Record<string, { x?: number; y?: number; n?: Array<string | number> }>;
  nodes?: Record<string, Record<string, unknown>>;
  classes?: Record<string, { startNodeId?: string | number }>;
};

export function normalizePassiveTreePayload(input: {
  gameVersion: string;
  sourcePath: string;
  payload: RawPayload;
}): TreeGraph {
  const rawNodes = input.payload.nodes ?? {};
  const nodes: TreeGraph["nodes"] = {};
  const groups: TreeGraph["groups"] = {};
  const edges: TreeEdge[] = [];

  for (const [id, raw] of Object.entries(rawNodes)) {
    const node = normalizeNode(id, raw);
    nodes[node.id] = node;
    for (const linkedId of readLinkedIds(raw)) {
      edges.push({ from: node.id, to: linkedId });
    }
  }

  for (const [id, raw] of Object.entries(input.payload.groups ?? {})) {
    const group: TreeGroup = {
      id,
      position: Number.isFinite(raw.x) && Number.isFinite(raw.y) ? { x: Number(raw.x), y: Number(raw.y) } : undefined,
      nodeIds: (raw.n ?? []).map(String),
    };
    groups[id] = group;
  }

  const classStarts: TreeGraph["classStarts"] = {};
  for (const [className, rawClass] of Object.entries(input.payload.classes ?? {})) {
    if (rawClass.startNodeId !== undefined) classStarts[className] = String(rawClass.startNodeId);
  }

  return {
    schemaVersion: 1,
    gameVersion: input.gameVersion,
    extractedAt: new Date().toISOString(),
    source: { kind: "local-game-data", path: input.sourcePath },
    nodes,
    groups,
    edges: dedupeEdges(edges),
    classStarts,
    bounds: computeBounds(Object.values(nodes)),
  };
}

function normalizeNode(id: string, raw: Record<string, unknown>): TreeNode {
  const groupId = raw.g ?? raw.group;
  const name = raw.dn ?? raw.name;
  const stats = raw.sd ?? raw.stats ?? [];
  return {
    id: String(raw.id ?? raw.skill ?? id),
    groupId: groupId === undefined ? undefined : String(groupId),
    name: typeof name === "string" ? name : undefined,
    stats: Array.isArray(stats) ? stats.map(String) : [],
    position: {
      x: Number(raw.x ?? 0),
      y: Number(raw.y ?? 0),
    },
    flags: {
      classStart: Boolean(raw.isClassStart || raw.type === "ClassStart"),
      attribute: Boolean(raw.isAttribute || raw.type === "Attribute"),
      small: Boolean(raw.type === "Normal"),
      notable: Boolean(raw.isNotable || raw.type === "Notable"),
      keystone: Boolean(raw.isKeystone || raw.type === "Keystone"),
      jewelSocket: Boolean(raw.isJewelSocket || raw.type === "Socket"),
    },
    art: typeof raw.icon === "string" ? { icon: raw.icon } : undefined,
  };
}

function readLinkedIds(raw: Record<string, unknown>): string[] {
  const out = raw.out ?? raw.linkedId ?? raw.connections;
  return Array.isArray(out) ? out.map(String) : [];
}

function dedupeEdges(edges: TreeEdge[]): TreeEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = [edge.from, edge.to].sort().join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function computeBounds(nodes: TreeNode[]): TreeGraph["bounds"] {
  const xs = nodes.map((node) => node.position.x).filter(Number.isFinite);
  const ys = nodes.map((node) => node.position.y).filter(Number.isFinite);
  return {
    minX: Math.min(...xs, 0),
    maxX: Math.max(...xs, 0),
    minY: Math.min(...ys, 0),
    maxY: Math.max(...ys, 0),
  };
}
```

- [ ] **Step 4: Run tests and commit**

```powershell
npm test -- src/extract/normalize.test.ts
git add src/extract/normalize.ts src/extract/normalize.test.ts
git commit -m "feat: normalize passive tree payloads"
```

Expected: PASS, then commit succeeds.

## Task 7: Add Extraction CLI

**Files:**
- Create: `src/extract/cli.ts`

- [ ] **Step 1: Implement CLI commands**

Create `src/extract/cli.ts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { discoverPoe2Install } from "./discovery";
import { ExtractionError } from "./errors";
import { inventoryGameData } from "./inventory";
import { normalizePassiveTreePayload } from "./normalize";
import { validateTreeGraph } from "../tree/validateTreeGraph";

const command = process.argv[2];
const explicitPath = readArg("--install");
const rawPath = readArg("--raw") ?? "var/cache/raw-passive-tree.json";
const graphPath = readArg("--graph") ?? "var/output/tree-graph.json";
const reportPath = readArg("--report") ?? "var/output/validation-report.json";

try {
  if (command === "inventory") {
    const install = discoverPoe2Install({ explicitPath });
    const inventory = inventoryGameData(install.installPath);
    writeJson("var/output/local-data-inventory.json", inventory);
    console.log(`Wrote var/output/local-data-inventory.json`);
  } else if (command === "graph") {
    const install = discoverPoe2Install({ explicitPath });
    const payload = JSON.parse(readFileSync(rawPath, "utf8")) as unknown;
    const graph = normalizePassiveTreePayload({
      gameVersion: install.gameVersion ?? "unknown",
      sourcePath: rawPath,
      payload: payload as Parameters<typeof normalizePassiveTreePayload>[0]["payload"],
    });
    writeJson(graphPath, graph);
    writeJson("public/tree-graph.json", graph);
    console.log(`Wrote ${graphPath} and public/tree-graph.json`);
  } else if (command === "validate") {
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    const report = validateTreeGraph(graph);
    writeJson(reportPath, report);
    console.log(`Wrote ${reportPath}`);
    if (report.issues.length > 0) process.exitCode = 1;
  } else {
    console.error("Usage: tsx src/extract/cli.ts <inventory|graph|validate> [--install PATH] [--raw PATH] [--graph PATH] [--report PATH]");
    process.exitCode = 2;
  }
} catch (error) {
  if (error instanceof ExtractionError) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
```

- [ ] **Step 2: Smoke-test CLI with fixture raw payload**

Create the raw fixture:

```powershell
New-Item -ItemType Directory -Force -Path var/cache | Out-Null
@'
{
  "groups": { "1": { "x": 10, "y": 20, "n": ["100", "101"] } },
  "nodes": {
    "100": { "id": 100, "g": 1, "dn": "Start", "sd": ["Starting point"], "x": 10, "y": 20, "out": ["101"], "isClassStart": true },
    "101": { "id": 101, "g": 1, "dn": "Critical Strike Chance", "sd": ["15% increased Critical Hit Chance"], "x": 90, "y": 20, "out": [], "isNotable": true }
  },
  "classes": { "Mercenary": { "startNodeId": "100" } }
}
'@ | Set-Content -Path var/cache/raw-passive-tree.json
```

Run with an explicit fake install that contains `Content.ggpk`:

```powershell
New-Item -ItemType Directory -Force -Path var/fake-poe2 | Out-Null
New-Item -ItemType File -Force -Path var/fake-poe2/Content.ggpk | Out-Null
npm run extract:graph -- --install var/fake-poe2 --raw var/cache/raw-passive-tree.json
npm run validate:graph -- --graph var/output/tree-graph.json
```

Expected: graph command writes `var/output/tree-graph.json` and `public/tree-graph.json`; validation writes `var/output/validation-report.json`.

- [ ] **Step 3: Commit CLI**

```powershell
git add src/extract/cli.ts
git commit -m "feat: add tree extraction CLI"
```

## Task 8: Build The React App Shell

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Add React entrypoint**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 2: Add application shell**

Create `src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);

  useEffect(() => {
    fetch("/tree-graph.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((loaded: TreeGraph) => setGraph(loaded))
      .catch(() => setGraph(sampleGraph));
  }, []);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>PoE2 Passive Tree Viewer</h1>
          <p>{Object.keys(graph.nodes).length} nodes, {graph.edges.length} links, version {graph.gameVersion}</p>
        </div>
      </header>
      <section className="workspace">
        <div className="viewer-empty-state">Tree viewer loads in Task 10.</div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add base styles**

Create `src/styles.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #10141b;
  color: #eef2f7;
}

button {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid #283241;
  background: #171d27;
}

.top-bar h1 {
  margin: 0;
  font-size: 18px;
}

.top-bar p {
  margin: 4px 0 0;
  color: #aab4c4;
  font-size: 13px;
}

.workspace {
  min-height: 0;
  display: grid;
  place-items: center;
}

.viewer-empty-state {
  color: #aab4c4;
}
```

- [ ] **Step 4: Run build and commit**

```powershell
npm run build
git add src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: add viewer app shell"
```

Expected: build passes, then commit succeeds.

## Task 9: Add SVG Tree View Math

**Files:**
- Create: `src/viewer/treeViewBox.ts`
- Create: `src/viewer/treeViewBox.test.ts`

- [ ] **Step 1: Write viewbox tests**

Create `src/viewer/treeViewBox.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { buildFitViewBox } from "./treeViewBox";

describe("buildFitViewBox", () => {
  it("adds padding around graph bounds", () => {
    expect(buildFitViewBox(sampleGraph.bounds, 20)).toEqual("-20 -60 400 170");
  });
});
```

- [ ] **Step 2: Run failing tests**

```powershell
npm test -- src/viewer/treeViewBox.test.ts
```

Expected: FAIL because implementation does not exist.

- [ ] **Step 3: Implement viewbox helper**

Create `src/viewer/treeViewBox.ts`:

```ts
import type { TreeGraph } from "../tree/types";

export function buildFitViewBox(bounds: TreeGraph["bounds"], padding: number): string {
  const x = bounds.minX - padding;
  const y = bounds.minY - padding;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  return `${x} ${y} ${width} ${height}`;
}
```

- [ ] **Step 4: Run tests and commit**

```powershell
npm test -- src/viewer/treeViewBox.test.ts
git add src/viewer/treeViewBox.ts src/viewer/treeViewBox.test.ts
git commit -m "feat: calculate tree viewer bounds"
```

Expected: PASS, then commit succeeds.

## Task 10: Render Nodes And Links

**Files:**
- Create: `src/viewer/TreeViewer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement SVG viewer**

Create `src/viewer/TreeViewer.tsx`:

```tsx
import type { TreeGraph, TreeNode } from "../tree/types";
import { buildFitViewBox } from "./treeViewBox";

type TreeViewerProps = {
  graph: TreeGraph;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
};

export function TreeViewer({ graph, selectedNodeId, onSelectNode }: TreeViewerProps) {
  return (
    <svg className="tree-svg" viewBox={buildFitViewBox(graph.bounds, 160)} role="img" aria-label="PoE2 passive skill tree">
      <g className="edge-layer">
        {graph.edges.map((edge) => {
          const from = graph.nodes[edge.from];
          const to = graph.nodes[edge.to];
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              className="tree-edge"
              x1={from.position.x}
              y1={from.position.y}
              x2={to.position.x}
              y2={to.position.y}
            />
          );
        })}
      </g>
      <g className="node-layer">
        {Object.values(graph.nodes).map((node) => (
          <ButtonNode
            key={node.id}
            node={node}
            selected={node.id === selectedNodeId}
            onSelectNode={onSelectNode}
          />
        ))}
      </g>
    </svg>
  );
}

function ButtonNode({ node, selected, onSelectNode }: { node: TreeNode; selected: boolean; onSelectNode: (nodeId: string) => void }) {
  const radius = nodeRadius(node);
  return (
    <g className={`tree-node ${nodeClass(node)}${selected ? " selected" : ""}`} transform={`translate(${node.position.x} ${node.position.y})`}>
      <circle r={radius} onClick={() => onSelectNode(node.id)}>
        <title>{node.name ?? node.id}</title>
      </circle>
    </g>
  );
}

function nodeRadius(node: TreeNode): number {
  if (node.flags.classStart) return 26;
  if (node.flags.keystone) return 24;
  if (node.flags.notable) return 18;
  if (node.flags.jewelSocket) return 16;
  return 10;
}

function nodeClass(node: TreeNode): string {
  if (node.flags.classStart) return "class-start";
  if (node.flags.keystone) return "keystone";
  if (node.flags.notable) return "notable";
  if (node.flags.jewelSocket) return "jewel-socket";
  if (node.flags.attribute) return "attribute";
  return "small";
}
```

- [ ] **Step 2: Wire viewer into app**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";
import { TreeViewer } from "./viewer/TreeViewer";

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const selectedNode = useMemo(
    () => (selectedNodeId ? graph.nodes[selectedNodeId] : undefined),
    [graph.nodes, selectedNodeId],
  );

  useEffect(() => {
    fetch("/tree-graph.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((loaded: TreeGraph) => setGraph(loaded))
      .catch(() => setGraph(sampleGraph));
  }, []);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>PoE2 Passive Tree Viewer</h1>
          <p>{Object.keys(graph.nodes).length} nodes, {graph.edges.length} links, version {graph.gameVersion}</p>
        </div>
      </header>
      <section className="workspace">
        <TreeViewer graph={graph} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        <aside className="inspector">
          <h2>{selectedNode?.name ?? "Select a node"}</h2>
          <pre>{selectedNode ? JSON.stringify(selectedNode, null, 2) : "No node selected."}</pre>
        </aside>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add viewer styles**

Append to `src/styles.css`:

```css
.workspace {
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: stretch;
}

.tree-svg {
  width: 100%;
  height: calc(100vh - 65px);
  background: radial-gradient(circle at center, #1a2230 0, #0d1118 68%);
}

.tree-edge {
  stroke: #56657a;
  stroke-width: 5;
  stroke-linecap: round;
}

.tree-node circle {
  cursor: pointer;
  stroke: #111827;
  stroke-width: 4;
}

.tree-node.small circle,
.tree-node.attribute circle {
  fill: #8fa4bb;
}

.tree-node.notable circle {
  fill: #d6b35d;
}

.tree-node.keystone circle {
  fill: #c9704c;
}

.tree-node.jewel-socket circle {
  fill: #6bb6a6;
}

.tree-node.class-start circle {
  fill: #b8c7d8;
}

.tree-node.selected circle {
  stroke: #ffffff;
  stroke-width: 7;
}

.inspector {
  overflow: auto;
  border-left: 1px solid #283241;
  background: #151b24;
  padding: 16px;
}

.inspector h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

.inspector pre {
  white-space: pre-wrap;
  color: #c6d0df;
  font-size: 12px;
}
```

- [ ] **Step 4: Build and commit**

```powershell
npm run build
git add src/viewer/TreeViewer.tsx src/App.tsx src/styles.css
git commit -m "feat: render structural passive tree"
```

Expected: build passes and the fixture graph renders.

## Task 11: Add Pan, Zoom, And Fit Reset

**Files:**
- Modify: `src/viewer/TreeViewer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add controlled pan and zoom state**

Update `TreeViewer.tsx` imports:

```tsx
import { useRef, useState } from "react";
```

Add transform state and drag tracking inside `TreeViewer`:

```tsx
const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
const lastPointer = useRef<{ x: number; y: number } | null>(null);
```

Wheel handler:

```tsx
function handleWheel(event: React.WheelEvent<SVGSVGElement>) {
  event.preventDefault();
  const nextScale = Math.min(4, Math.max(0.2, transform.scale * (event.deltaY > 0 ? 0.9 : 1.1)));
  setTransform((current) => ({ ...current, scale: nextScale }));
}
```

Pointer handlers:

```tsx
function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
  event.currentTarget.setPointerCapture(event.pointerId);
  lastPointer.current = { x: event.clientX, y: event.clientY };
}

function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
  if (!lastPointer.current) return;
  const dx = event.clientX - lastPointer.current.x;
  const dy = event.clientY - lastPointer.current.y;
  lastPointer.current = { x: event.clientX, y: event.clientY };
  setTransform((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
}

function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
  event.currentTarget.releasePointerCapture(event.pointerId);
  lastPointer.current = null;
}
```

Attach handlers to the `<svg>`:

```tsx
<svg
  className="tree-svg"
  viewBox={buildFitViewBox(graph.bounds, 160)}
  role="img"
  aria-label="PoE2 passive skill tree"
  onWheel={handleWheel}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
>
```

Render layer transform:

```tsx
<g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
  {/* edge and node layers */}
</g>
```

- [ ] **Step 2: Add reset button**

Wrap the SVG in `TreeViewer.tsx` with a positioned container:

```tsx
return (
  <div className="tree-viewer">
    <button className="tool-button reset-view-button" type="button" onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}>
      Reset View
    </button>
    <svg
      className="tree-svg"
      viewBox={buildFitViewBox(graph.bounds, 160)}
      role="img"
      aria-label="PoE2 passive skill tree"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* existing layers */}
    </svg>
  </div>
);
```

Add styles:

```css
.tree-viewer {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.reset-view-button {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
}
```

- [ ] **Step 3: Verify interaction manually**

Run:

```powershell
npm run dev
```

Open the printed local URL in the browser. Expected: wheel zoom changes tree scale; reset returns scale to 1.

- [ ] **Step 4: Commit pan/zoom**

```powershell
git add src/viewer/TreeViewer.tsx src/App.tsx src/styles.css
git commit -m "feat: add tree pan and zoom controls"
```

## Task 12: Add Node Inspector And Debug Controls

**Files:**
- Create: `src/viewer/NodeInspector.tsx`
- Create: `src/viewer/DebugControls.tsx`
- Modify: `src/App.tsx`
- Modify: `src/viewer/TreeViewer.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Extract inspector component**

Create `src/viewer/NodeInspector.tsx`:

```tsx
import type { TreeEdge, TreeNode } from "../tree/types";

export function NodeInspector({ node, edges }: { node?: TreeNode; edges: TreeEdge[] }) {
  if (!node) {
    return (
      <aside className="inspector">
        <h2>Select a node</h2>
        <p>No node selected.</p>
      </aside>
    );
  }

  const connected = edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .map((edge) => (edge.from === node.id ? edge.to : edge.from));

  return (
    <aside className="inspector">
      <h2>{node.name ?? node.id}</h2>
      <dl>
        <dt>ID</dt><dd>{node.id}</dd>
        <dt>Group</dt><dd>{node.groupId ?? "none"}</dd>
        <dt>Position</dt><dd>{node.position.x}, {node.position.y}</dd>
        <dt>Connected</dt><dd>{connected.join(", ") || "none"}</dd>
      </dl>
      <h3>Stats</h3>
      <ul>{node.stats.map((stat) => <li key={stat}>{stat}</li>)}</ul>
      <h3>Flags</h3>
      <pre>{JSON.stringify(node.flags, null, 2)}</pre>
    </aside>
  );
}
```

- [ ] **Step 2: Add debug controls**

Create `src/viewer/DebugControls.tsx`:

```tsx
export type DebugOverlayState = {
  showNodeIds: boolean;
  highlightMissingStats: boolean;
  highlightOrphans: boolean;
};

export function DebugControls({
  value,
  onChange,
}: {
  value: DebugOverlayState;
  onChange: (next: DebugOverlayState) => void;
}) {
  return (
    <div className="debug-controls">
      <label><input type="checkbox" checked={value.showNodeIds} onChange={(event) => onChange({ ...value, showNodeIds: event.currentTarget.checked })} /> Node IDs</label>
      <label><input type="checkbox" checked={value.highlightMissingStats} onChange={(event) => onChange({ ...value, highlightMissingStats: event.currentTarget.checked })} /> Missing stats</label>
      <label><input type="checkbox" checked={value.highlightOrphans} onChange={(event) => onChange({ ...value, highlightOrphans: event.currentTarget.checked })} /> Orphans</label>
    </div>
  );
}
```

- [ ] **Step 3: Wire inspector and controls**

Update `App.tsx` to use:

```tsx
import { DebugControls, type DebugOverlayState } from "./viewer/DebugControls";
import { NodeInspector } from "./viewer/NodeInspector";
```

Add state:

```tsx
const [debug, setDebug] = useState<DebugOverlayState>({
  showNodeIds: false,
  highlightMissingStats: false,
  highlightOrphans: false,
});
```

Render controls in the top bar and pass `debug` to `TreeViewer`:

```tsx
<DebugControls value={debug} onChange={setDebug} />
<TreeViewer graph={graph} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} debug={debug} />
<NodeInspector node={selectedNode} edges={graph.edges} />
```

- [ ] **Step 4: Render debug overlays**

Update `TreeViewerProps` with:

```ts
debug: DebugOverlayState;
```

Import:

```ts
import type { DebugOverlayState } from "./DebugControls";
```

Inside each node group, render ID text when enabled:

```tsx
{debug.showNodeIds ? <text className="node-id-label" y={-radius - 8}>{node.id}</text> : null}
```

Add conditional class names:

```tsx
const missingStats = debug.highlightMissingStats && node.stats.length === 0 && !node.flags.jewelSocket && !node.flags.classStart;
```

Add `missing-stats` to the class list when `missingStats` is true.

- [ ] **Step 5: Add styles and commit**

Append:

```css
.debug-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #c6d0df;
  font-size: 13px;
}

.tool-button {
  border: 1px solid #3a4658;
  background: #202938;
  color: #eef2f7;
  border-radius: 6px;
  padding: 6px 10px;
}

.node-id-label {
  fill: #e5edf7;
  font-size: 11px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #0d1118;
  stroke-width: 4;
}

.tree-node.missing-stats circle {
  stroke: #ff4d4d;
}

.inspector dl {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 6px 10px;
}

.inspector dt {
  color: #8fa4bb;
}

.inspector dd {
  margin: 0;
}
```

Run:

```powershell
npm run build
git add src/viewer/NodeInspector.tsx src/viewer/DebugControls.tsx src/viewer/TreeViewer.tsx src/App.tsx src/styles.css
git commit -m "feat: inspect tree nodes and debug overlays"
```

Expected: build passes and controls render.

## Task 13: Run The Local Data Pipeline

**Files:**
- Generated only: `var/output/local-data-inventory.json`, `var/cache/raw-passive-tree.json`, `var/output/tree-graph.json`, `var/output/validation-report.json`, `public/tree-graph.json`
- Possibly modify: `src/extract/normalize.ts` if the real local payload uses field names not covered by Task 6.

- [ ] **Step 1: Inventory the real install**

Run:

```powershell
npm run extract:inventory
```

Expected: either `var/output/local-data-inventory.json` is written, or the CLI prints a clear `install-not-found` error.

If auto-discovery fails, rerun with the install path:

```powershell
npm run extract:inventory -- --install "C:\Program Files (x86)\Steam\steamapps\common\Path of Exile 2"
```

- [ ] **Step 2: Identify the passive payload route**

Open `var/output/local-data-inventory.json`.

Use this decision table:

```text
If a JSON/Lua/PSG passive tree candidate exists outside Content.ggpk:
  copy it to var/cache/raw-passive-tree.json after converting to JSON if needed.

If only Content.ggpk / bundle archives exist:
  use a local extraction tool to export passive_skill_trees data into var/cache/raw-passive-tree.json.
  Prefer a tool that reads the local install and emits JSON without copying game assets into this repo.

If no passive-related candidate can be found:
  stop implementation and document the inventory in docs/research/local-data-inventory.md before changing the extractor.
```

- [ ] **Step 3: Export local passive data**

If `pathofexile-dat` supports the local PoE2 install in this environment, run it outside tracked source using a temporary config in `var/pathofexile-dat/config.json`.

Config shape:

```json
{
  "steam": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2",
  "tables": [
    { "name": "PassiveSkillTrees" },
    { "name": "PassiveSkills" },
    { "name": "PassiveSkillGraph" }
  ],
  "translations": ["English"]
}
```

Run:

```powershell
New-Item -ItemType Directory -Force -Path var/pathofexile-dat | Out-Null
Push-Location var/pathofexile-dat
npx pathofexile-dat
Pop-Location
```

Expected: exported JSON or an explicit unsupported-table message. If table names differ, inspect the exported table list and update only the temporary config, not committed source.

- [ ] **Step 4: Normalize and validate**

Once `var/cache/raw-passive-tree.json` exists:

```powershell
npm run extract:graph -- --raw var/cache/raw-passive-tree.json
npm run validate:graph -- --graph var/output/tree-graph.json
```

Expected: `public/tree-graph.json` is written and validation report is generated. If validation fails, open `var/output/validation-report.json` and fix field mapping in `src/extract/normalize.ts`.

- [ ] **Step 5: Commit normalizer adjustments only**

If `src/extract/normalize.ts` changed:

```powershell
npm test -- src/extract/normalize.test.ts src/tree/validateTreeGraph.test.ts
npm run build
git add src/extract/normalize.ts src/extract/normalize.test.ts
git commit -m "fix: map local passive tree data fields"
```

Do not commit `var/` or `public/tree-graph.json`.

## Task 14: Verify The Viewer End-To-End

**Files:**
- Modify source only if verification finds issues.

- [ ] **Step 1: Run all checks**

```powershell
npm test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 2: Start dev server**

```powershell
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Browser verification**

Open the dev server URL. Verify:

- Full graph or fixture graph renders.
- Links connect visible nodes.
- Node categories have distinct styling.
- Clicking a node updates the inspector.
- Debug toggles work.
- Pan/zoom and reset work.
- The page has no obvious text overlap at desktop width.

- [ ] **Step 4: Fix issues found during browser verification**

For each issue, make the smallest source change, then rerun:

```powershell
npm test
npm run build
```

- [ ] **Step 5: Final commit**

```powershell
git status --short
git add src public/sample-tree-graph.json package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts index.html .gitignore
git commit -m "feat: build structural PoE2 passive tree viewer"
```

Expected: commit succeeds. If there are no uncommitted source changes because prior task commits covered everything, do not create an empty commit.

## Self-Review Checklist

- Spec coverage:
  - Local install discovery: Task 4.
  - Game data inventory and extraction path: Tasks 5, 7, 13.
  - Normalized graph schema: Task 2.
  - Validation report: Tasks 3 and 7.
  - Structural SVG viewer: Tasks 8 through 12.
  - Main passive tree only: all tasks avoid Ascendancy implementation.
  - PoB/poe.ninja as references only: source references are documentation; app data path remains local.

- Red-flag scan:
  - No unresolved marker strings or incomplete steps.
  - The extraction unknown is handled as an explicit inventory/export gate in Task 13 with concrete commands and stop conditions.

- Type consistency:
  - `TreeGraph`, `TreeNode`, `TreeGroup`, and `TreeEdge` names are consistent across types, validator, normalizer, CLI, and viewer tasks.
  - CLI paths are consistent with `.gitignore`.
