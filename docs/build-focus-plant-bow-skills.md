# Plant Bow Skill Focuses

Vine Arrow and Toxic Growth are added as two curated skill focuses. They use
existing preference categories, parser rules and optimizer behavior. No new
support compatibility or build-performance multiplier is inferred from their tags.

## Components and Preset Choices

| Skill | Reviewed default focus | Kept separate |
| --- | --- | --- |
| Vine Arrow | Intrinsic Chaos vine damage over time | Initial bow impact, Poison supplied to the plant, contact/target counts and plant limits |
| Toxic Growth | Bow impact and explosion hits | Its outgoing Poison, externally supplied Poison, stored-Poison growth, detonation acceleration and overlap |

Vine Arrow suggests Plant Damage, Chaos Damage and Damage over Time, plus
duration, targeting coverage and low-priority deployment speed. Its eight-second
plant lifetime is not faster DoT ticks. Bow Attack Speed and attack-only area
are reviewed utility scopes; Bow/Attack/Projectile Damage, crit, accuracy and
area-hit damage are not transferred to intrinsic vine DoT.

Toxic Growth suggests Plant, Attack, base-Physical and Projectile Damage, plus
attack-area damage, coverage and deployment speed. The hits use a Bow and have
native attack/projectile/area flags. Reviewed Bow and two-handed weapon hit
scopes retain signed modifiers and count each source once. The Chaos tag does
not establish native Chaos conversion for the base weapon hit. Added damage,
conversion and outgoing Poison builds can retain their own manual preferences.

The explosion has a native 100% chance to Poison, unlike the impact. That does
not supply Poison to grow Pustules automatically. Poison Magnitude and Duration
are not silently added to either focus. Selected manual Poison preferences remain
with component-specific warnings. Generic manual values can still affect routing;
warnings do not delete preferences or simulate an external supply skill.

## Native and Independent Checks

An isolated PoB 0.23.1 runtime exported both gem identities/tags and all four
stat sets, then performed 84 bounded MAIN modifier checks with a basic Crude Bow,
empty passive tree and sufficient attributes. The driver asserts the actual
requested stat set and equipped Bow. Installed PoB and user saves were untouched.
Evidence is retained in `var/plant-bow-skills-20261109/`.

- Vine Arrow's level-20 intrinsic Chaos stat is 16278 per minute: 16278 / 60 =
  271.3 per second before these fixture modifiers. +20% generic, Plant, Chaos
  or DoT damage each yields 325.56. -20% Plant damage yields 217.04.
- +20% Attack, Projectile, Bow, Spell or Area Damage does not change that
  intrinsic DoT. Neither +20% Poison Magnitude nor minion-only damage changes it.
  These are component checks, not a claim that the initial impact never benefits
  from attack or projectile modifiers.
- Generic or Bow Attack Speed changes native deployment rate from 1.2 to 1.44
  while intrinsic DoT stays 271.3. +20% Skill Effect Duration extends the rounded
  timer from 8.019 to ceil(8 * 1.2 / .033) * .033 = 9.603, not 20% more DoT DPS.
- Attack-only area changes the vine targeting radius from 24 to
  floor(24 * sqrt(1.2)) = 26. It is not an area-hit damage multiplier.
- Toxic Growth's attack, Projectile, Bow, Physical, Area and Plant damage
  probes agree with the generic-damage hit probe. The frozen baseline hit is
  1.3125, positive probe 1.44375 and reduced-Plant probe .91875. Do not force these
  rounded, mitigated low-level weapon outputs to have an exact 1.2/.8 ratio.
- Chaos, Spell, DoT and Poison Magnitude probes do not increase that base hit.
  Its outgoing Poison is a separate native output: +20% Magnitude changes
  1.2077199486588 to 1.4492639383905. This is not supplied-Poison storage or a
  prediction of the complete build's Poison DPS.
- Poison Duration changes the outgoing Poison timer from 2 to 2.4 seconds,
  while native Detonation Time stays 15. Skill Effect Duration also leaves that
  detonation output unchanged. The app does not reward longer detonation as uptime.

PoB's attack calculation can expose weapon-hit/Poison fields even for Vine
Arrow's Vines set, whose source explicitly hides hit damage/usage stats. Those
fields are not interpreted as real vine hits or intrinsic-DoT Poison. This review
uses the source component flags and ChaosDot output together, not an undifferentiated
TotalDPS field. Native calculation outputs are not a full live-game simulation.

The source contains stored-Poison and growth stats, but this batch does not
calculate their supply, storage, growth caps, detonation expiry, Overgrowth or
extra contacts. No unsupported feeding bonus is assigned a routing weight.

Frozen independent expectations are in `src/tree/plantBowSkills.fixtures.ts`.
Tests need no PoB installation or network. They cover exact scopes, signed
values, ownership, no double-counting, the eight real Plant Damage nodes,
preserved manual Poison/defensive priorities, saved JSON and required-goal routing.
Shortest is unchanged. Support selection remains empty until a separate review.

- [Vine Arrow source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L10181)
- [Toxic Growth source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L9553)
- [Gem catalog](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua)

Moving upstream references are not claimed byte-identical to the isolated
snapshot. These are scoped heuristic presets, not PoB Full DPS integration.

## Coverage and Next Batch

The catalog increases from 99 to 101/399 skill presets (25.3%), including 96/234
positive-tier entries (41.0%). Support coverage remains 38 choices, 24 families
and 416 reviewed pairs. Passive categories remain 184, with 864/2182 distinct
wordings and 3444/5451 occurrences covered. No parser or coverage baseline reset.
These are separate coverage measures, not a single completion percentage.

Next proposed batch: review Magnified Area I/II, Prolonged Duration I/II,
Efficiency I/II and Mobility for these two focuses. Check actual compatibility,
coverage versus intrinsic DoT, deployment cost/movement and lifetime versus
detonation timing. This is a proposal only; no further batch or deployment is
authorized here.

The [bow utility support follow-up](build-focus-plant-bow-supports.md) is now
complete separately. Counts and verification here retain the original skill
checkpoint.

## Verification

`npm run validate:release` passed: 2623 tests across 114 files, typecheck,
production build, graph validation and the unchanged coverage baseline.
Focused checks covered 398 tests; the two stale tag/suggestion expectations were
updated only for the reviewed additions, and those 96 tests passed on rerun.
The existing no-reviewed-supports assertion was also updated for the two new
focuses; all 93 support tests passed on rerun. No support compatibility was inferred.
The production build retains its non-blocking large-chunk advisory (main 678.40 kB).

Isolated Edge and Firefox production-preview smoke checks passed for both focus
selections, component-specific suggestions and Poison warnings. Manual priorities
were preserved. Preview/apply and save/load/reload passed with a 20/123-point
route to Return to Nature; focus selection did not change the start or goal.
Both completion consoles had zero errors or warnings, and screenshots were
visually checked for a nonblank tree and layout overlap. User saves were untouched.

Native probe outputs and final validation/browser logs are retained under the
ignored `var/plant-bow-skills-20261109/` directory. Browser screenshots and the
smoke script are under `output/playwright/plant-bow-skills-20261109/`.
No commit, push or live deployment.
