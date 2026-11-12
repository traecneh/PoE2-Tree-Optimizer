# Minion, Totem and Proxy Breadth Batch

2026-11-10. Eight focuses and 68 common-support pairs delivered together.
Local only; no commit, push, deployment or optimizer algorithm change.
Shortest routing and existing saved priorities remain unchanged.

## Selected Components

| Focus | Selected component | Boundaries |
| --- | --- | --- |
| Ancestral Warrior Totem | Explicit socketed Mace attack | Each spirit warrior is a Totem, not a Minion; attacks once; requires three Endurance Charges; idle animation and charge supply are not sustained DPS |
| Spell Totem | Explicit socketed spell | Three Power/Endurance Charges; mixture changes damage, Life and duration; no fixed mix or continuous supply assumed |
| Raise Zombie | Unempowered basic Physical melee attack | Temporary Minion, not Companion; corpse/charge requirement, empowerment and attacker count remain separate |
| Rhoa Mount | Unmounted Companion basic melee attack | Not the player's mounted Bow/Spear attacks; permanent reservation is not temporary duration |
| Shockwave Totem | Initial Physical Slam | Not the stronger Jagged Ground Eruption; cannot create its required ground; equipment changes damage but no weapon family or handedness is inferred |
| Soul Offering | Non-damaging sacrifice/buff cast | Minion spike grants Spell Damage to the player, not Minions; spike survival and six-second duration do not increase buff magnitude |
| Tame Beast | Capture action only | Hinder/capture window, not an invented captured species, its attacks or stats; transformed-beast scoring is not implemented |
| Wolf Pack | Companion basic melee attack | Separate leap; entire pack counts as one Companion; no pack-size multiplication, simultaneous contacts or temporary duration assumed |

The two meta Totems have a required **Socketed skill** selector with no implicit
default. Ancestral Warrior Totem offers Armour Breaker, Boneshatter, Earthquake,
Leap Slam, Rolling Slam and Sunder. Spell Totem offers Fireball, Arc, Contagion
and Tornado. These are reviewed subsets, not every legal socketed skill.

Resolved presets inherit the selected component's reviewed hit, element, DoT,
weapon and timing scopes, with Totem-specific preferences added separately.
Player-only hit-debuff scopes are not assumed to transfer. Self-used support
allowlists do not automatically transfer either. Choices survive saved-build
and JSON round-trips, reach weighted workers, invalidate stale work on change,
and are cleared on a focus change without deleting manual priorities.

Minion/Companion damage and speed never become player damage/speed. Broader
Minion and narrower Companion modifiers can both apply, but each actual line is
scored once. Combined Minion Attack/Cast Speed is not rewarded twice. Single-
target basic attacks receive no automatic area preference. Shockwave receives
generic melee/attack scopes, not assumed Mace or two-handed scopes.

## Common Supports

Reviewed counts are 7 / 5 / 15 / 10 / 12 / 5 / 4 / 10 in the table's order.
These reuse existing support choices and families, with component-specific
tooltips. Native type eligibility alone is not a beneficial-effect claim.

- Magnified Area I/II and Concentrated Area: basic Zombie, Rhoa and Wolf hits
  remain single-target and unchanged. Concentrated Area is 30% more area damage
  with 50% less area, not radius; Shockwave's Slam benefits, coverage shrinks.
- Rapid Attacks I/II: Minion attack cadence or Totem Slam, not player placement.
  Shockwave's captured rate rises from 0.725 to 0.90625 with Tier II.
- Prolonged Duration I/II: Zombie, Offering and capture timers grow. Native
  parent meta-Totem lifetime remains 8.019 seconds; no generic-duration lifetime
  gain is promised. Selected firing-component output is not parent duration.
- Efficiency I/II: reduces supported action costs, not charge requirements,
  Spirit reservation, regeneration or guaranteed sustain. Shockwave's zero-cost
  selected Slam is not free parent deployment.
- Brutality I/II/III: Physical benefit, Elemental/Chaos prohibition and cost
  remain explicit. Tier III has 20% hit chance to ignore Physical Damage
  Reduction, not unconditional penetration. Minion Physical benefit does not
  justify recommending player Physical Damage.
- Feeding Frenzy I/II: Zombie/Rhoa/Wolf only, with 20%/15% more damage taken.
  The non-damaging Soul Offering spike is excluded despite type acceptance.
- Mobility: only reviewed Spell Totem/Zombie/Offering player application,
  not global or Companion movement and not firing speed.

No support multiplier is added to route scores. Existing priorities remain
manual; defensive support priorities are explicit opt-in suggestions.

## Evidence and Coverage

Frozen evidence: isolated local PoB 0.23.1 / tree 0.5.5f. Source export and 86
bounded native observations are retained in ignored `var/proxy-batch-20261110/`;
portable identity/compatibility and native observations are frozen independently
in `src/tree/proxySkills.fixtures.ts`. Installed PoB and user saves were not
modified. Current upstream source is a navigation reference, not the frozen
version identifier: [Strength](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua),
[Intelligence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[Dexterity](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua).

The bounded fixture uses level-20 zero-quality skills, a normal Wooden Club
(Warpick control), sufficient attributes/Spirit and zero enemy Armour. It does
not model equipment builds, active charge mixtures, empowered Zombies, captured
species, all support combinations, continuous contacts or Full DPS. Native
absence of an Offering-spike actor is not evidence of zero spike Life.

- Skills: 179 -> 187 / 399 (46.9%). Positive-tier subtotal: 174 -> 182 / 234
  (77.8%). These are configured scoped focuses, not complete gem mechanics.
- Skill/support pairs: 1,465 -> 1,533 (+68); support choices remain 117 / 567.
- Preferences remain 184. Passive coverage remains 864 / 2,182 distinct wordings
  and 3,444 / 5,451 main-tree occurrences; the baseline is not reset.

Validation: 301 focused integration/catalog tests and the four updated legacy
allowlist files passed. Final `npm run validate:release` passed all 4,018 tests
across 180 files, typecheck, production build, graph validation and unchanged
coverage baseline. The first full run found four stale suggestion allowlists;
those were explicitly extended for reviewed components, not removed. Existing
large-bundle warnings remain non-fatal.

Edge smoke passed all eight selectors, support counts, manual-priority retention,
required-source gating, a real weighted worker preview/cancel/apply flow and
nonblank tree screenshots at 1440x1000 and 1100x800. Console and page errors were
empty. Local preview at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` serves the
final `index-sG9a9Ezy.js` bundle byte-for-byte. Artifacts are under ignored
`output/playwright/proxy-batch-20261110/` and `var/proxy-batch-20261110/`.

Next proposed breadth batch: the remaining three Banners plus nine defensive/
recovery Buff focuses: Arctic Armour, Barkskin, Ghost Dance, Grim Feast, Iron
Ward, Magma Barrier, Scavenged Plating, Time of Need and Wind Dancer. Treat their
triggered damage, incoming defence, charge/state requirements and recipient
effects separately. This proposal is not implementation authorization.
