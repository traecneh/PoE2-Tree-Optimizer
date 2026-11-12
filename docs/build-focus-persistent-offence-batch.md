# Persistent Offence and Minion Focus Batch

Local implementation, 2026-11-10. No commit or deployment authorized.

## Scope

Twelve focuses together: Herald of Ash, Blood, Ice, Plague and Thunder; Plague
Bearer; Raging Spirits; Ravenous Swarm; Mirage Archer; Archmage; Overwhelming
Presence; Withering Presence. This is scoped preference matching, not Full DPS.
Shortest and candidate-search algorithms are unchanged. Manual priorities,
required goals, point budgets and weapon-set allocations remain intact.

Forty-six new curated pairs reuse existing Area, Duration, Mobility, Rapid
Attacks, Concentrated Area, Brutality, Feeding Frenzy and Deadly Poison choices.
Type acceptance alone is not sufficient: persistent Efficiency, hypothetical
hit-frequency gains, unsupported components and harmful full-conversion
Brutality suggestions are excluded. Selecting a support does not change weights.

## Evidence and Ownership

Frozen isolated PoB 0.23.1 / tree 0.5.5f sources and 113 native observations are
captured in `src/tree/persistentOffenceSkills.fixtures.ts`, independently from
the production presets. Reproduction drivers and complete logs are under
ignored `var/persistent-offence-batch-20261110/`. The runtime is an isolated copy
under `var/pob-evaluation-spike-20261106/runtime`; user PoB files are untouched.
Upstream `act_str.lua`, `act_dex.lua` and `act_int.lua` provide linked reference
locations, not a claim that the moving upstream branch is permanently frozen.

Controls use level-20, quality-zero skills, a level-90 Witch and a normal Crude
Bow. Supplied attributes/Spirit permit comparisons, not realistic sustain.
No kills, Overkill, stored Poison, Blood Loss pool, maximum Minions, repeat
contacts, Seals, Wither stacks or uptime are silently supplied.

- Ash: qualifying non-Herald Attack Overkill creates an Ignite, not a spell
  hit or non-ailment DoT. Native Overkill burning/lifetime is incomplete.
- Blood: Physical non-weapon Attack explosion cannot cause Bleeding. Native
  Herald Damage and Brutality change the scalable hit; Attack Damage and
  Concentrated Area leave the hit unchanged. Specific attack/area scopes are
  conservatively withheld, with this calculation gap explained.
- Ice: fully Cold-converted Attack explosion cannot Freeze; Concentrated Area
  raises the hit. Thunder: fully Lightning-converted bolts cannot Shock;
  Concentrated Area narrows coverage without raising damage. No action-speed
  bonus is inferred for either no-attack-time component.
- Plague: existing Poison spread is utility, not a new Poison source or damage
  skill. Its radius lacks reviewed generic-area scaling. Reservation only.
- Plague Bearer: source-supplied stored damage feeds a separate nova. Native
  stored base is unmodeled; only release coverage/movement utility is scored.
- Raging Spirits / Swarm: player Attack/Spell/Fire/Chaos and Companion modifiers
  do not become Minion damage. Minion damage/speed do. Spirits' 70% Fire
  conversion is lost under Brutality, not restored as Physical. Swarm Physical
  hits remain under Brutality, but Poison is disabled. Deadly Poison II gives
  100% more magnitude and 30% less hit damage: native output moves 41.192833 to
  57.509 Poison/s, not a flat doubled DPS claim. Feeding adds no speculative
  Life priority for non-engaged/untargetable Minions. Swarm generation is
  explicitly cooldown-scaled; lifetime and attack cadence are separate.
- Mirage: requires explicit Lightning Arrow, Ice Shot, Rain of Arrows or
  Freezing Salvo selection using the existing saved/worker source field. Native
  Bow modifiers transfer; Minion/Totem Damage does not. Dodge-roll creation,
  six-second lifetime, ten-second cooldown, 60 Spirit and charge-consumption
  prohibition remain separate. No unreviewed poison/DoT source or support
  inheritance is inferred. Only parent lifetime supports are offered initially.
- Archmage: independent arithmetic verifies Fireball cost
  `104 + ceil(2541 * .061) = 260`; Mana Cost Efficiency 20 reduces that to
  `260 / 1.2`. Damage gain is `floor(2541 / 100) * 4% = 100%` as Lightning.
  Increasing maximum Mana increases both damage and cost. Flameblast channel
  damage/cost is unchanged by enabling Archmage. Mana/regen/cost utility only;
  no automatic recipient Lightning score or sustainable DPS is invented.
- Overwhelming: lowers enemy thresholds, not player defensive thresholds.
  Aura output changes, but native enemy threshold amounts are incomplete.
- Withering: six-second debuff duration changes with Duration, not generic
  cooldown recovery. Aura tags do not prove per-stack Wither potency scaling.
  No assumed stack count, fixed-interval acceleration or maximum uptime.

## Literal Passive Matching

New Herald Reservation Efficiency preference: 5% increased efficiency per
Normal score unit, signed reductions. Thirty Spirit with 20% efficiency is
`30 / 1.2 = 25`, not 24 or a guaranteed extra reservation. Each modifier is
counted once, not per selected Herald. Mana-cost efficiency is separate.

Scoped Herald Damage contributes once to Generic Damage; scoped Herald area
contributes once to Area of Effect. Only complete signed increased/reduced
wordings qualify. Flat critical chance, other actors, conditional clauses,
unknown composites and malformed decimals are not guessed.

Coverage changes: 199 -> 211/399 configured focuses; 194 -> 206/234
positive-tier focuses (88.0%); 1,572 -> 1,618 reviewed pairs. Support choices
stay 117/567 across 71 families; preferences 186 -> 187. Distinct main-tree
wording 877 -> 883/2,182; occurrences 3,484 -> 3,498/5,451 (64.2%). These are
catalog/parser coverage, not overall project completion or numerical Full DPS.

All old baseline contexts and fingerprints were compared before refreshing
the generated baseline: zero lost matches. Raw tree/catalog data is unchanged.

## Validation Boundary

Focused identity, compatibility, ownership, arithmetic, route, worker,
save/export and UI tests precede the final release workflow. One combined
batch, not twelve separate releases or another route-quality research audit.
Representative browser checks cover all twelve choices, Mirage source gating,
manual-weight retention, actual worker preview/apply and desktop/windowed fit.
Detailed command/browser outcomes are recorded locally with the batch logs.

Final `validate:release` passed: 4,121 tests in 184 files, TypeScript,
production build, graph validation and unchanged-old-context coverage checks.
The existing large-chunk build warning remains non-fatal. The first full pass
identified three obsolete no-suggestion assertions; their explicit expected
focus lists were updated without weakening the ownership checks.

Edge smoke passed all twelve selectors and all four Mirage sources, missing-
source gating, manual-weight retention and real worker preview/apply. Inspected
1440x1000 and 1100x800 screenshots show a visible tree and no horizontal overflow.
The smoke reload recorded zero page errors, console errors or failed responses.
Initial browser opening hit the pre-existing missing `/favicon.ico`; no unrelated
favicon change was made. Served `index-tGno2rkd.js` matches the final build hash.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

Next proposed batch: fourteen resource, charge and empowerment focuses listed
in `optimizer-coverage-roadmap.md`. No next-batch implementation is authorized.
