# Utility and Recovery Preferences

Reviewed against the PoE2 0.5.5f graph and isolated local PoB 0.23.1. Eight
opt-in categories use existing controls and 10% per Normal score unit. High and
Highest multiply the heuristic score by two/three. No graph/assets, shortest
algorithm, worker contract, persistence implementation or preset suggestions changed.

## Reviewed Scope

- Stun Recovery: increased/reduced recovery from your stuns, not threshold,
  outgoing buildup or immunity. Requires the character to be stunned.
- Presence Area of Effect: increased/reduced area, not generic skill area or
  a radius percentage. Requires an applicable Presence effect.
- Skill Movement Penalty Reduction: only the exact generic reduced penalty
  from using Skills while moving. Reductions score positively. Requires an
  applicable usable-while-moving skill and existing penalty; not global speed.
- Life/Mana Leech Amount: literal increased/reduced amount, separately for
  each pool. Requires a leech source; does not grant one or calculate sustain.
- Life Leech Speed: Leech Life N% faster/slower; slower scores negatively for
  delivery speed. Longer recovery duration can be useful but is not rewarded here.
- Flask/Mana Flask Charge Cost Reduction: reduced costs score positively and
  increased costs negatively. Generic and Mana-specific modifiers stay separate.

Only complete unconditional wording matches, with case/whitespace normalization
and strict decimal numbers. Conditional, minion/enemy/companion-owned, more/less,
conversion, override and unknown composite wording remains excluded. Fire/Cold-
skill and Active Block movement penalties are not generic penalty modifiers.
Native parser support for the opposite increased generic movement-penalty
wording was not established, so that alias is not invented. Existing area,
recoup, flask generation, recovery and leech preferences do not receive duplicate
contributions. Required nodes, base exclusions and point budgets are unchanged.

## Native and Independent Checks

PoB's [parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
maps StunRecovery, PresenceArea, MovementSpeedPenalty, LifeLeechRate and generic/
Mana FlaskChargesUsed separately. The leech-amount wording maps to the legacy
MaxLifeLeechRate/MaxManaLeechRate names. This heuristic follows literal amount
wording, not an interpretation of those names as an actual cap or recovery rate.
The corresponding native calculation uses additional inputs and caps that are
not copied into our scorer.

The [movement calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L3211-L3217)
only runs for usable-while-moving skills and scales an existing penalty. A
synthetic 50% base penalty reduced by 20% leaves 40%, giving 60% movement before
other modifiers, not +20% global movement. Similarly, a synthetic 0.5-second
stun with +20% recovery gives 0.5/1.2 = 0.4167 seconds. These are separate
arithmetic checks, not real-character outputs.

All 15 native parser/ModDB forms passed: both signs for ordinary modifiers and
charge costs, faster/slower Life leech and the reviewed movement reduction.
Complete lines returned the expected signed INC values with no tags/ownership
flags or BASE values. Synthetic reductions were included where absent from the
current graph. Installed PoB settings/builds were untouched. The copied runtime's
pre-existing missing-node startup messages did not prevent these checks.

## Explicit Research Gaps

The game's exported descriptions contain slowing-potency and recoup-speed
wording, but the local native parser does not fully recognize either. Thirty-two
slowing-protection occurrences and ten recoup-speed occurrences remain unscored,
not silently counted as completed. The same probe confirms the unreviewed
increased movement-penalty alias is not fully parsed. These need independent
applicability/calculation review or upstream native support before expansion.
Other leech rate/recovery wording absent from the current main tree was reviewed
but not added as speculative aliases. Gear-derived Deflection, Armour-to-
elemental mitigation and all conditional/override mechanics remain separate work.

## Coverage and Tests

Adds 106 recognized occurrences on 102 nodes and 38 distinct wordings:
Stun Recovery eight; Presence area 34 (including five reductions); generic skill
movement reduction 17; Life/Mana leech amount 20/14; Life leech speed seven
(two faster, five slower); generic/Mana flask cost reductions one/five.
Savoured Blood's +35 amount and -20 speed remain independent; its required-node
route scores -2.5 with Normal amount and Highest speed, rather than losing the goal.
Shared-branch tests count multiple effects once per category and one passive cost.

Preferences 71 -> 79; occurrences 2,478/5,451 (45.5%) -> 2,584/5,451 (47.4%);
wording 480/2,182 (22.0%) -> 518/2,182 (23.7%). All prior matches and graph/
catalog fingerprints are preserved. Skill presets/support choices remain
24/399 and 21/567. Full source-review and eligible-cohort denominators are not
established; this is not overall project completion or a Full DPS engine.

Focused validation passed 770 tests in 17 files, typecheck and the prior baseline.
Parameterized picker/storage/JSON tests cover all IDs. No shared UI, layout or
storage implementation required a repeated browser matrix. All 38 new wordings
were reviewed before baseline refresh. Final release validation passed 1,087
tests in 61 files, typecheck, production build, graph validation and the refreshed
baseline. No final checks failed. No commit, push, publish or deployment performed.

Next coherent checkpoint: casting-support area, duration and resource/handling
families for reviewed spell presets, using native compatibility and component
review rather than tags. Fireball's Concentrated Area review stays on hold.
