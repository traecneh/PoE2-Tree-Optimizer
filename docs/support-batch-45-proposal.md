# Approved 45-Variant Support Batch

Implemented locally, not pushed. All names below were unconfigured positive-tier
support entries in the frozen PoB 0.23.1 catalog when this batch was proposed.
Tier variants count separately, not as separate skill/support combinations.

This is one reusable cross-skill batch, not 45 consecutive single-skill reviews.
Review source compatibility and component rules once per family, reuse tested
adapters, and add independent native controls for each distinct mechanical
behavior. Test relevant positive and negative skill representatives, rather
than every possible Cartesian pairing. Keep manual priorities, budgets and
Shortest unchanged; no assumed uptime or invented Full DPS.

## Exact Roster

| Group | Variants | Count |
| --- | --- | ---: |
| Elemental sources | Cold Attunement; Fire Attunement; Lightning Attunement | 3 |
| Elemental gem levels | Cold Mastery; Fire Mastery; Lightning Mastery | 3 |
| Exposure | Cold Exposure; Fire Exposure; Lightning Exposure | 3 |
| Penetration | Cold Penetration; Fire Penetration I/II; Lightning Penetration | 4 |
| Elemental restrictions | Elemental Focus | 1 |
| Ignite | Ignite I/II/III; Searing Flame I/II | 5 |
| Other elemental ailments | Freeze; Shock | 2 |
| Caster/resource buffs | Arcane Surge; Clarity I/II; Vitality I/II | 5 |
| Cooldowns | Cooldown Recovery I/II; Second Wind I/II/III | 5 |
| Meta Energy | Boundless Energy I/II; Energy Capacitor; Energy Retention | 4 |
| Minion defence | Meat Shield I/II; Hulking Minions; Elemental Army | 4 |
| Minion levels/coverage | Minion Mastery; Minion Splash I/II | 3 |
| Attack utility | Heightened Accuracy I/II; Rapid Attacks III | 3 |
| **Total** | **45 support variants** | **45** |

## Review Boundaries

- Attunement's gained damage and penalties need component-specific treatment;
  do not copy a hit bonus into Poison, other DoTs or minions indiscriminately.
- Mastery level changes can alter costs and multiple components. A gem-level
  support is not a flat passive-score or DPS multiplier.
- Exposure requires eligible application; penetration is hit-specific and not
  Exposure, resistance reduction or DoT scaling.
- Elemental Focus/ailment supports need prohibition, existing application,
  threshold, magnitude and duration checks. No permanent ailments assumed.
- Arcane Surge/resource buffs require actual thresholds and cost/recovery
  ownership. Reservation, recovery and resource generation stay distinct.
- Extra cooldown uses are capacity, not sustained recovery rate. Meta Energy
  gain, capacity and retention are separate; no automatic event supply.
- Minion Life/resistances/area belong to eligible Minion components, not player,
  Feral visages or Totems. Bigger area does not guarantee more contacts.
- Accuracy and attack speed need the reviewed attack/weapon scope; no spell
  scaling, unlimited hits or implied sustain.
- Family restrictions and replacement must be preserved across tiers. A
  type-legal support with no useful modeled effect can remain context-only,
  clearly qualified, or be excluded from that focus's offered subset.

Positive-tier support coverage increased from 115/450 to **160/450**;
**290 variants remain unconfigured**. This does not mean every support/skill
pairing or mechanic is complete. See [implementation notes](support-batch-45-implementation.md)
for reviewed scope, native checks, limitations and validation.
