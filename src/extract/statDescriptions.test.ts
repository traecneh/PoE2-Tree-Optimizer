import { describe, expect, it } from "vitest";
import { createStatDescriptionFormatter, decodeStatDescriptionText } from "./statDescriptions";

const fixtureDescriptions = `
description
\t1 shock_chance_+%
\t2
\t\t1|# "{0}% increased chance to [Shock]"
\t\t#|-1 "{0}% reduced chance to [Shock]" negate 1
\tlang "French"
\t2
\t\t1|# "ignored"
\t\t#|-1 "ignored" negate 1

description
\t1 quarterstaff_critical_strike_chance_+%
\t2
\t\t1|# "{0}% increased [Critical|Critical Hit Chance] with [Quarterstaff|Quarterstaves]"
\t\t#|-1 "{0}% reduced [Critical|Critical Hit Chance] with [Quarterstaff|Quarterstaves]" negate 1

description
\t1 life_regeneration_rate_per_minute_%
\t1
\t\t# "Regenerate {0}% of maximum Life per second" per_minute_to_per_second_2dp_if_required 1

description
\t1 base_strength
\t1
\t\t# "{0:+d} to [Strength]"

description
\t1 attack_additional_critical_strike_chance_permyriad
\t1
\t\t# "{0}% to Critical Hit Chance" divide_by_one_hundred 1

description
\t1 rage_loss_delay_ms
\t1
\t\t# "Lose Rage after {0} seconds" milliseconds_to_seconds 1

description
\t1 base_darkness_refresh_rate_ms
\t1
\t\t# "Darkness refreshes after {0} seconds" milliseconds_to_seconds_2dp_if_required 1

description
\t1 dodge_roll_travel_distance_+_while_surrounded
\t1
\t\t# "{0} metres to Dodge Roll distance" divide_by_ten_1dp_if_required 1
`;

describe("createStatDescriptionFormatter", () => {
  const format = createStatDescriptionFormatter({
    stats: [
      { _index: 17989, Id: "shock_chance_+%" },
      { _index: 2362, Id: "quarterstaff_critical_strike_chance_+%" },
      { _index: 436, Id: "life_regeneration_rate_per_minute_%" },
      { _index: 559, Id: "base_strength" },
      { _index: 700, Id: "attack_additional_critical_strike_chance_permyriad" },
      { _index: 701, Id: "rage_loss_delay_ms" },
      { _index: 702, Id: "base_darkness_refresh_rate_ms" },
      { _index: 703, Id: "dodge_roll_travel_distance_+_while_surrounded" },
      { _index: 704, Id: "max_jade_stacks" },
      { _index: 705, Id: "dummy_stat_display_nothing" },
      { _index: 706, Id: "base_physical_damage_reduction_rating_no_display" },
    ],
    descriptions: [fixtureDescriptions],
  });

  it("formats positive and negative stat descriptions using the matching English rule", () => {
    expect(format(17989, 15)).toBe("15% increased chance to Shock");
    expect(format(17989, -10)).toBe("10% reduced chance to Shock");
  });

  it("cleans game markup and applies common value transforms", () => {
    expect(format(2362, 10)).toBe("10% increased Critical Hit Chance with Quarterstaves");
    expect(format(436, 30)).toBe("Regenerate 0.5% of maximum Life per second");
    expect(format(559, 10)).toBe("+10 to Strength");
    expect(format(700, 1500)).toBe("15% to Critical Hit Chance");
    expect(format(701, 4000)).toBe("Lose Rage after 4 seconds");
    expect(format(702, 1250)).toBe("Darkness refreshes after 1.25 seconds");
    expect(format(703, 15)).toBe("1.5 metres to Dodge Roll distance");
  });

  it("falls back to readable stat ids when a known stat has no description", () => {
    expect(format(704, 10)).toBe("10 Max Jade Stacks");
  });

  it("omits known dummy and no-display stats", () => {
    expect(format(705, 1)).toBe("");
    expect(format(706, 200)).toBe("");
  });

  it("returns undefined for unknown stat ids or missing values", () => {
    expect(format(999999, 15)).toBeUndefined();
    expect(format(17989, undefined)).toBeUndefined();
  });

  it("renders unnumbered value placeholders used by current passive descriptions", () => {
    const formatCurrent = createStatDescriptionFormatter({
      stats: [{ _index: 1, Id: "armour_+%" }, { _index: 2, Id: "melee_range" }],
      descriptions: ['description\n1 armour_+%\n1\n# "{}% increased Armour"\ndescription\n1 melee_range\n1\n# "{:+d} metres to Melee Strike Range" divide_by_ten_1dp_if_required 1\n'],
    });

    expect(formatCurrent(1, 20)).toBe("20% increased Armour");
    expect(formatCurrent(2, 4)).toBe("+0.4 metres to Melee Strike Range");
  });
});

describe("decodeStatDescriptionText", () => {
  it("decodes UTF-16LE stat description files with a byte order mark", () => {
    const bytes = Buffer.from([0xff, 0xfe, 0x23, 0x00, 0x20, 0x00, 0x41, 0x00]);

    expect(decodeStatDescriptionText(bytes)).toBe("# A");
  });
});

describe("grouped stat descriptions", () => {
  const descriptions = `
description
2 attack_minimum_added_lightning_damage attack_maximum_added_lightning_damage
1
# # "Adds {0} to {1} [Lightning] damage to [Attack|Attacks]"

description
1 armour_+%
1
# "{0}% increased Armour"

description
2 minimum_duration_ms maximum_duration_ms
2
# 0 "No maximum duration"
# 1|# "Duration: {0} to {1} seconds" milliseconds_to_seconds 1 milliseconds_to_seconds 2

description
2 first_value second_value
1
# # "{0:+d} and {1:+d}" divide_by_one_hundred 2 negate 1

description
2 projectile_description_mode additional_projectiles
2
0 1 "Skills fire an additional Projectile"
0 2|# "Skills fire {1} additional Projectiles"

description
3 charges_used extra_damage duration_ms
1
# # # "Consume {0}% of Charges for {1}% extra Damage for {2} seconds" milliseconds_to_seconds 3
`;
  const format = createStatDescriptionFormatter({
    stats: [
      { _index: 59, Id: "attack_minimum_added_lightning_damage" },
      { _index: 60, Id: "attack_maximum_added_lightning_damage" },
      { _index: 61, Id: "armour_+%" },
      { _index: 62, Id: "minimum_duration_ms" },
      { _index: 63, Id: "maximum_duration_ms" },
      { _index: 64, Id: "first_value" },
      { _index: 65, Id: "second_value" },
      { _index: 66, Id: "projectile_description_mode" },
      { _index: 67, Id: "additional_projectiles" },
      { _index: 68, Id: "charges_used" },
      { _index: 69, Id: "extra_damage" },
      { _index: 70, Id: "duration_ms" },
    ],
    descriptions: [descriptions],
  });

  it("combines minimum and maximum damage into one line", () => {
    expect(format.formatAll?.([59, 60], [1, 37])).toEqual([
      "Adds 1 to 37 Lightning damage to Attacks", "",
    ]);
  });

  it("resolves values by stat ID even when reordered or separated by other effects", () => {
    expect(format.formatAll?.([60, 61, null, 59], [7, 20, undefined, 1])).toEqual([
      "Adds 1 to 7 Lightning damage to Attacks", "20% increased Armour", undefined, "",
    ]);
  });

  it("preserves zero values and chooses rules using every condition", () => {
    expect(format.formatAll?.([59, 60], [0, 7])).toEqual([
      "Adds 0 to 7 Lightning damage to Attacks", "",
    ]);
    expect(format.formatAll?.([62, 63], [500, 2500])).toEqual([
      "Duration: 0.5 to 2.5 seconds", "",
    ]);
    expect(format.formatAll?.([62, 63], [500, 0])).toEqual(["No maximum duration", ""]);
  });

  it("applies conversions only to the value named by each transform", () => {
    expect(format.formatAll?.([64, 65], [5, 150])).toEqual(["-5 and +1.5", ""]);
  });

  it("combines three-value effects without losing or rescaling unrelated values", () => {
    expect(format.formatAll?.([68, 69, 70], [40, 1, 5000])).toEqual([
      "Consume 40% of Charges for 1% extra Damage for 5 seconds", "", "",
    ]);
  });

  it("keeps readable individual stats when part of a group is missing", () => {
    expect(format.formatAll?.([59, 60], [1, undefined])).toEqual([
      "1 Attack Minimum Added Lightning Damage", undefined,
    ]);
    expect(format(59, 1)).toBe("1 Attack Minimum Added Lightning Damage");
    expect(format.formatAll?.([59], [1])).toEqual(["1 Attack Minimum Added Lightning Damage"]);
  });

  it("uses absent zero-valued flags for rule selection without guessing displayed numbers", () => {
    expect(format.formatAll?.([67], [1])).toEqual(["Skills fire an additional Projectile"]);
    expect(format.formatAll?.([67], [2])).toEqual(["Skills fire 2 additional Projectiles"]);
    expect(format.formatAll?.([67, 66], [2, 1])).toEqual(["2 Additional Projectiles", "Projectile Description Mode"]);
  });

  it("retains unknown stats for the caller's fallback", () => {
    expect(format.formatAll?.([59, 999999, 60], [1, 9, 7])).toEqual([
      "Adds 1 to 7 Lightning damage to Attacks", undefined, "",
    ]);
  });

  it("honors newer single-stat descriptions instead of consuming them into older groups", () => {
    const overridden = createStatDescriptionFormatter({
      stats: [{ _index: 59, Id: "attack_minimum_added_lightning_damage" }, { _index: 60, Id: "attack_maximum_added_lightning_damage" }],
      descriptions: [descriptions, 'description\n1 attack_maximum_added_lightning_damage\n1\n# "Maximum damage: {0}"\n'],
    });

    expect(overridden.formatAll?.([59, 60], [1, 7])).toEqual([
      "1 Attack Minimum Added Lightning Damage", "Maximum damage: 7",
    ]);
  });
});
