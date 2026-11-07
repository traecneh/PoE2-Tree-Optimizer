# PoE2 0.5.5f Tree Data Refresh

Refreshed November 6, 2026 from the installed Steam game. The opening lines of
`logs/LatestClient.txt` identify `poe2_production/tags/0.5.5f`; the installed Steam
build is `26476662`.

## Sources and Comparison

The canonical source is the local game's PSG, balance tables, stat description
files, and DDS icons. Path of Building's `src/TreeData/0_5/tree.json` is used only
to compare granted-skill names and effect text, not to supply the deployed graph
or descriptions.

Compared with the previous 0.5.0 snapshot:

| Item | Previous | Refreshed |
| --- | ---: | ---: |
| Nodes | 4,720 | 4,762 |
| Connections | 5,380 | 5,426 |
| Groups | 1,473 | 1,515 |
| Root start positions | 6 | 6 |

- 42 added node IDs and no removed node IDs.
- 8 renamed nodes, 707 updated description arrays, and 126 changed node positions.
- 52 added connections, 6 removed connections, and 8 changed curve-orbit values.
- Removed mastery icon artifacts remain excluded.
- Existing node IDs and all six start IDs are preserved. Saved paths should still
  be reviewed because some connections changed.

The description changes include corrections to the extractor, as well as game
changes. `PassiveSkills.GrantedSkill` references `SkillGems`, which resolves
through `GemEffects` to `GrantedEffects`. Treating it as a direct granted-effect
index gave unrelated skill descriptions. Skill names come from the gem's
`BaseItemTypes` row, including names for command skills whose active-skill display
name is only `Command: {0}`. Internal additional granted effects are not exposed
as separate passive descriptions. All granted-skill labels present in both graphs
match the PoB reference (54 compared labels).

Passive descriptions now take precedence over generic and supported-skill
descriptions when formatting passive effects. Granted skills keep their own
description context. Both numbered and unnumbered value placeholders are
supported. After normalizing line breaks, 4,070 of 4,075 comparable main-tree
nodes contain all of PoB's reference stat lines, up from 3,422; no previously
matching nodes lost a match. The remaining differences include bullet formatting
and three critical-damage fallback labels.

Grouped description formatting now resolves each placeholder from its matching
stat ID. Minimum/maximum damage is rendered once, even when the source stats are
reordered or separated. This fixes both added-Lightning-damage nodes and Innate
Rune, as well as seven multi-value ascendancy descriptions. Numeric conditions
and conversions are evaluated for each value. Missing description flags default
to zero for rule selection, but missing displayed numbers remain unknown rather
than being invented. The normalizer preserves individual-stat fallback output
when a complete description cannot be rendered.

Current passive rows can contain seven stat values; the extractor now preserves
all seven. The header displays the version from the loaded graph rather than a
separate hardcoded version.

All 524 passive icons were re-exported from the current game files: 3 are new,
1 changed, and 520 are byte-for-byte unchanged. Existing viewer-specific start
icons are retained alongside the exported icons.

## Verification

- 291 tests pass across 43 test files; TypeScript and the production build pass.
- The published graph validation reports no issues for the 0.5.5f snapshot.
- All referenced icon assets exist.
- Browser smoke checks confirm the loaded version, Pyromancer search, a 19-point
  optimized route and apply, and Chronomancer's correct Time Snap details.
- Oracle gating, exact-phrase damage-range search, Innate Rune's combined
  Lightning damage range, and Sanguine Tides' three-value effect display correctly.
- Browser console inspection found no application exceptions; the existing
  missing `favicon.ico` request remains outside this data refresh.

## Repeat the Extraction

Requires Node.js 22 or newer and a patched game installation. Steam installations
can be read from `Bundles2/_.index.bin` without `Content.ggpk`. Install detection
supports both layouts. The extractor reads game files without modifying them.

1. Create an ignored export directory and copy
   `tools/passive-tree-export.config.json` into it as `config.json`. Adjust the
   `steam` path in that copy if needed.
2. Run `npx --yes pathofexile-dat@16.0.1` in the export directory.
3. From the repo root, run the following command, substituting the directory and
   version if refreshing a later patch:

```powershell
npm run extract:graph -- --game-version 0.5.5f --graph var/refresh-0.5.5f/tree-graph.json --psg var/refresh-0.5.5f/files/metadata@passiveskillgraph.psg --skills var/refresh-0.5.5f/tables/English/PassiveSkills.json --stats var/refresh-0.5.5f/tables/English/Stats.json --stat-descriptions var/refresh-0.5.5f/files/Data@StatDescriptions@stat_descriptions.csd --stat-descriptions var/refresh-0.5.5f/files/Data@StatDescriptions@passive_skill_stat_descriptions.csd --stat-descriptions var/refresh-0.5.5f/files/Data@StatDescriptions@gem_stat_descriptions.csd --stat-descriptions var/refresh-0.5.5f/files/Data@StatDescriptions@active_skill_gem_stat_descriptions.csd --stat-descriptions var/refresh-0.5.5f/files/Data@StatDescriptions@skill_stat_descriptions.csd
npm run extract:icons -- --graph var/refresh-0.5.5f/tree-graph.json --assets var/refresh-0.5.5f/tree-assets --workdir var/refresh-0.5.5f/icon-export
```

Validate the fresh graph explicitly before replacing the tracked snapshot:

```powershell
npm run validate:graph -- --graph var/refresh-0.5.5f/tree-graph.json --report var/refresh-0.5.5f/validation-report.json
```

After reviewing the comparison and icons, copy the graph to `data/tree-graph.json`
and the regenerated icons and manifest into `data/tree-assets/`. Preserve any
existing viewer-specific start icons that are not in the exported manifest.
`npm run prepare-data` mirrors tracked deploy data into `public/`, so promoting
the snapshot must happen before running the complete test/build workflow.

Run `npm test`, `npm run build`, and `npm run validate:graph` sequentially, then
verify the tree, a new notable, allocation, search, and ascendancy details in a
browser. Raw exported tables, the PoB reference, and temporary output stay under
ignored `var/`; only the normalized deploy data and PNG assets are published.
