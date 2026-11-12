# Chaos/Physical Utility and Casting Supports

Reviewed 2026-11-07 against isolated PoB 0.23.1 and current official upstream
references. Extends four existing support families across the nine reviewed
chaos/physical spell and curse focuses. No new support IDs, skill presets,
preference parser, saved schema or routing algorithm changes.

## Decisions

| Family | Choices | New curated pairs | Component policy |
| --- | --- | ---: | --- |
| Magnified Area | I/II | 18 | All nine; spread/curse/ring/hit coverage as appropriate. Dark Effigy uses linked Vile Effusion, not deployment |
| Prolonged Duration | I/II | 8 | Contagion debuff, Bone Cage ring, Despair and Vulnerability curse uptime only |
| Mobility | One | 9 | Usable-while-moving action; Dark Effigy deployment, not totem firing |
| Rapid Casting (Arcane Tempo game IDs) | I/II/III | 27 | All nine; Dark Effigy uses linked Vile Effusion, not deployment |

All eight existing choices remain context-only/partial. Selecting them adds no
passive weights, support multiplier, automatic priority change or Full DPS
estimate. Normalization retains one tier per family. Saved goals, manual
preferences, extra/all-available budgets and passive scopes remain intact.

Prolonged Duration remains withheld for Bonestorm, Hexblast and Detonate Dead,
which lack the required base duration type. It also remains withheld for Unearth
and Dark Effigy despite legal parent-skill compatibility: Unearth's duration
concerns constructs outside the player-hit focus; the tested Dark Effigy parent
accepted the support but its reported TotemDuration did not change. The latter
is a local-runtime observation, not proof of live-game inapplicability or a claim
that PoB has a defect. No favorable effect is invented from a Duration tag.

Rapid Casting I/II supply cast speed to an eligible spell component, not DoT tick
rate, curse activation speed, cooldown recovery or guaranteed channel stages.
Tier III depends on different spells cast in the last eight seconds; rotation
and uptime are not converted into always-on speed or passive rewards. Dark
Effigy's basic cast-speed caution now acknowledges the verified linked-spell
effect while retaining its unmodeled actual targeting/firing cadence. It still
does not automatically suggest a cast-speed preference.

Arcane Tempo was not added as a duplicate gem: current `Gems.lua` names these
Rapid Casting I/II/III, with internal `SupportGemArcaneTempo[Two/Three]` game IDs
and `SupportRapidCastingPlayer[Two/Three]` effects. Existing app IDs and saved
selections are unchanged. These allowlists are not complete socket/loadout,
attribute, equipment, triggered or support-combination validation.

## Evidence and Independent Checks

Official sources:
[Magnified Area](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689),
[Prolonged Duration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602),
[Mobility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066),
[Rapid Casting](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7539),
and [gem naming/identity](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L833).
Moving upstream sources are not claimed byte-identical to the native snapshot.
Local source SHA-256:

| File | SHA-256 |
| --- | --- |
| sup_int.lua | `573766c7653ba612984b8e12bc70b77aa0e46f7aa217fe836fae539c7911c5af` |
| sup_str.lua | `370edb0f3c6475565c23057953de8af2d3ca851cf3a94a5818ae547ed179e13a` |
| sup_dex.lua | `0cb6d21a33eced70a49b537a9b6ad9841c43b70f7fdd8a88eae9435263eec4c6` |

The native checker evaluated 80 pairs: eight supports against nine parent skills
and Dark Effigy's separately linked damage effect. Twenty-eight assertions
passed for required/excluded types, support magnitudes, alias identity and
component boundaries. Of 66 native-legal component pairs, 62 are admitted and
four duration pairs remain withheld. The app comparison independently verified
all 62 pairings and eight catalog identities against the export; no parent
compatibility was substituted for the linked effect or vice versa.

A bounded synthetic calculation probe captured 21 baseline/supported cases.
Dark Effigy's additional effect was explicitly enabled, and verification requires
the correct selected component and actual applied support, not just a socketed
gem. Thirty-three independent checks passed, including:

- Contagion: native +35% area gives area modifier 1.35 and a 17 -> 19 radius,
  consistent with floor(17 * sqrt(1.35)), not 35% more radius. DoT DPS unchanged.
- Prolonged I: five-second Contagion becomes 6.501 seconds after 33 ms tick
  rounding, matching ceil((5 * 1.30) / .033) * .033. Bone Cage's 1.6-second base
  becomes 2.112; the tested 7.4-second curse bases become 9.636. Their damage and
  casting speed are unchanged. These are snapshot-level examples, not UI scores.
- Contagion Rapid I/II: application speed 1 -> 1.15/1.20, with unchanged DoT DPS.
  Conditional tier III stays at baseline speed in the no-rotation fixture.
- Bonestorm Rapid I: reported speed 8 -> 9.2, but the tested staged result's
  CombinedDPS is unchanged. Channel throughput is not inferred from cast speed.
- Vile Effusion: Magnified I changes area modifier 1 -> 1.35 with unchanged hit
  damage; Rapid I changes speed 1 -> 1.15 and leaves damage per hit unchanged.
  Its synthetic CombinedDPS follows that speed, not the parent deployment.
- Dark Effigy parent Prolonged I: support is applied but TotemDuration remains
  8.019 seconds, so no lifetime improvement is claimed.

Native constants additionally confirm Magnified I/II +35%/+45% area with zero
area-damage bonus; Prolonged I/II 30%/35% more duration; Mobility 25% less movement
penalty with zero damage bonus; Rapid I/II +15%/+20% cast speed and III's conditional
10% per different recent spell. Resource cost/rounding, full movement speed,
targeting, real-character DPS, uptime and linked-gem combinations remain unmodeled.

Evidence/reproduction, all ignored and separate from the installed PoB:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/chaos-support-batch-20261107/review.lua --job var/chaos-support-batch-20261107
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/chaos-support-batch-20261107/calculate.lua --job var/chaos-support-batch-20261107
npx tsx var/chaos-support-batch-20261107/verify.ts
```

The isolated runtime's pre-existing missing-node startup messages did not prevent
these checks. No installed PoB build/settings were edited; normal fresh-checkout
tests do not depend on ignored native evidence files.

## Validation and Coverage

- Quick validation passed 910 tests in 18 files, typecheck and the unchanged
  coverage baseline. Nine parameterized focus cases verify the complete 62-pair
  allowlist plus unchanged scopes, weights, goals, budgets and explicit apply.
- Exclusion/tier tests retain the reviewed duration boundary, single-family
  replacement and Fireball's Concentrated Area hold. Controls, local saves and
  JSON transfers cover all four families, including Dark Effigy's linked focus.
- Seven routing fixtures preserve scores, required goals, node costs and shortest
  behavior; no support magnitude becomes a passive reward or penalty.
- This batch changes support metadata and existing caution text only, not shared
  control/layout implementation. No repeated browser/viewport/save-load matrix
  was run under the lean validation policy. No real-character Full DPS audit.
- Final `validate:release` passed 1,227 tests in 62 files, typecheck, production
  build, graph validation and the unchanged coverage baseline. No final check
  failed; no real-character or cross-browser performance claim is made.

Before/after: 180 -> 242 curated skill/support pairs. Skill presets remain 33/399
(8.3%; 33/234 positive-tier). Support choices stay 28/567 (4.9%; 28/450 positive-tier)
across 18 families, with 17 context-only choices. Preferences stay 79; recognized
wording stays 518/2,182 (23.7%) and stat occurrences stay 2,584/5,451 (47.4%).
All previous contexts/fingerprints remain; no baseline refresh is needed. These
are catalog/heuristic counts, not full mechanics or a project completion percent.

Next recommended batch: Considered Casting, Spell Echo, Projectile Acceleration
and Brutality for the new focuses, keeping channel/proxy/repeat and removed-
damage-type tradeoffs explicit. Fireball Concentrated Area remains on hold.
No commit, push or deployment requested or performed.
