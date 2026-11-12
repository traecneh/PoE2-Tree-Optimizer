# Resource, Charge and Empowerment Batch

Local implementation, 2026-11-10. No commit or deployment authorized.

## Scope

Fourteen focuses together: Alchemist's Boon, Attrition, Berserk, Charge
Regulation, Combat Frenzy, Elemental Conflux, Emergency Reload, Eternal Rage,
Mana Remnants, Mantra of Destruction, Savage Fury, Shard Scavenger, Siphon
Elements and Trinity. This is a scoped heuristic catalog, not Full DPS.

Eleven literal resource preferences add useful routing inputs: maximum Rage;
separate Frenzy/Power/Endurance capacity and duration; Remnant collection range,
effect and additional-creation chance; held Elemental Infusion duration.
Caps do not fill resources; duration does not create them. Conditional
generation, resource conversions, other owners and unknown composites are not
silently scored. Signed capacity and increased/reduced duration/effect retain
penalties. Extra-Remnant chance is flat chance points, not increased chance.

Fourteen curated pairs reuse Prolonged Duration I/II, Efficiency I/II and
Mobility. Only Emergency Reload gets useful Efficiency: it has actual Mana
cost and is non-persistent. Zero-cost Mantra/Savage activations and persistent
toggles do not gain an invented cost-saving recommendation. Supports are
context/tradeoff refinements and do not automatically alter manual weights.

Conflux, Shard Scavenger and Trinity are intentionally **context-only**. They
have reviewed identities, component boundaries and cautions, but no automatic
damage priorities from a random Element, an ambiguous trigger timer or supplied
Affinity. Configured does not mean every mechanic is simulated.

Shortest and the search algorithms are untouched. Existing priorities, required
goals, budgets, Main/W1/W2 allocation and save/export behavior are preserved.

## Independent Evidence

Frozen isolated PoB 0.23.1 / tree 0.5.5f source export and 67 bounded native
observations are in `src/tree/resourceChargeSkills.fixtures.ts`. They are not
generated from production descriptors. Reproduction drivers, source JSON,
calculation logs and four explicit secondary-timer controls are retained under
ignored `var/resource-charge-batch-20261110/`. The user PoB installation is not
modified. Linked upstream `dev` locations are a moving reference, not a frozen
version promise.

Controls use level-20, quality-zero gems and a level-90 Witch, with explicit
attributes/Spirit and normal weapons sufficient for the selected component.
Configured Rage, charges, encounter time, chosen Element and Affinity are
isolated probes, not supplied runtime uptime or a viable whole build. Savage
Fury's granted global component must explicitly be enabled; selecting the
persistent parent alone is not activating a frenzy.

- **Alchemist's Boon:** source sharing is based on your Flask recovery in ally
  Presence, not regeneration or automatic Minion recovery. Native sharing is
  incomplete. Base mapped generation is `14 / 60` charges/s. The Aura control
  raises Aura output to 1.2 but unexpectedly lowers mapped generation to 0.2,
  rather than proving a useful gain. Automatic Aura weighting is withheld; no
  speculative correction to the native calculator is embedded in the app.
- **Attrition:** needs a Rare/Unique encounter and elapsed Presence time. The
  Fireball control is unchanged at zero seconds and rises 299.6 -> 314.58 at
  an explicitly configured ten seconds. This is not maximum stacks, immediate
  Cull or always-on damage. Only Presence coverage is suggested.
- **Berserk:** source grants 59% increased Rage effect and loses 6% Life/minute
  per raw Rage while not losing Rage. At configured 20 Rage, independent
  arithmetic gives `floor(20 * 1.59) = 31` effect and
  `3287 * (6 / 60 / 100) * 20 = 65.74` Life loss/s. Raising capacity 30 -> 35
  leaves actual Rage 20 and loss unchanged. One percent Life regeneration
  does not offset a two-percent drain; more Life also raises absolute loss.
  This is not the older temporary Rage-spending buff.
- **Charge Regulation:** one of each charge enables separate speed/critical/
  defensive grants. Native Fireball speed x1.25, critical chance x1.26 and ES
  x1.2 are independently checked. More capacity leaves actual charges at zero
  unless supplied. Natural duration 15 -> 18 with 20% increased duration is
  distinct from the ten-second consumption interval and binary buff strength.
- **Combat Frenzy:** requires actual Freeze/Electrocute/Pin. Generic cooldown
  recovery and Skill Effect Duration leave the captured 6.1-second internal
  interval unchanged. Capacity/duration are suggested; no application source,
  faster interval or permanent charges are assumed.
- **Conflux:** native primary interval 8.019 -> 10.824 with Duration. A longer
  unfavourable Element roll is not necessarily beneficial. Configured average
  and Fire outputs are not guaranteed preferred-element uptime.
- **Emergency Reload:** actual Mana 82, cooldown 45.012, empowerment 6.006.
  Efficiency II lowers Mana to 50 after native rounding; Duration II extends
  the window to 8.118 and raises cost to 98, leaving cooldown unchanged.
  Generic cooldown recovery 20 gives 37.521 seconds, independently consistent
  with 45 / 1.2 plus tick rounding. It is an instant activation, not an attack
  or a faster normal reload; no infinite ammunition is inferred.
- **Eternal Rage:** `300 / 60 = 5` Rage/s with 100 Spirit reserved across sets,
  but default current Rage is zero. Rage regeneration is not Mana/Life
  regeneration, a bypass of inherent loss or guaranteed maximum capacity.
- **Mana Remnants:** actual ailment/critical/kill events and collection remain
  required. Per-globe Mana independently verifies
  `floor(281 * 1.2) = 337` with 20% increased Remnant Effect. Range/extra-drop
  chance do not raise Mana per globe. Ground lifetime, overflow and pickups/s
  do not become Mana regeneration or guaranteed sustain.
- **Mantra:** eight Combo from other strikes empowers a separate Quarterstaff
  attack; qualifying kills can grant Purple Flames. Native primary/secondary
  timers 8.019/20.031 -> 10.824/27.027, not Combo decay or buff magnitude.
  Zero Mana makes Efficiency unhelpful. No implicit Quarterstaff hit/Chaos
  damage ownership is assigned to the non-damaging activation.
- **Savage Fury:** Fury comes from attacks and cannot build during frenzy;
  human form ends it. Source Life loss/recovery utility and activation movement
  are separate from animal-form recipient attacks. Captured child timer
  0.528 -> 0.693 is not a validated full-frenzy uptime model. Duration remains
  a support caution, not an automatic priority or maximum-Fury assumption.
- **Shard Scavenger:** consumes existing enemy conditions to reload, restore
  one Grenade use and grant ammo-free time. Native primary/secondary timers
  3.003/6.072 -> 4.059/8.184 both grow with Duration; a net uptime improvement
  is not established. No cooldown priority, guaranteed trigger supply or
  permanent ammunition is invented.
- **Siphon Elements:** separate ailment events create Infusion Remnants. Pickup
  range and eligible extra creation are utility; held-Infusion duration is not
  ground-Remnant lifetime. Generic Remnant Effect does not establish extra
  discrete Infusion counts, and the recipient consuming skill is not supplied.
- **Trinity:** Affinity depends on elemental-hit history, consumption and
  decay. Configured 50 Affinity can change Fireball output, but is not actual
  generation or maximum-stack uptime. No automatic Elemental damage priority
  or unreviewed numerical buff formula is added.

## Coverage and Validation

Configured focuses: 211 -> 225/399; positive-tier subtotal 206 -> 220/234
(94.0%). Support choices remain 117/567 across 71 families; reviewed pairs
1,618 -> 1,632. Preference categories 187 -> 198. Thirty-one distinct
main-tree wordings across 68 occurrences are newly recognized, counting
combined charge-duration wording once for coverage rather than three times.

All old baseline contexts and raw tree/catalog fingerprints must match before
refreshing the generated coverage baseline. No route-quality audit or new
search algorithm is part of this batch. Focused source, arithmetic, ownership,
parser, route, UI and save/export tests precede one final successful release
workflow and a representative Edge preview/apply/layout check.

Final `validate:release` passed: 4,185 tests in 186 files, TypeScript,
production build, graph validation and coverage-baseline check. All prior
coverage contexts and fingerprints were compared before baseline refresh:
zero lost matches. Wordings are now 914/2,182 (41.9%); occurrences
3,566/5,451 (65.4%). Raw graph/catalog data is unchanged. The initial full
pass found an obsolete backlog assertion for reload focuses; it now verifies
their utility-only scope rather than treating them as missing attack presets.

Edge smoke passed all fourteen choices, their support counts, context-only
guards, preservation of manual weights, new resource controls, actual worker
preview/apply and a visible tree. Inspected 1440x1000 and 1100x800 screenshots
show no horizontal overflow or incoherent overlap. The smoke reload recorded
zero page errors, console errors or failed responses; initial opening hit only
the pre-existing missing `/favicon.ico`, left unchanged. Served
`index-DLtBGZuR.js` matches the final build hash. Existing large-chunk warnings
remain non-fatal; no unrelated performance refactor or route-quality audit.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

Next proposal: the fourteen remaining positive-tier utility/trigger focuses,
with explicit socketed recipients where required, generation prerequisites
and form restrictions. This does not include unreviewed automatic Full DPS.
No next-batch implementation is authorized by this checkpoint.
