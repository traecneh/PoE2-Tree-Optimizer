# PoE2 Main Passive Tree Viewer Design

Date: 2026-05-24

## Goal

Build the first milestone for the PoE2 Skill Tree Optimizer: a high-fidelity structural viewer for the main Path of Exile 2 passive tree.

The viewer exists to prove that we can reconstruct the real tree layout from the user's local PoE2 game data. Optimization, build scoring, point allocation, and Ascendancy trees are out of scope for this milestone.

## Decisions

- Use local PoE2 game data as the canonical source of truth.
- Use Path of Building PoE2 and poe.ninja only as validation references.
- Prioritize structural visual accuracy first: correct nodes, groups, links, coordinates, class starts, notables, keystones, jewel sockets, and pan/zoom.
- Defer visual polish until after the structural tree is trustworthy.
- Scope milestone 1 to the main passive tree only.

References:

- Path of Building PoE2: https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2
- poe.ninja PoE2: https://poe.ninja/poe2/
- PoE2 passive tree wiki and version history: https://www.poe2wiki.net/wiki/Passive_skill_tree

## Architecture

The milestone has four pieces with clear boundaries.

### Local Data Discovery

The app finds the local Path of Exile 2 install and identifies the data files needed for passive tree extraction. If auto-discovery fails, the user can provide an install path manually.

Expected responsibilities:

- Detect common install locations.
- Accept a configured install path.
- Report missing or unreadable data paths clearly.
- Record the discovered game version when available.

### Tree Extractor

The extractor reads local game data and extracts the main passive tree into a raw intermediate artifact.

Expected data:

- Passive nodes
- Passive groups
- Node links
- Node coordinates or layout parameters
- Node names
- Stat lines
- Node type flags
- Class start nodes
- Jewel socket markers
- Keystone and notable markers
- Any icon or art keys exposed by the data

The raw artifact should be cacheable for debugging so large data files do not need to be reparsed for every renderer change.

### Normalized Graph Schema

The normalized graph is the stable contract between extraction, viewing, validation, and future optimization. The viewer must load this graph rather than parsing game files directly.

Initial schema shape:

```ts
type TreeGraph = {
  gameVersion: string;
  extractedAt: string;
  source: {
    kind: "local-game-data";
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

type TreeNode = {
  id: NodeId;
  groupId?: GroupId;
  name?: string;
  stats: string[];
  position: { x: number; y: number };
  flags: {
    classStart?: boolean;
    attribute?: boolean;
    small?: boolean;
    notable?: boolean;
    keystone?: boolean;
    jewelSocket?: boolean;
  };
  art?: {
    icon?: string;
    assetKey?: string;
  };
};

type TreeGroup = {
  id: GroupId;
  position?: { x: number; y: number };
  nodeIds: NodeId[];
};

type TreeEdge = {
  from: NodeId;
  to: NodeId;
};
```

The schema should be versioned before it is consumed by more than one tool.

### Structural Viewer

The first viewer renders the normalized graph and helps identify extraction/layout mistakes.

Required behavior:

- Render all main passive tree nodes.
- Render all node connections.
- Support pan, zoom, and fit-to-tree.
- Style basic node categories differently:
  - class start
  - attribute/travel
  - small passive
  - notable
  - keystone
  - jewel socket
- Show node inspection details on hover or click:
  - node ID
  - name
  - flags
  - stat lines
  - connected node IDs
  - group ID
  - coordinates
- Provide validation/debug overlays:
  - orphan nodes
  - dangling links
  - missing stats
  - missing or suspicious coordinates
  - node ID labels

SVG is the preferred first renderer because it makes node/link inspection and interaction straightforward. If performance is unacceptable for the full tree, the renderer can later move heavy layers to canvas while keeping the same graph contract.

## Data Flow

1. Discover the local PoE2 install path.
2. Extract the raw main passive tree data.
3. Cache the raw extraction artifact.
4. Normalize raw data into `TreeGraph`.
5. Validate the graph and produce a report.
6. Load the graph JSON in the viewer.
7. Visually inspect the rendered tree against in-game expectations and reference tools.

The renderer and future optimizer must not depend on PoB, poe.ninja, or raw game file formats.

## Validation

Every extraction run should produce both machine-readable and human-readable validation output.

Validation metrics:

- game version
- extraction timestamp
- node count
- edge count
- group count
- class start count
- missing coordinate count
- missing stat count
- dangling edge count
- orphan node count
- duplicate node ID count
- graph bounds

Validation failures should be visible in the viewer where possible.

## Error Handling

Failures should be explicit and inspectable.

Expected error classes:

- PoE2 install not found
- configured install path invalid
- required data file missing
- data file unreadable
- unsupported game version
- passive tree format not recognized
- parse failure
- partial extraction with validation errors

If partial extraction succeeds but geometry or links are incomplete, the tool should keep the raw artifact and validation report rather than silently rendering a misleading tree.

## Acceptance Criteria

Milestone 1 is complete when:

- The app can discover or accept a local PoE2 install path.
- The extractor can produce a normalized graph for the main passive tree.
- The graph includes nodes, links, groups, node stats, node positions, class starts, notables, keystones, and jewel sockets where present in the data.
- The validator reports structural issues clearly.
- The viewer renders the full main passive tree with pan, zoom, and fit-to-tree.
- Clicking or hovering a node exposes enough metadata to debug extraction issues.
- Debug overlays make missing or suspicious data visible.
- The extraction/viewer flow can be rerun reproducibly after a game update.

## Deferred Work

- Build optimization and scoring
- Point allocation and path validity
- Import/export of builds
- Ascendancy trees
- Weapon set point handling
- Jewel radius and transformed passives
- Full game-like visual skin
- PoB or poe.ninja automated diffing
- Performance tuning beyond what is needed for the structural viewer

## Implementation Notes

The first implementation plan should start with a repository scaffold, game data discovery, and an exploratory extractor. Once the extractor can produce even a small verified slice, the viewer should render that slice before expanding to the full tree.

The project should avoid committing local game data or temporary visual companion files. Sanitized fixtures may be created later for tests if they do not include copyrighted game assets or large extracted payloads.
