# Next 45: Proxies and Debuffs

Implemented locally after approval, not committed, pushed or deployed. These
45 variants were positive-tier and unconfigured in the frozen PoB 0.23.1
catalog after the deployment/Combo batch. Tier variants count separately.
See [implementation and evidence](proxy-debuff-support-45-implementation.md).

| Group | Variants | Count |
| --- | --- | ---: |
| Minions, Companions and sacrifice | Bidding I/II/III; Crazed Minions; Last Gasp; Minion Instability; Infernal Legion I/II; Minion Pact I/II; Muster; Deathmarch; Danse Macabre; Loyalty; Sacrificial Lamb I/II; Sacrificial Offering | 17 |
| Totems and recipient recovery | Hardy Totems I/II; Reinforced Totems I/II; Urgent Totems I/II/III; Splinter Totem I/II; Font of Blood; Font of Mana | 11 |
| Curses, Marks and slows | Abiding Hex; Heightened Curse; Hex Bloom; Cursed Ground; Decaying Hex; Impending Doom; Profanity I/II; Eternal Mark; Charged Mark; Mark for Death; Mark for Death II; Mark of Siphoning; Mark of Siphoning II; Slow Potency | 15 |
| Corpse/recovery utility | Corpse Conservation; Essence Harvest | 2 |
| **Total** | **45** | **45** |

Review as one batch using shared family/component adapters. Separate player,
Minion, Companion and Totem recipients; command skills, sacrifice costs,
corpse consumption and triggered child effects. Do not assume deaths, kills,
corpse supply, marked enemies, charges or debuff uptime. Retain costs and
prohibitions. Add passive-priority refinements only when their recipient and
application are reviewed; no free Full DPS/sustain multipliers.

Positive-tier remainder: 245 -> **200**. Configuration coverage is not exhaustive interaction coverage,
live obtainability verification or Full DPS completion.
