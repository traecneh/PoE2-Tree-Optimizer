# Final Positive-Tier Utility and Trigger Focus Batch

Local-only implementation. No commit, push or deployment. Shortest routing,
point budgets, required goals, W1/W2 branches and search algorithms are unchanged.

## Added Focuses

Barrier Invocation, Blasphemy, Blink, Cast on Critical, Cast on Dodge,
Cast on Elemental Ailment, Cast on Minion Death, Elemental Invocation,
Feral Invocation, Lingering Illusion, Reaper's Invocation, Sacrifice,
Arctic Howl and Lunar Blessing.

This closes the frozen positive-tier catalog: **234/234 configured**.
Including five configured tier-zero entries, there are **239/399 raw skill
entries** configured. The other 160 raw entries are tier-zero/unverified;
they are not a verified list of missing usable gems. A configured focus is a
scoped heuristic, not complete mechanics, current-live gem availability or
Full DPS.

## Recipient and Component Rules

- The seven spell-trigger containers require an explicit reviewed Fireball,
  Arc, Contagion or Tornado recipient in Build Focus. No recipient is assumed.
  This is 28 reviewed combinations, not arbitrary spell compatibility.
- Feral Invocation offers Maul and Lunar Assault: one visage attack, not a
  Minion or Totem. Type-legal channelled, resource-consuming and multihit
  alternatives are intentionally not offered without component review.
- Blasphemy offers Enfeeble, Despair, Vulnerability and Temporal Chains.
  Continuous curse magnitude/coverage replaces self-cast timing suggestions.
  Generic Aura Magnitudes did not strengthen the captured curse.
- The existing socketed-recipient field is reused in save/export, worker
  requests, normalization and missing-source validation. Changing recipients
  cancels stale work. Shortest ignores this scoring-only requirement.
- Triggered player spells inherit their reviewed damage component, not
  automatic self-cast speed or player-only debuff application scopes.
  Cast Speed is not Energy gain, release frequency or cooldown recovery.
- Mana actually spent supplies Feral Energy. Cost efficiency is not
  automatically recommended as an Energy-generation improvement.
- Lingering Illusion requires actual enemy destruction, not merely expiry,
  before its collectible Power Charge Remnant. Lifetime is not guaranteed
  charges, collection or a longer ground-Remnant timer.
- Sacrifice's faster-revival preference is not Minion damage, player summoning
  speed, corpse-skill damage or guaranteed sustainable deaths.
- Arctic Howl's Cold Warcry deals area damage but is neither Attack nor Spell.
  Its Freeze/Power-dependent empowerment and charge-based bypass are conditional.
- Lunar Blessing's Rage-consuming parent buff is separate from the triggered
  Moonbeam. Buff duration/cooldown are not beam cadence, additional contacts,
  Minion damage or permanent Rage supply.

No full-build damage calculator or event-frequency simulation was added.
Manual priorities remain opt-in and are never silently removed by focus changes.

## Common Supports

No new support variants are added in this batch. Twenty-one reviewed pairings
reuse existing support choices:

| Focus | Reviewed common supports |
| --- | --- |
| Blasphemy | Magnified Area I/II |
| Lingering Illusion | Prolonged Duration I/II; Efficiency I/II |
| Arctic Howl | Magnified Area I/II; Prolonged Duration I/II; Efficiency I/II; Mobility; Concentrated Area |
| Lunar Blessing | Prolonged Duration I/II and Efficiency I/II for the parent; Magnified Area I/II and Concentrated Area for Moonbeam |

Other new focuses have no useful reviewed common-support subset yet.
Blink's type-compatible Rapid Casting II did not improve its cooldown-capped
action; zero-cost Efficiency is not presented as an upgrade. Arctic Howl's
Cold damage is not given a Brutality recommendation. Trigger parents do not
silently inherit all supports from a self-cast recipient preset.

## New Literal Passive Matching

- Meta Energy Gain: unconditional increased/reduced Energy gained by Meta Skills.
- Minion Revival Speed: unconditional faster/slower Minion revival.
- Triggered Spell Damage: admitted only with an explicit reviewed damaging
  triggered Spell recipient, counted once in Spell Damage.
- Generic Area Damage now admits Arctic Howl's reviewed secondary area hit,
  without admitting Attack/Spell-specific area damage or copying the same line.

Conditional sources, maximum Energy, Energy spending/refunds, trigger rate,
revival event frequency and sustain remain outside these literal scores.

Coverage increased by 11 distinct wordings across 27 main-tree occurrences:
925/2,182 distinct lines (42.4%), 3,593/5,451 occurrences (65.9%).
Preferences: 198 -> 200. Support choices remain 117/567 across 71 families;
reviewed skill/support pairs: 1,632 -> 1,653.

All pre-batch contexts and baseline contexts were independently compared with
the new report before baseline refresh: zero lost matches; raw tree/catalog
fingerprints unchanged. Explicit trigger-recipient coverage contexts are now
included so a missing source cannot inflate a base focus's scope.

## Evidence

Frozen trusted isolated PoB 0.23.1 / tree 0.5.5f, level-20 quality-zero gems,
level-90 Witch with supplied attributes/Spirit and a basic weapon. Independent
source export and 91 native observations are checked in as regression fixtures.
Drivers, full captures and logs are ignored under
`var/utility-trigger-batch-20261110`; no personal builds were loaded or saved.

- Blasphemy: Spirit 60 per selected curse; effect 0.59. Adding 20% Curse
  Magnitudes gives 0.708; 20% Aura Magnitudes leaves curse effect 0.59.
- Triggered Fireball: average hit 299.6 -> 359.52 with 20% Triggered Spell
  Damage. Cast Speed changes displayed speed, not damage or supplied trigger
  events. The frozen runtime does not fully apply Cast on Critical's linked
  damage penalty: no numerical full-build DPS claim is made.
- Contagion/Tornado intrinsic DoT: 93.9166667/146.0833333 -> 112.7/175.3
  with the same 20% triggered Spell modifier; scaling is explicitly enabled
  by their native component, not inferred just from a Spell tag.
- Feral Maul: 37.8 -> 49.14 with 30% Attack Damage; Minion/Totem/Triggered
  Spell controls leave it unchanged.
- Sacrifice: 12-second revival becomes 12/0.6 = 20 seconds;
  25% faster revival gives 12/(0.6*1.25) = 16 seconds.
- Blink: Rapid Casting II leaves action time unchanged; actual cooldown
  recovery shortens it.
- Arctic Howl: Cold/Area damage controls increase the hit; Attack/Spell
  damage controls do not.
- Lunar parent: duration 5.016 -> 6.765 with Prolonged Duration II, cost
  166 -> 199; Efficiency II gives cost 100. The zero-cost Moonbeam is not
  free parent activation. Concentrated Area applies to its separate hit.

Upstream references: [Intelligence skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[Strength skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua).
These moving references are distinct from the frozen regression evidence.

Final `validate:release` passed: 4,280 tests in 188 files, TypeScript,
production build, graph validation and coverage-baseline check. The first full
pass caught one obsolete Minion-revival negative expectation; it now asserts
the signed matcher cancels faster/slower values without inventing duration.
No production defect was hidden by weakening scope checks.

Edge smoke passed all fourteen choices, all 34 explicit recipient combinations,
missing-source gates, Shortest independence, manual-weight preservation and an
actual worker preview/apply. Inspected 1440x1000 and 1100x800 screenshots show
a visible tree, scrollable right panel and no horizontal overflow or overlap.
The smoke reload recorded zero page errors, console errors or failed responses.
Served HTML and `index-wqzL0jfl.js` exactly match the final production build.
The existing large-chunk warning remains non-fatal; no unrelated performance
refactor or route-quality audit was performed.

Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push, deployment or next-batch support implementation.

## Next Batch

Propose the exact 45 variants in
[the support batch proposal](support-batch-45-proposal.md). This is a proposal,
not authorization to add them in this checkpoint.
