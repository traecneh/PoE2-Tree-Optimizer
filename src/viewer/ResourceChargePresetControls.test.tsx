import { selectPickerOption } from "../testUtils/selectPickerOption";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { resourceChargeFixtures } from "../tree/resourceChargeSkills.fixtures";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

const settings = (): PassiveOptimizationSettings => ({ mode: "weighted", extraPointBudget: 8, pointBudgetMode: "all-available",
  preferences: [{ id: "energyShield", weight: 1 },{ id: "criticalChance", weight: 3 },{ id: "maximumFrenzyCharges", weight: 3 }] });

describe("resource and charge focus controls", () => {
  it.each(resourceChargeFixtures)("selects $name without implicit weights, sources, budgets or damage assumptions", f => {
    const current = settings(), onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), f.id);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, focusSkillId: f.id, supportGemIds: undefined, socketedGrenadeId: undefined });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("combobox",{ name: "Socketed skill" })).toBeNull();
    const add = screen.getByRole("button",{ name: "Add suggestions" }) as HTMLButtonElement;
    if (["elemental-conflux","shard-scavenger","trinity"].includes(f.id)) expect(add.disabled).toBe(true);
    else {
      fireEvent.click(add);
      const applied = onChange.mock.calls.at(-1)![0];
      expect(applied.preferences.slice(0,3)).toEqual(current.preferences);
      expect(applied).toMatchObject({ focusSkillId: f.id, extraPointBudget: 8, pointBudgetMode: "all-available" });
    }
    expect(screen.queryByRole("checkbox",{ name: `Use Elemental Damage for ${f.name}` })).toBeNull();
    expect(screen.queryByRole("checkbox",{ name: `Use Spell Damage for ${f.name}` })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={true} />);
    expect((screen.getByRole("combobox",{ name: "Skill" }) as HTMLSelectElement).disabled).toBe(true);
  });

  it("offers capacity/duration separately and only the actually costed reload action gets Efficiency", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={{ ...settings(),focusSkillId: "charge-regulation" }} onChange={onChange} disabled={false} />);
    for (const field of ["Maximum Frenzy Charges","Maximum Power Charges","Maximum Endurance Charges","Frenzy Charge Duration","Power Charge Duration","Endurance Charge Duration"]) {
      expect(screen.getByRole("checkbox",{ name: `Use ${field} for Charge Regulation` })).toBeDefined();
    }
    expect(screen.queryByRole("checkbox",{ name: "Use Skill Speed for Charge Regulation" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={{ ...settings(),focusSkillId: "emergency-reload" }} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox",{ name: "Use Efficiency II" }));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual(settings().preferences);
    for (const focusSkillId of ["mantra-of-destruction","savage-fury","eternal-rage","mana-remnants"]) {
      rerender(<SkillPreferencePresetControls settings={{ ...settings(),focusSkillId }} onChange={onChange} disabled={false} />);
      expect(screen.queryByRole("checkbox",{ name: "Use Efficiency II" })).toBeNull();
    }
  });

  it("offers Remnant recovery utilities rather than regeneration and does not turn Siphon's discrete Infusions into effect-scaled counts", () => {
    const { rerender } = render(<SkillPreferencePresetControls settings={{ ...settings(),focusSkillId: "mana-remnants" }} onChange={vi.fn()} disabled={false} />);
    for (const field of ["Remnant Pickup Range","Remnant Effect","Additional Remnant Chance"]) expect(screen.getByRole("checkbox",{ name: `Use ${field} for Mana Remnants` })).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Mana Regeneration Rate for Mana Remnants" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={{ ...settings(),focusSkillId: "siphon-elements" }} onChange={vi.fn()} disabled={false} />);
    expect(screen.queryByRole("checkbox",{ name: "Use Remnant Effect for Siphon Elements" })).toBeNull();
    expect(screen.getByRole("checkbox",{ name: "Use Elemental Infusion Duration for Siphon Elements" })).toBeDefined();
  });
});
