# Next 50: Physical, Weapon and Positional Supports

Implemented locally, not committed, pushed or deployed. These exact 50 variants
are positive-tier entries in the frozen PoB 0.23.1 catalog. Tier variants count
separately. See `physical-support-50-implementation.md` for evidence and limits.

| Group | Variants | Count |
| --- | --- | ---: |
| Physical / Bleeding / Impale | Barbs I; Barbs II; Barbs III; Bleed IV; Impale; Incision; Bone Shrapnel; Haemocrystals; Rip; Tear; Excise; Rending Apex | 12 |
| Hit delivery / Slams | Knockback; Brambleslam; Branching Fissures I; Branching Fissures II; Crater; Tectonic Slams; Stomping Ground; Volcanic Eruption; Overreach; Punch Through | 10 |
| Rage / melee conditions | Rage I; Rage II; Rage III; Rageforged I; Rageforged II; Enduring Impact I; Enduring Impact II; Direstrike I; Direstrike II; Clash; Retaliate I; Retaliate II; Frenzied Riposte; Opening Move | 14 |
| Movement / projectile conditions | Hit and Run; Retreat I; Retreat II; Retreat III; Pursuit I; Pursuit II; Pursuit III; Charged Shots I; Charged Shots II; Projectile Deceleration I; Projectile Deceleration II; Gambleshot; Quill Burst; Spectral Volley | 14 |
| **Total** | **50 variants** | **50** |

Continue the family-based approach with reviewed components, not tag-only
compatibility. Keep Physical hits, Bleeding, Impale, Poison sources and
triggered damage separate. Review melee/weapon eligibility, positioning,
movement, retaliation, charge/rage supply and consumption, cooldowns and costs.
Do not assume maximum distance bonuses, simultaneous range conditions,
permanent buffs, every-hit triggers or repeated contacts.

Preserve manual weights unless explicit Apply is used. Existing damage,
ailment and hit prohibitions still win. Keep the Shortest solver, point caps,
required goals and manual W1/W2 branches unchanged.

Positive-tier remainder after this batch: **100**. This is catalog configuration coverage, not exhaustive
interaction coverage, verified live obtainability or Full DPS completion.
