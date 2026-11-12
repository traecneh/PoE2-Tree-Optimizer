import { selectPickerOption } from "../testUtils/selectPickerOption";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defensiveBuffFixtures } from "../tree/defensiveBuffSkills.fixtures";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

const settings = (): PassiveOptimizationSettings => ({ mode: "weighted", extraPointBudget: 8, pointBudgetMode: "all-available",
  preferences: [{ id: "energyShield", weight: 1 },{ id: "auraMagnitude", weight: 1 },{ id: "criticalChance", weight: 3 }] });
describe("Banner and defensive-buff controls", () => {
  it.each(defensiveBuffFixtures)("selects $name and explicitly adds suggestions without replacing manual weights or budget", f => {
    const current = settings(), onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), f.id);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, focusSkillId: f.id, supportGemIds: undefined, socketedGrenadeId: undefined });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("combobox",{ name: "Socketed skill" })).toBeNull();
    fireEvent.click(screen.getByRole("button",{ name: "Add suggestions" }));
    const applied = onChange.mock.calls.at(-1)![0];
    expect(applied.preferences.slice(0,3)).toEqual(current.preferences);
    expect(applied).toMatchObject({ focusSkillId: f.id, extraPointBudget: 8, pointBudgetMode: "all-available" });
    rerender(<SkillPreferencePresetControls settings={applied} onChange={onChange} disabled={true} />);
    expect((screen.getByRole("combobox",{ name: "Skill" }) as HTMLSelectElement).disabled).toBe(true);
  });

  it("offers Banner utility and actual support contexts, not recipient attack damage or a zero-cost Efficiency gain", () => {
    render(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "war-banner" }} onChange={vi.fn()} disabled={false} />);
    for (const effect of ["Aura Magnitude","Glory Generation","Skill Effect Duration","Area of Effect"]) expect(screen.getByRole("checkbox",{ name: `Use ${effect} for War Banner` })).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Attack Damage for War Banner" })).toBeNull();
    expect(screen.queryByRole("checkbox",{ name: "Use Efficiency II" })).toBeNull();
    expect(screen.queryByRole("checkbox",{ name: "Use Concentrated Area" })).toBeNull();
  });

  it("retains manual Arctic crit preferences while showing Controlled Destruction's prohibition", () => {
    const current = { ...settings(), focusSkillId: "arctic-armour" }, onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox",{ name: "Use Controlled Destruction" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected.preferences).toEqual(current.preferences);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("note",{ name: "Preferences outside this skill focus" }).textContent).toContain("prevents this supported skill from critically hitting");
    expect(screen.getByText(/Native stage damage is unmodeled/)).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Cast Speed for Arctic Armour" })).toBeNull();
  });
});
