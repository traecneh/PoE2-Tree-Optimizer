# Spell Utility Support Refinements

Second checkpoint after the broad utility/recovery release. Reviewed against
isolated PoB 0.23.1 native data and the existing ten elemental spell presets.
Seven compatibility/context choices across four families were added. No new
skill presets, passive matching, automatic priorities or Full DPS calculations.

## Reviewed Families

| Family | Choices | Curated pairs | Scope |
| --- | ---: | ---: | --- |
| Magnified Area | I/II | 16 | Eight reviewed area-component spell focuses; not Arc/Eye of Winter |
| Prolonged Duration | I/II | 4 | Firestorm/Frost Wall persistence; no guarantee of more hits or damage |
| Efficiency | I/II | 20 | All ten base focuses; Persistent skills excluded natively |
| Mobility | One | 9 | Native usable-while-moving focuses; Comet excluded |

All seven are context-only/partial. Their support magnitudes are explanatory
data, not passive score multipliers. Selecting/removing one never rewrites
existing weights or point budgets; no Apply-priorities command is invented for
an empty change list. Saved/exported builds retain selections. One tier per
family replaces another interactively; loading retains the first valid tier.
Existing legal link behavior, shortest routing and Fireball's Concentrated Area
review hold remain unchanged. These new allowlists concern the ten new spell
focuses, not a re-review or expansion of all older focuses.

## Source and Native Evidence

The native checker evaluated 70 skill/support pairs and four negative probes:
removing Area rejects Magnified Area, removing Duration rejects Prolonged
Duration, adding Persistent rejects Efficiency, and removing UsableWhileMoving
rejects Mobility. A separate app/catalog-to-native comparison passed every one
of the 49 admitted pairs. Of 55 native legal pairs, six duration pairs remain
withheld (Ball Lightning, Ice Nova and Frost Bomb for both tiers); eligibility
alone does not establish a reviewed beneficial component.

Sources:
[Magnified Area](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689),
[Prolonged Duration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602),
[Efficiency](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711),
[Mobility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066).
Anchors were verified upstream; moving sources are not claimed byte-identical
to the isolated snapshot used for native tests.

Native constants confirm +35%/+45% increased area (not radius or damage) and a
manaMultiplier field of 30 for Magnified Area; 30%/35% more duration and a
manaMultiplier field of 20 for Prolonged Duration; 30%/40% less supported-skill
cost for Efficiency; and 25% less movement penalty for Mobility, not global speed.
No native damage bonus is manufactured from zero-valued damage stats.
Resource rounding, actual flask/regen sustain, overlap, one-storm limits, crystal
destruction/removal, conversions, equipment and linked-gem interactions remain
unmodeled. These are not recommended loadouts or complete build validation.

## Coverage and Validation

- Support choices: 21/567 -> 28/567 (4.9%); positive-tier 21/450 -> 28/450 (6.2%).
- Families: 14 -> 18; curated pairs: 102 -> 151.
- Eleven choices retain implemented-priority/refinement status; context-only
  choices increase ten -> seventeen. No claim of seven complete support models.
- Skills remain 24/399 (6.0%); positive-tier 24/234 (10.3%).
- Preferences remain 79; wording remains 518/2,182 (23.7%); occurrences remain
  2,584/5,451 (47.4%). All old lines/fingerprints remain; no baseline refresh was
  needed because base-focus wording did not change. Support combinations are
  tested separately, not implied by the wording baseline.
- Focused validation passed 809 tests in 17 files, typecheck and the unchanged
  baseline. Native compatibility and four exclusions passed. Pure/DOM tests
  cover tier replacement, explicit allowlists, summaries, no invented priority
  command, scope/score preservation, saved builds and JSON transfer.
- Seven routing fixtures confirm unchanged costs and scores, not conversion of
  gem area/duration/cost/movement modifiers into passive rewards.
- No shared-control/layout implementation changed, so no repeated browser matrix
  was run under the lean validation policy. Final release validation passed
  1,126 tests in 61 files, typecheck, production build, graph validation and the
  unchanged coverage baseline. No final checks failed; no commit or deployment.

## Next Review and Remaining Work

Next coherent skill batch: nine chaos/physical spell and curse candidates,
starting with Contagion, Bonestorm, Bone Cage, Despair and Vulnerability, plus
Hexblast, Unearth, Detonate Dead and Dark Effigy. Native component/ownership
review must decide safe scopes; corpse, totem, channel, conditional and curse
interactions are not implicitly approved. Catalog-only tier-zero skills are
triage, not silently included as live gems.

The raw backlog remains 375/399 unconfigured skill IDs and 539/567 support IDs;
2,867/5,451 stat occurrences and 1,664/2,182 wordings are unrecognized. The full
reviewed eligible cohort is not yet established. Slowing protection, recoup
speed, Deflection and Armour-to-elemental applicability remain explicit research
gaps. No 95-100% overall completion claim, commit, push or deployment was made.
