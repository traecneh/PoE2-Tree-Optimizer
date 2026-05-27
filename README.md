# PoE2 Tree Optimizer

A local-first Path of Exile 2 passive tree viewer and route optimizer. The tool can load the main passive tree, choose a class or ascendancy start, allocate routes, import Path of Building codes as build goals, summarize allocated passive stats, and optimize shortest routes to selected goal nodes.

## Current Status

This is an experimental fan tool. It is not affiliated with or endorsed by Grinding Gear Games.

The repository includes preprocessed passive tree data and icon assets so the app can be deployed as a static GitHub Pages site. The source app is MIT licensed; Path of Exile 2 names, icons, passive tree data, and related game assets belong to Grinding Gear Games.

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
