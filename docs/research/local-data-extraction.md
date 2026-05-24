# Local PoE2 Passive Tree Extraction

Date: 2026-05-24

## Result

The main passive tree can be extracted from the local Path of Exile 2 install without using PoB as the source of truth.

Detected install:

```text
C:\Program Files (x86)\Steam\steamapps\common\Path of Exile 2
```

Generated normalized graph:

```text
nodes: 4975
edges: 5888
groups: 1497
class starts: 6
missing coordinates: 0
dangling edges: 0
orphan nodes: 0
statless nodes: 648
```

The statless nodes are currently treated as warnings because the local game data includes mastery placeholders, unused rows, and class/ascendancy support nodes with no direct stat rows. Structural graph errors remain fatal.

## Source Files

The extracted graph uses:

```text
metadata/passiveskillgraph.psg
data/balance/passiveskills.datc64
```

`PassiveSkillTrees.datc64` identifies the default tree graph path as `Metadata/PassiveSkillGraph`. The bundle index path listing shows the concrete asset as `metadata/passiveskillgraph.psg`.

## Export Command

Use `pathofexile-dat` from the ignored working directory `var/pathofexile-dat`. Save this JSON as `var/pathofexile-dat/config.json`.

```json
{
  "steam": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2",
  "tables": [
    {
      "name": "PassiveSkillTrees",
      "columns": ["Id", "Name", "UIArt", "PassiveSkillGraph"]
    },
    {
      "name": "PassiveSkills",
      "columns": [
        "Id",
        "Name",
        "Icon_DDSFile",
        "Stats",
        "Stat1Value",
        "Stat2Value",
        "Stat3Value",
        "Stat4Value",
        "Stat5Value",
        "PassiveSkillGraphId",
        "Characters",
        "IsKeystone",
        "IsNotable",
        "IsJewelSocket",
        "IsAscendancyStartingNode",
        "IsAttribute",
        "NodeFrameArt"
      ]
    }
  ],
  "translations": ["English"],
  "files": [
    "metadata/passiveskillgraph.psg",
    "metadata/passiveskillgraphguidesettings.json"
  ]
}
```

Then run:

```powershell
Set-Location var/pathofexile-dat
npx --yes pathofexile-dat
Set-Location ..\..
npm run extract:graph -- --psg "var/pathofexile-dat/files/metadata@passiveskillgraph.psg" --skills "var/pathofexile-dat/tables/English/PassiveSkills.json"
npm run validate:graph
```

The extractor writes `var/output/tree-graph.json` and `public/tree-graph.json`.

## PSG Format Notes

The exported PSG is a little-endian version 3 binary graph:

```text
u8 version
u8 type
u8 orbitCount
u8 orbits[orbitCount]
u32 rootNodeCount
root nodes: u32 id + 4 bytes padding
u32 nodeGroupCount
groups:
  f32 x
  f32 y
  u32 groupAssociationKey
  u32 groupBackgroundOverride
  u8 isJewelPositionReference
  u32 nodeCount
  nodes:
    u32 id
    u32 orbit
    u32 orbitIndex
    u32 connectionCount
    connections:
      u32 nodeId
      i32 orbit
```

The PSG stores orbit indices and orbit slot counts, but not the actual orbit radii used to place nodes around a group. The current implementation uses the community-validated PoE2 radii from the public parser discussion as a starting point:

```text
[0, 82, 162, 335, 493, 662, 846, 249, 1020, 1200]
```

References:

- Reddit discussion: https://www.reddit.com/r/pathofexiledev/comments/1hwob4b/passive_skill_tree_psg_file_format/
- Parser gist: https://gist.github.com/jrobinson3k1/b4bcc6154402987dd46e9a9c3b30f30f
