import { selectPickerOption } from "../testUtils/selectPickerOption";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { proxyFixtures } from "../tree/proxySkills.fixtures";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 8,
  pointBudgetMode: "all-available", preferences: [{ id: "energyShield", weight: 3 },{ id: "totemDamage", weight: 1 }] });
describe("proxy focus controls", () => {
  it.each(proxyFixtures)("selects $name without silently applying effects, losing priorities or requiring a source for ordinary focuses", f => {
    const current = settings("spark"), onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), f.id);
    const selected = onChange.mock.calls[0][0];
    expect(selected).toEqual({ ...current, focusSkillId: f.id, supportGemIds: undefined, socketedGrenadeId: undefined });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("combobox",{ name: "Socketed skill" }) !== null).toBe(["spell-totem","ancestral-warrior-totem"].includes(f.id));
  });

  it.each(["spell-totem","ancestral-warrior-totem"])("keeps %s source selection explicit, preserves manual effects and clears it when focus changes", id => {
    const current = settings(id), onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const picker = screen.getByRole("combobox",{ name: "Socketed skill" }) as HTMLSelectElement;
    expect(picker.value).toBe("");
    expect((screen.getByRole("button",{ name: "Add suggestions" }) as HTMLButtonElement).disabled).toBe(true);
    const choice = id === "spell-totem" ? "fireball" : "sunder";
    fireEvent.change(picker,{ target: { value: choice } });
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, socketedProxySkillId: choice });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("button",{ name: "Add suggestions" }));
    const applied = onChange.mock.calls.at(-1)![0];
    expect(applied.preferences.slice(0,2)).toEqual(current.preferences);
    expect(applied).toMatchObject({ pointBudgetMode: "all-available", extraPointBudget: 8, socketedProxySkillId: choice });
    rerender(<SkillPreferencePresetControls settings={applied} onChange={onChange} disabled={true} />);
    expect((screen.getByRole("combobox",{ name: "Socketed skill" }) as HTMLSelectElement).disabled).toBe(true);
    rerender(<SkillPreferencePresetControls settings={applied} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), "wolf-pack");
    const replaced = onChange.mock.calls.at(-1)![0];
    expect(replaced).not.toHaveProperty("socketedProxySkillId");
    expect(replaced.preferences).toEqual(applied.preferences);
  });
});
