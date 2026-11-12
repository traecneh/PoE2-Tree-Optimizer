import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import { reviewedSkillSupportsFor } from "../tree/skillSupportPreferences";
import { SkillSupportControls } from "./SkillSupportControls";

const preset = getSkillPreferencePreset("fireball")!;
const settings = (supportGemIds: string[] = []): PassiveOptimizationSettings => ({
  mode: "weighted", focusSkillId: preset.id, extraPointBudget: 8, pointBudgetMode: "all-available",
  preferences: [{ id: "energyShield", weight: 3 }], supportGemIds,
});
const search = () => screen.getByRole("searchbox", { name: "Search reviewed supports" });
const selectedOnly = () => screen.getByRole("checkbox", { name: "Selected supports only" });
const list = () => screen.getByRole("list", { name: "Fireball reviewed supports" });
const visibleNames = () => within(list()).queryAllByRole("checkbox").map(input => input.getAttribute("aria-label"));

describe("support picker filters", () => {
  it("starts with the existing full list in its original order", () => {
    render(<SkillSupportControls preset={preset} settings={settings()} onChange={vi.fn()} disabled={false} />);
    expect(visibleNames()).toEqual(reviewedSkillSupportsFor(preset.id).map(s => "Use " + s.name));
    expect((search() as HTMLInputElement).value).toBe("");
    expect((selectedOnly() as HTMLInputElement).checked).toBe(false);
  });

  it("matches every name token regardless of case, order or surrounding whitespace", () => {
    const onChange = vi.fn();
    render(<SkillSupportControls preset={preset} settings={settings()} onChange={onChange} disabled={false} />);
    fireEvent.change(search(), { target: { value: "  II   zEnItH  " } });
    expect(visibleNames()).toEqual(["Use Zenith II"]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status", { name: /1 of \d+ supports shown; 0 selected/ })).toBeDefined();
  });

  it("searches names, not descriptions, and can reset an empty result", () => {
    const onChange = vi.fn();
    render(<SkillSupportControls preset={preset} settings={settings(["hourglass"])} onChange={onChange} disabled={false} />);
    fireEvent.change(search(), { target: { value: "ten-second cooldown" } });
    expect(visibleNames()).toEqual([]);
    expect(screen.getByText("No matching supports.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("checkbox", { name: "Use Hourglass" }).matches(":checked")).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("combines search with selected-only without forgetting hidden selections", () => {
    const current = settings(["hourglass", "zenith-ii"]), onChange = vi.fn();
    render(<SkillSupportControls preset={preset} settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(selectedOnly());
    expect(visibleNames()).toEqual(["Use Hourglass", "Use Zenith II"]);
    fireEvent.change(search(), { target: { value: "hour" } });
    expect(visibleNames()).toEqual(["Use Hourglass"]);
    expect(screen.getByRole("status", { name: /1 of \d+ supports shown; 2 selected/ })).toBeDefined();
    fireEvent.keyDown(search(), { key: "Escape" });
    expect(visibleNames()).toEqual(["Use Hourglass", "Use Zenith II"]);
    expect((selectedOnly() as HTMLInputElement).checked).toBe(true);
    expect(current.supportGemIds).toEqual(["hourglass", "zenith-ii"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a distinct empty-selection state and clears both filters without changing settings", () => {
    const onChange = vi.fn();
    render(<SkillSupportControls preset={preset} settings={settings()} onChange={onChange} disabled={false} />);
    fireEvent.click(selectedOnly());
    expect(screen.getByText("No supports selected.")).toBeDefined();
    fireEvent.change(search(), { target: { value: "unleash" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect((search() as HTMLInputElement).value).toBe("");
    expect((selectedOnly() as HTMLInputElement).checked).toBe(false);
    expect(visibleNames()).toContain("Use Unleash");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("distinguishes no selected matches from no selections", () => {
    render(<SkillSupportControls preset={preset} settings={settings(["hourglass"])} onChange={vi.fn()} disabled={false} />);
    fireEvent.click(selectedOnly());
    fireEvent.change(search(), { target: { value: "unleash" } });
    expect(screen.getByText("No selected supports match.")).toBeDefined();
    expect(screen.getByRole("status", { name: /0 of \d+ supports shown; 1 selected/ })).toBeDefined();
  });

  it("keeps query text while selections change and retains normal family replacement", () => {
    const current = settings(), onChange = vi.fn();
    const { rerender } = render(<SkillSupportControls preset={preset} settings={current} onChange={onChange} disabled={false} />);
    fireEvent.change(search(), { target: { value: "wildshards" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Wildshards I" }));
    const first = onChange.mock.calls.at(-1)![0];
    expect(first).toEqual({ ...current, supportGemIds: ["wildshards-i"] });
    rerender(<SkillSupportControls preset={preset} settings={first} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Wildshards II" }));
    const second = onChange.mock.calls.at(-1)![0];
    expect(second).toEqual({ ...current, supportGemIds: ["wildshards-ii"] });
    rerender(<SkillSupportControls preset={preset} settings={second} onChange={onChange} disabled={false} />);
    expect((search() as HTMLInputElement).value).toBe("wildshards");
    expect(screen.getByRole("checkbox", { name: "Use Wildshards I" }).matches(":checked")).toBe(false);
    expect(screen.getByRole("checkbox", { name: "Use Wildshards II" }).matches(":checked")).toBe(true);
  });

  it("updates selected-only immediately when the last selected support is removed", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SkillSupportControls preset={preset} settings={settings(["hourglass"])} onChange={onChange} disabled={false} />);
    fireEvent.click(selectedOnly());
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Hourglass" }));
    const next = onChange.mock.calls.at(-1)![0];
    expect(next.supportGemIds).toEqual([]);
    rerender(<SkillSupportControls preset={preset} settings={next} onChange={onChange} disabled={false} />);
    expect(visibleNames()).toEqual([]);
    expect(screen.getByText("No supports selected.")).toBeDefined();
  });

  it("calculates Apply from all selected supports even when the search hides them", () => {
    const current = settings(["hourglass"]), onChange = vi.fn();
    render(<SkillSupportControls preset={preset} settings={current} onChange={onChange} disabled={false} />);
    fireEvent.change(search(), { target: { value: "no-match" } });
    expect(visibleNames()).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, preferences: [...current.preferences, { id: "cooldownRecoveryRate", weight: 2 }] });
  });

  it("resets ephemeral filters when the focus skill changes, without issuing settings changes", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SkillSupportControls preset={preset} settings={settings(["hourglass"])} onChange={onChange} disabled={false} />);
    fireEvent.change(search(), { target: { value: "hour" } });
    fireEvent.click(selectedOnly());
    const comet = getSkillPreferencePreset("comet")!;
    rerender(<SkillSupportControls preset={comet} settings={{ ...settings(), focusSkillId: comet.id }} onChange={onChange} disabled={false} />);
    expect((search() as HTMLInputElement).value).toBe("");
    expect((selectedOnly() as HTMLInputElement).checked).toBe(false);
    expect(screen.getByRole("checkbox", { name: "Use Spell Cascade" })).toBeDefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps filtering inside the picker instead of rerendering the parent", () => {
    let parentRenders = 0;
    function Harness() {
      parentRenders++;
      const [value, setValue] = useState(settings());
      return <SkillSupportControls preset={preset} settings={value} onChange={setValue} disabled={false} />;
    }
    render(<Harness />);
    const before = parentRenders;
    for (const value of ["z", "ze", "zen", "zenith", ""]) fireEvent.change(search(), { target: { value } });
    fireEvent.click(selectedOnly());
    expect(parentRenders).toBe(before);
  });

  it("disables the filters consistently while optimization is running", () => {
    render(<SkillSupportControls preset={preset} settings={settings()} onChange={vi.fn()} disabled={true} />);
    expect(search().matches(":disabled")).toBe(true);
    expect(selectedOnly().matches(":disabled")).toBe(true);
  });
});
