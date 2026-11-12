# Chaos/Physical Spell and Curse Presets

Reviewed 2026-11-07 against the isolated PoB 0.23.1 runtime and official upstream
skill/gem sources. The nine candidates are the requested Contagion, Bonestorm,
Bone Cage, Despair and Vulnerability, plus the roadmap's Hexblast, Unearth,
Detonate Dead and Dark Effigy. No shortest algorithm, graph/assets, preference
parser or saved-build schema changed. The existing 24 preset entries retain
their ordering, scopes and priorities; the nine new entries are appended.

## Component Decisions

| Preset | Reviewed focus | Boundaries |
| --- | --- | --- |
| Contagion | Chaos DoT; spell damage explicitly applies to its DoT | No damaging hit, crit or area-damage scope; area is spread coverage and duration is uptime, not DPS |
| Bonestorm | Physical spell projectile and explosion | Area damage is explosion-only; stages, Power Charges, subsequent-attack Impale and total DPS are not simulated |
| Bone Cage | Physical area spell hits from enemy contact | Ring replacement, lifetime, Pinning, enemy motion and number of contacts are not modeled |
| Despair | Outgoing non-damaging Chaos Resistance curse | Curse magnitude/duration/area/activation, not player Chaos or Spell Damage; enemy resistance and resulting damage are not computed |
| Vulnerability | Outgoing non-damaging Armour-ignoring curse | Curse magnitude/duration/area/activation, not player Physical Damage; enemy Armour and resulting damage are not computed |
| Hexblast | Chaos area spell hits | Consuming half-expired curses is a prerequisite, not curse-magnitude/duration scaling; setup, explosion count and overlap are not modeled |
| Unearth | Player's physical cone hit | Bone Constructs are separate; minion damage, corpse supply, construct lifetime and limits are outside this focus |
| Detonate Dead | Corpse-Life physical explosion plus separate flat fire component | No assumed Spell Damage or Spell Area Damage scaling of the full corpse-Life component; corpse Life, supply, delay and total DPS remain unmodeled |
| Dark Effigy | Linked Vile Effusion totem-fired Chaos spell hit | Not a Minion or DoT damage focus; requires enemy Chaos DoT debuffs; count, totem cadence, duration and projectile speed/count scaling are not modeled |

All nine enable the reviewed spell-Area-of-Effect wording as coverage only.
Bonestorm, Bone Cage, Hexblast, Unearth and Dark Effigy's linked hit enable
spell-critical and spell-area-damage wording. Only Bonestorm gains the existing
spell-projectile-speed scope. No automatic critical, ailment or penetration
preference is added. Generic manual preferences still behave as before, even
when a caution says they are outside the focus. Selecting a skill alone adds
no weights; Add suggestions is explicit and preserves manual choices/goals/budgets.

Detonate Dead is deliberately partial at the component level, even though it
counts as a configured scoped preset in the catalog. Spell Damage may serve
its flat fire portion, but is not an automatic recommendation for the dominant
corpse-physical focus. This is a conservative omission, not a claim that the
native engine cannot calculate corpse explosions: its baseMods explicitly set
`explodeCorpse`, and SkillStatMap converts the physical permillage stat into
the corpse-Life multiplier. At level 20 the source fraction is 107/1000; an
independent 1,000-Life corpse example therefore contributes 107 base physical
damage before modifiers, not damage based on the player's Life.

Dark Effigy's gem explicitly links `DarkEffigyProjectilePlayer` as an additional
granted effect. That effect is a spell used by a Totem/proxy with projectile and
area-hit flags, not a minion. The deployment and damage components are not
interchangeable. These checks do not establish actual character DPS, inheritance
under every modifier, target-debuff uptime or totem firing cadence.

## Companion Support Review

No new support IDs or families are added. Native compatibility was evaluated for
seven existing choices against all nine parent skills (63 pairs). The implemented
29 additions were independently compared to that export:

- Efficiency I/II: all nine (18 pairs); cost context only, no invented regeneration.
- Controlled Destruction: Bonestorm, Bone Cage, Hexblast, Unearth and Detonate
  Dead (five pairs). Spell-only critical scope is disabled; manual crit remains
  with a caution. Not admitted for Contagion, the curses or Dark Effigy's parent.
- Ritualistic Curse / Focused Curse: Despair and Vulnerability (four pairs).
  Coverage/activation priority changes still require explicit application.
- Swift Affliction I/II: Contagion (two pairs), with its duration tradeoff and
  separate DoT focus. The tier-family exclusivity rule remains unchanged.

Ten legal Swift Affliction pairs for five other hit focuses remain withheld
because their DoT benefit is not reviewed. Legal linking is not evidence that a
support improves this preset's chosen component. Fireball's Concentrated Area
review remains explicitly on hold; no new pair is inferred just from gem tags.

## Source and Native Evidence

Official references: [active spells](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[gem identities/tags](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua),
and [skill-stat mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua).
The moving upstream references are not claimed byte-identical to the local
snapshot. Local `Data/Skills/act_int.lua` SHA-256:
`5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac`.

The native export records all nine exact gem identities/tags, skill types,
base flags, stat sets, timing and constants. Thirty-one native assertions passed:
DoT-only versus hits, explicit spell-to-DoT scaling, area-hit flags, two Bonestorm
components, minimum channel time, maximum spikes, Bone Cage limits, non-damaging
curse flags/activation, Hexblast's explosion limit, separate Unearth minions,
Detonate Dead's corpse fraction/flag/delay and Dark Effigy's linked totem hit.
An independent TypeScript comparison verified all nine identities/tag sets and
all 29 admitted companion support pairs against native exports.

Evidence is retained locally under `var/chaos-physical-preset-batch-20261107/`.
No installed PoB builds/settings were edited. Existing isolated-runtime
missing-node startup messages did not prevent the checks. Fresh-checkout tests
do not require that native installation or ignored evidence directory.

## Validation and Coverage

- Quick validation passed 873 tests in 18 files, typecheck and the prior baseline.
  An initial test-only type error was fixed without changing production contracts.
- Parameterized preset/control tests cover all nine, opt-in suggestions, manual
  priorities/goals/budgets, signed area scope, component exclusions and companions.
- Save/load and JSON-transfer tests cover every new focus. Nine weighted route
  fixtures prefer the reviewed component over unrelated effects, retain required
  goals and keep shortest behavior unchanged.
- A shared Area tooltip now avoids recommending Spell Area Damage for non-hit
  or deliberately limited focuses; existing area-hit guidance remains unchanged.
- Edge smoke selected Contagion with zero implicit weights, explicitly added its
  six suggestions, and verified the updated tooltip at 1100x760 and 390x844.
  Tooltip bounds fit and neither viewport had horizontal overflow. Switching
  to Despair preserved all six preferences and showed damage-scope cautions.
  Only the pre-existing favicon 404 appeared; no application error/warning.
  Screenshots: `output/playwright/chaos-presets-desktop.png` and
  `output/playwright/chaos-presets-mobile.png`. The isolated QA browser was closed.
- Final `validate:release` passed 1,190 tests in 62 files, typecheck, production
  build, graph validation and the refreshed coverage baseline. No final check
  failed. No real-character Full DPS audit or cross-browser matrix was run.

Before/after: skills 24/399 (6.0%) -> 33/399 (8.3%); positive-tier skills
24/234 (10.3%) -> 33/234 (14.1%). Supports stay 28/567 (4.9%), across 18 families;
curated skill/support pairs rise 151 -> 180. Preference categories stay 79.
Distinct wording stays 518/2,182 (23.7%); recognized main-tree occurrences stay
2,584/5,451 (47.4%). Reusing covered scopes is not new union passive coverage.
All old matches and graph/catalog fingerprints are preserved. The nine new focus
contexts were reviewed before deliberately refreshing the baseline.

Remaining raw catalog: 366 unconfigured skills (201 positive-tier), 539
unconfigured supports (422 positive-tier), 1,664 unrecognized wordings and
2,867 unrecognized occurrences. Seventeen configured supports are context-only.
These raw denominators are not a verified obtainable-gem list or full-mechanics
completion target.

Next recommended batch: review four to six casting/area/duration support families
for these new focuses, including explicit curse, channel, corpse and proxy
component exclusions. Start with Magnified Area, Prolonged Duration, Mobility
and Arcane Tempo; add compatibility only where native and component checks agree.
No commit, push or deployment requested or performed.
