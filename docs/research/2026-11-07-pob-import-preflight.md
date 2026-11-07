# Import Compatibility Preflight

Implemented November 7, 2026, for the offline PoB audit workflow. No website import
behaviour, manual routing, or saved build was changed. This follows the
[weapon-set/recovery experiment](2026-11-07-pob-weapon-set-recovery-audit.md).

## Purpose

Explain allocation and coverage limitations before generating or performance-ranking
candidate routes. An unsupported import is not necessarily invalid in-game or in
PoB: it may need allocation rules that our single-root shared-tree model does not
represent yet. The preflight never solves that mismatch by inventing connections,
dropping goals, or treating every item-granted notable as a purchased passive.

The new `import_preflight.mjs` uses the existing app class/start mapping, tree
visibility, and allocatable-edge traversal. `preflight_import.mjs` exposes a
standalone inspection command for PoB codes or captured XML. No network request or
native calculator is needed for the static inspection.

## Checked Context

- The explicitly selected tree, equipment set, skill set, and configuration set.
- Known and missing allocated IDs, expected class root, and explicit ascendancy.
- Original shared-tree connectivity and reachability without reserved weapon nodes.
- W1/W2 declarations and separate per-set connectivity without borrowing the other set.
- Referenced equipment in the active item set, including both weapon loadouts, plus
  jewels bound to the selected tree's sockets. Inactive inventory records and other
  saved item sets are not scanned as equipped items.
- Known alternate/disconnected allocation, generated-socket and passive-replacement
  items; matching modifier text in referenced items, allocated passives, and active
  custom modifiers; non-attribute overrides and secondary ascendancies.
- Item-granted notables, distinguishing names absent from the serialized paid tree
  from ambiguous grants also serialized as allocated nodes.

The catalog explicitly includes From Nothing, Controlled Metamorphosis, Split
Personality, Voices, Heroic Tragedy, and Undying Hate. Names/modifier patterns were
checked against the copied PoB 0.23.1 unique-jewel data and modifier parser. This is
a bounded catalog, not a complete semantic parser or an assertion that every other
mechanic is supported.

Two export details matter: build-format `targetVersion="0_1"` is separate from
passive-tree `treeVersion="0_5"`, and `secondaryAscendClassId="nil"` is an absent
secondary selection in these exports, not an active second ascendancy.

## Results

| Captured build | Static result | Important explanation |
| --- | --- | --- |
| Public Spark Stormweaver | Ready for audit, 2 warnings | Custom modifiers retained; ordinary item grants remain outside paid routing goals; general coverage remains limited. |
| Public Warbringer | Ready for audit, 2 warnings | An amulet grants Thaumaturgic Generator, which is not uniquely found in the game graph; selected-skill damage is used because no enabled Full DPS groups are selected. |
| Public Titan | Blocked before optimization | Active From Nothing allocation is unsupported; 8 shared nodes are disconnected in the serialized shared tree, Stormkeeper cannot be routed with weapon nodes reserved, and W1 Splitting Ground lacks an ordinary per-set connection. |

The report includes concrete node names and IDs. It does not claim that From
Nothing accounts for every disconnected node: it reports the known item rule and
the observed topology separately. The Titan source was not edited, no goals were
dropped, no candidate manifest was produced, and its ranking is explicitly empty.

The Warbringer warning does not prove PoB ignores Thaumaturgic Generator. It means
our game-graph lookup does not establish that grant's identity/effect. It stays in
the original item context and is not silently turned into a paid goal. An ordinary
known anoint or Megalomaniac grant outside the serialized paid allocation is
informational; a grant overlapping serialized paid nodes blocks cost assumptions.

`ready_for_audit` is deliberately not called "fully compatible." It means only
that the current static checks found no known allocation blocker. The report always
lists unverified coverage, including every modifier, general damage/EHP accuracy,
and full rotation/leech/recoup/flask sustain. Native PoB support of all effects is
not certified by an item-name or topology lookup.

## Workflow Guards

1. Preparation saves `import-preflight.json` before entering route generation.
   Unsupported/malformed imports stop with explanations.
2. The real-build runner refuses blocked/missing evidence before loading LuaJIT.
   The report must match source XML, graph version, requested profile, and
   preparation metadata. This is not a security sandbox for untrusted code.
3. Requirement comparisons rerun the static inspection against the captured source
   and current graph. The pure evaluator also requires source/graph-bound preflight
   evidence before it can rank a candidate.
4. A failed import does not delete or replace prior source/candidate inputs. Its
   blocked report prevents those old results from being mistaken for the failed
   new import. The requirement report is replaced with `incompatible_import` and
   an empty ranking. Retrying should use a fresh job directory.

## Verification

The combined offline suites pass **81 tests**. New cases cover inactive item sets,
socket-only jewels, shared Huntress/Ranger roots, build versus tree versions,
missing IDs, exact disconnected node explanations, alternate starts, modifier-text
detection, item grants versus purchased nodes, custom configuration scope, and
missing/stale/blocked evidence.

An integrated negative test prepares a blocked import over a fake old job, verifies
the old inputs/results remain intact, verifies the old ranking is cleared, and
uses a fake isolated runtime with no Lua DLL to prove blocked/mismatched jobs are
refused before native library loading. Generated test directories are confined to
and removed from `var/`.

Fresh Spark and Warbringer jobs pass preflight, native evaluation and requirement
comparison. Their **231** and **425** existing calculation checks still pass, and
all four tested policy comparisons retain their previous outcomes. Known warning
messages are surfaced in command summaries and included in comparison reports.
The native runner refuses the Titan before evaluation, and no native result is
written for it.

All **300 application tests**, the production build, and graph validation also
pass. The current graph has 4,762 nodes and 5,426 edges with no validation issues.
No browser-facing source file changed during this preflight step.

## Next Recommended Step

Verify item-granted notables against actual PoB runtime outputs, beginning with the
unmapped Thaumaturgic Generator grant. Determine whether the effect is recognized,
renamed, obsolete, or absent, and whether it contributes without consuming paid
points. Do not assume an unrecognized graph name either works or is broken.

After that, special-allocation support can be added one mechanic at a time, using
the blocked From Nothing example as a regression fixture. Keep unsupported cases
explicit rather than broadening the meaning of "ready" to get a route result.

## Reproduce

See [the tool instructions](../../tools/pob-evaluation/README.md#import-compatibility-preflight).
Captured reports and fresh jobs are in ignored `var/pob-import-preflight-20261107/`,
with `spark/`, `warbringer/`, and `titan/` subdirectories. Original public captures
are retained from the preceding audit. No native runtime, source build code, or
generated result is included in the shipped site.
