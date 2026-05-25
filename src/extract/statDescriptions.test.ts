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

  it("returns undefined for unknown stat ids or missing values", () => {
    expect(format(999999, 15)).toBeUndefined();
    expect(format(17989, undefined)).toBeUndefined();
  });
});

describe("decodeStatDescriptionText", () => {
  it("decodes UTF-16LE stat description files with a byte order mark", () => {
    const bytes = Buffer.from([0xff, 0xfe, 0x23, 0x00, 0x20, 0x00, 0x41, 0x00]);

    expect(decodeStatDescriptionText(bytes)).toBe("# A");
  });
});
