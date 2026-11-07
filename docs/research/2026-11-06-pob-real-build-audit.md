# PoB Real-Build Route Audit

Audited November 6, 2026, using the isolated PoB 0.23.1 runtime and the game's
0.5.5f graph. This is offline research, not a shipped ranking mode or a claim
that the shortest-route optimizer now understands build performance.

Follow-up: [the offline requirements filter](2026-11-06-pob-build-requirements.md)
now rejects candidates against explicit nodes and metric floors before comparing
point costs. Its two test policies demonstrate the differences below without
changing the website.

## Public Build

The user requested a suitable online example rather than supplying a personal
export. Phoenix's public level-97 Sorceress / Stormweaver Spark build was selected:

- [Public PoB share](https://poe.ninja/poe2/pob/28df3).
- [Raw build code](https://poe.ninja/poe2/pob/raw/28df3).
- [0.5.5 guide listing linking that export](https://www.poebuilds.cc/poe2/build/Zta0mBX-Fvk).

The captured export contains 17 item records, 9 skill/socket groups, a configuration
set, 4 socketed jewels, and 31 explicit travel-attribute choices. Its 131 allocated
IDs all exist in our game graph. PoB counts **121 main points and 8 ascendancy
points**; class and ascendancy start IDs are not paid points. Neither weapon set
has separate allocations in this example.

Source XML SHA-256:
`edbfbfbf36a987c96c24b59269f140e2c03803e24f26c4e8c4dd24ba4fc5cdae`.
The public share can change; the local captured hash identifies this audit.
The build uses Chaos Inoculation and Eldritch Battery: it has 1 Life, no remaining
ES, and 9,134 unreserved Mana. It must not be treated as a conventional ES defence
build just because many selected passives grant ES.

## Method

The complete original XML is retained. Gear, gems, active skill/configuration,
level, class, ascendancy allocations, jewel positions, and existing attribute
choices are unchanged. All original main-tree attribute nodes are pinned, along
with original notable, keystone, and jewel-socket goals: 62 required nodes in the
first run. New travel-attribute nodes explicitly choose Intelligence.

Our existing anytime router generates candidate main trees from the class root,
not from the complete original allocation. Otherwise the original nodes would be
required base nodes and could not be replaced. The original tree remains a control.
The search uses 128 heuristic iterations and retains two distinct alternatives;
it does **not** prove global optimality.

Each candidate is evaluated two ways:

1. Apply both `addNodes` and `removeNodes` to PoB's calculator.
2. Deep-copy the original XML, change only its active tree and necessary new
   attribute overrides, then reload the full build and recalculate.

These two paths use the same engine. Agreement verifies our adapter, not the
correctness of PoB's entire damage or defence model. Both paths agree on all
audited metrics. The original allocation, context, and baseline outputs restore
exactly. The source XML file remains unchanged. No personal build or setting was
loaded, and no installed PoB file was edited.

## First Result: Fewer Points Can Break the Build

Values below are PoB outputs under the captured build's own configuration, not
measured in-game damage or survivability.

| Tree | Main points | Full DPS | PoB effective hit pool | Damage taken from Mana before Life |
| --- | ---: | ---: | ---: | ---: |
| Original | 121 | 6,224,479 | 21,601.55 | 100% |
| Candidate 1 | 119 | 5,722,501 | 29.56 | 92% |
| Candidate 2 | 120 | 5,656,535 | 29.56 | 92% |

Both cheaper trees retain every requested goal but remove these two small nodes:

- ID `50817`, Damage from Mana: 4% of Damage is taken from Mana before Life.
- ID `61355`, Damage from Mana: the same 4% effect.

Neither is a notable. Their removal loses 8 percentage points of mana protection.
With 1 Life and no remaining ES, that is a build-breaking change even though the
goal-routing request is satisfied correctly. This is not a PoB defect or a routing
bug: the original request did not require those small nodes or their threshold.

### Independent Arithmetic

The game-extracted node text supplies the change: `100 - 4 - 4 = 92%`.
For a single hit with no recovery and no remaining ES, let `p` be the fraction
redirected to mana. Resource conservation gives:

```text
p = 1: pool = Life + Mana
p < 1: pool = min(Life + Mana, Life / (1 - p))

Original: 1 + 9,134 = 9,135
92% redirected: 1 / 0.08 = 12.5
```

This independent sub-calculation agrees with PoB's `sharedManaEffectiveLife`.
It does not include mitigation, avoidance, recovery, or validate full EHP/DPS.
The verifier can pass its arithmetic/adapter checks while separately flagging
these candidates as unsuitable.

## Control Run: Protect the Critical Small Nodes

The audit was repeated with IDs `50817` and `61355` added to mandatory goals, for
64 required nodes. This is equivalent to protecting those nodes with the site's
existing Ctrl-click goal action; no new site feature was introduced.

| Tree | Main points | Full DPS | DPS change | PoB effective hit pool | Mana protection |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original | 121 | 6,224,479 | baseline | 21,601.55 | 100% |
| Candidate 1 | 119 | 5,722,501 | -8.06% | 21,601.55 | 100% |
| Candidate 2 | 120 | 5,656,535 | -9.12% | 21,705.59 | 100% |

Candidate 1 adds 8 nodes and removes 10. Candidate 2 adds 10 and removes 11,
including two new Intelligence travel nodes, raising Intelligence from 210 to
220 and Mana from 9,134 to 9,178. All candidates meet the captured equipment/gem
attribute requirements. The saved critical nodes prevent the resource collapse,
but fewer critical-damage small nodes still reduce DPS. Candidate 1 also removes
two 10% mana-regeneration nodes; preserving hit capacity alone does not establish
sustained mana recovery or in-game suitability.

Thus neither alternative is automatically a recommended replacement. The useful
result is a visible tradeoff: save 1-2 points while losing about 8-9% configured
DPS, rather than silently declaring a point-count winner.

## Verification and Limits

Each run passes **145 checks**: source integrity, goal retention, root connectivity,
actual game edges, unique point cost, agreement with PoB's paid point counts,
protected context, original attribute choices, attribute requirements, complete
candidate loading, baseline restoration, output agreement between both evaluation
paths, mana-redirection deltas, and the independently derived resource pool.
The standalone verifier suites contain **22 tests**, including deliberately wrong
arithmetic, missing outputs, an add-only adapter, altered context, changed source
XML, and a fabricated graph edge.

The previous synthetic experiment still passes all 42 independent checks after
sharing the runtime bootstrap. Repository verification also passes: 300 app tests,
the production build, and graph validation with no reported issues. The local
server serves the expected 0.5.5f graph (4,762 nodes and 5,426 edges); no browser
feature was changed in this audit.

Warm candidate calculator calls in one captured run took roughly 22-25 ms of CPU
time. Runtime startup and full reloads cost more. These are a few local samples,
not a production throughput benchmark.

Remaining limits:

- Full DPS and EHP have not been independently reimplemented or checked in-game.
- Jewels stay in place, but testing one real build does not establish support for
  every jewel mechanic or every possible tree/configuration combination.
- Positive W1/W2 allocations need another audit; this example only tests empty sets.
- PoB logs 14 missing-node references at startup. None belong to these evaluated
  routes; wider compatibility still needs investigation.
- There is no browser connection, local service, build upload, or new UI score.
  GitHub Pages cannot execute this native runtime itself.

## Recommended Next Step

Before introducing broad offence/defence weights, prototype **build requirements
and candidate rejection** in this offline harness. Keep the original tree as a
candidate, retain exact required nodes, and support explicit thresholds such as
attribute requirements, 100% mana protection for this build, and minimum damage or
recovery. Show separate outputs and point costs rather than one invented score.

Check at least one second build with a different defence model and positive weapon
allocations before designing a website-facing calculator protocol. Preferences
such as "up to 3 extra points for more ES" should rank only candidates that satisfy
the selected build's hard requirements, and complete routes must be recalculated.

## Reproduce

See [the tooling instructions](../../tools/pob-evaluation/README.md). Captured
code, original XML, candidate manifests, raw PoB outputs, and detailed checks are
under ignored `var/pob-real-build-audit-20261107/`; its `protected/` subdirectory
contains the control run. Tool sources and this report are reviewable; the large
native runtime and public source export are not bundled into the website.
