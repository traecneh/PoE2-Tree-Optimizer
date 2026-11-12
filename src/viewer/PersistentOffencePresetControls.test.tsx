import { selectPickerOption } from "../testUtils/selectPickerOption";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { persistentOffenceFixtures } from "../tree/persistentOffenceSkills.fixtures";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

const settings = (): PassiveOptimizationSettings => ({ mode: "weighted", extraPointBudget: 8, pointBudgetMode: "all-available",
  preferences: [{ id: "energyShield", weight: 1 },{ id: "criticalChance", weight: 3 }] });

describe("persistent offence controls", () => {
  it.each(persistentOffenceFixtures)("selects $name without implicitly replacing manual priorities or budget", f => {
    const current = settings(), onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), f.id);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, focusSkillId: f.id, supportGemIds: undefined, socketedGrenadeId: undefined });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    if (f.id === "mirage-archer") {
      expect((screen.getByRole("combobox",{ name: "Socketed skill" }) as HTMLSelectElement).value).toBe("");
      expect((screen.getByRole("button",{ name: "Add suggestions" }) as HTMLButtonElement).disabled).toBe(true);
    } else {
      expect(screen.queryByRole("combobox",{ name: "Socketed skill" })).toBeNull();
      fireEvent.click(screen.getByRole("button",{ name: "Add suggestions" }));
      expect(onChange.mock.calls.at(-1)![0].preferences.slice(0,2)).toEqual(current.preferences);
    }
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={true} />);
    expect((screen.getByRole("combobox",{ name: "Skill" }) as HTMLSelectElement).disabled).toBe(true);
  });

  it("offers four explicit Mirage sources and keeps source changes and lifetime distinct from Totem/Minion scoring", () => {
    const current = { ...settings(), focusSkillId: "mirage-archer" }, onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const picker = screen.getByRole("combobox",{ name: "Socketed skill" }) as HTMLSelectElement;
    expect([...picker.options].map(o => o.value)).toEqual(["","lightning-arrow","ice-shot","rain-of-arrows","freezing-salvo"]);
    fireEvent.change(picker,{ target: { value: "ice-shot" } });
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, socketedProxySkillId: "ice-shot" });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("checkbox",{ name: "Use Cold Damage for Mirage Archer" })).toBeDefined();
    expect(screen.getByRole("checkbox",{ name: "Use Skill Effect Duration for Mirage Archer" })).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Totem Damage for Mirage Archer" })).toBeNull();
    expect(screen.queryByRole("checkbox",{ name: "Use Minion Damage for Mirage Archer" })).toBeNull();
    fireEvent.click(screen.getByRole("button",{ name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ socketedProxySkillId: "ice-shot", extraPointBudget: 8, pointBudgetMode: "all-available" });
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0,2)).toEqual(current.preferences);
    selectPickerOption(screen.getByRole("combobox",{ name: "Skill" }), "archmage");
    expect(onChange.mock.calls.at(-1)![0].socketedProxySkillId).toBeUndefined();
  });

  it("keeps spread-only reservation and Archmage Mana utility separate from inferred Poison or Lightning DPS", () => {
    const { rerender } = render(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "herald-of-plague" }} onChange={vi.fn()} disabled={false} />);
    expect(screen.getByRole("checkbox",{ name: "Use Herald Reservation Efficiency for Herald of Plague" })).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Poison Magnitude for Herald of Plague" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "archmage" }} onChange={vi.fn()} disabled={false} />);
    expect(screen.getByRole("checkbox",{ name: "Use Maximum Mana for Archmage" })).toBeDefined();
    expect(screen.queryByRole("checkbox",{ name: "Use Lightning Damage for Archmage" })).toBeNull();
  });
});
