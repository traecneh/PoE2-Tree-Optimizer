# PoE2 Tree Optimizer

A local-first Path of Exile 2 passive tree viewer and route optimizer. The tool can load the main passive tree, choose a class or ascendancy start, allocate routes, import Path of Building codes as build goals, summarize allocated passive stats, and optimize shortest routes to selected goal nodes.

## Current Status

This is an experimental fan tool. It is not affiliated with or endorsed by Grinding Gear Games.

The repository includes preprocessed passive tree data and icon assets so the app can be deployed as a static GitHub Pages site. The source app is MIT licensed; Path of Exile 2 names, icons, passive tree data, and related game assets belong to Grinding Gear Games.

Bundled tree data: **PoE2 0.5.5f**, refreshed from the local Steam installation on November 6, 2026. See [the refresh notes](docs/research/2026-11-06-tree-data-refresh.md) for the comparison and repeatable extraction steps. Tree data is bundled with each deployment; it does not update automatically.

## Local Setup

```bash
npm ci
npm run dev
```

The dev server runs Vite and opens the app at the local URL printed in the terminal.

## Verification

```bash
npm test
npm run build
npm run validate:graph
```

`npm run prepare-data` copies tracked deploy data from `data/` into `public/`. It is run automatically before `dev`, `test`, `build`, and `validate:graph`.

Extraction CLI tests run in separate temporary working folders, including their
generated preview data and reports. They check that the repository's tree data
and icon manifests remain unchanged and remove their temporary folders afterward.

The optional [PoB evaluation experiment](tools/pob-evaluation/README.md) tests
whole-route calculations and independent arithmetic checks offline. It is not
part of the deployed website; see [the investigation](docs/research/2026-11-06-pob-calculation-integration.md).

## Route Objectives

The default **Shortest** mode retains the existing point-minimizing search.
**Passive preferences** is a separate heuristic objective. Select explicit effects
(for example Energy Shield, Attributes, Minion Damage or Life), choose Normal / High /
Highest priorities, and set an extra-point budget. The optimizer first finds a
shortest baseline, then searches alternate paths and optional branches while
keeping all required goals and the current visible allocation. New nodes are
counted and scored once; base nodes are free and are not rewarded again.

With **Extra points**, the cap is the baseline's added-node cost plus the extra-point
budget. The minus/plus controls adjust that allowance; zero still permits equal-cost
alternatives. **Use all available (123 total)** instead caps the completed tree at
123 character points, subtracting current main allocations and reserving the larger
weapon-set allocation. Ascendancy points are separate. It spends remaining points
on beneficial matching branches, without padding the route with unrelated nodes;
points can remain unused if no useful branch fits. Required goals that exceed the
remaining budget are reported without applying a partial route. These settings
are included in saved/exported builds.

For large goal sets, the shortest baseline found is not guaranteed
globally optimal. Weighted search stops after 60 seconds without a better score
(ties prefer fewer points); Cancel and Apply can stop it sooner. Candidates include
the shortest baseline for comparison.

Only supported, unconditional stat lines receive scores. The effect tooltip gives
the normalization unit; High and Highest multiply it by two and three. Conditional
effects, skills, gear, conversions and other interactions are not modeled. Inspect
the full route effects before applying. This mode does **not** calculate PoB Full
DPS, effective hit pool, or overall build power.

## GitHub Pages

This repo is prepared for GitHub Pages at:

```text
https://traecneh.github.io/PoE2-Tree-Optimizer/
```

The Pages workflow is in `.github/workflows/pages.yml`. On pushes to `main`, it installs dependencies, runs tests, builds the Vite app, and deploys `dist/`.

Manual GitHub setup:

1. Push the repository to GitHub.
2. Open the GitHub repository settings.
3. Go to `Pages`.
4. Set `Build and deployment` source to `GitHub Actions`.
5. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

If the repository name changes, set `VITE_BASE_PATH` during build or update the default base in `vite.config.ts`.

## Data Layout

Tracked deploy data:

```text
data/tree-graph.json
data/tree-assets/
```

Generated public data:

```text
public/tree-graph.json
public/tree-assets/
```

The generated public files are ignored so they can be refreshed locally without duplicate source-of-truth churn.
