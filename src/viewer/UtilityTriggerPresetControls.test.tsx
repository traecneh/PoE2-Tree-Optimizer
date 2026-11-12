import { selectPickerOption } from "../testUtils/selectPickerOption";
import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { utilityTriggerFixtures } from "../tree/utilityTriggerSkills.fixtures";
import { utilityTriggerSocketChoices } from "../tree/utilityTriggerSkillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

const settings = (): PassiveOptimizationSettings => ({ mode: "weighted",extraPointBudget: 8,pointBudgetMode: "all-available",preferences: [{ id: "energyShield",weight: 1 }] });
describe("utility and trigger focus controls",() => {
  it.each(utilityTriggerFixtures)("selects $name without implicit sources or priority changes",f => {
    const current = settings(),onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), f.id);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toMatchObject({ ...current,focusSkillId: f.id });
    expect(selected.socketedProxySkillId).toBeUndefined();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const sources = utilityTriggerSocketChoices[f.id];
    if (sources) {
      const control = screen.getByRole("combobox",{ name: "Socketed skill" }) as HTMLSelectElement;
      expect(control.value).toBe("");
      expect([...control.options].map(o => o.value)).toEqual(["",...sources]);
      for (const value of sources) {
        fireEvent.change(control,{ target: { value } });
        const next = onChange.mock.calls.at(-1)![0];
        expect(next).toEqual({ ...selected,socketedProxySkillId: value });
        rerender(<SkillPreferencePresetControls settings={next} onChange={onChange} disabled={false} />);
        expect(screen.queryByRole("checkbox",{ name: "Use Totem Damage for " + f.name })).toBeNull();
        expect(screen.queryByRole("checkbox",{ name: "Use Minion Damage for " + f.name })).toBeNull();
        expect(screen.queryByRole("checkbox",{ name: "Use Cast Speed for " + f.name })).toBeNull();
      }
    } else expect(screen.queryByRole("combobox",{ name: "Socketed skill" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={true} />);
    expect((screen.getByRole("combobox",{ name: "Skill" }) as HTMLSelectElement).disabled).toBe(true);
  });

  it("adds reviewed suggestions explicitly and keeps Blasphemy's aura conversion scoped",() => {
    const current = { ...settings(),focusSkillId: "blasphemy",socketedProxySkillId: "enfeeble" },onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const label of ["Curse Magnitudes","Curse Area","Area of Effect"]) {
      expect(screen.getByRole("checkbox",{ name: "Use " + label + " for Blasphemy" })).toBeDefined();
    }
    fireEvent.click(screen.getByRole("button",{ name: "Add suggestions" }));
    const applied = onChange.mock.calls.at(-1)![0];
    expect(applied.preferences[0]).toEqual(current.preferences[0]);
    expect(applied.preferences.map((p: { id: string }) => p.id)).toEqual(["energyShield","curseMagnitude","curseArea","areaOfEffect"]);
    rerender(<SkillPreferencePresetControls settings={{ ...current,focusSkillId: "sacrifice",socketedProxySkillId: undefined }} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("checkbox",{ name: "Use Minion Revival Speed for Sacrifice" })).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Efficiency II" })).toBeNull();
  });
});
