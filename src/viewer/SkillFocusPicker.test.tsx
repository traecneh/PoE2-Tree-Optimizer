import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { skillPreferencePresets } from "../tree/skillPreferencePresets";
import { SkillFocusPicker } from "./SkillFocusPicker";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

const props = { value: "fireball", onChange: vi.fn(), disabled: false, help: "Skill help" };
const trigger = () => screen.getByRole("combobox", { name: "Skill" }) as HTMLButtonElement;
const search = () => screen.getByRole("searchbox", { name: "Search skills" }) as HTMLInputElement;
const ids = () => screen.getAllByRole("option").map(option => option.getAttribute("data-picker-value"));
async function open() {
  fireEvent.click(trigger());
  await screen.findByRole("dialog", { name: "Skill options" });
  await waitFor(() => expect(document.activeElement).toBe(search()));
}

describe("integrated skill dropdown", () => {
  it("shows the selected skill in one closed control with no separate search field", () => {
    render(<SkillFocusPicker {...props} />);
    expect(trigger().textContent).toBe("Fireball");
    expect(trigger().value).toBe("fireball");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("opens with an automatically focused search and the complete catalog", async () => {
    render(<SkillFocusPicker {...props} />);
    await open();
    expect(ids()).toEqual(["", ...skillPreferencePresets.map(skill => skill.id)]);
    expect(screen.getByRole("option", { name: "Fireball" }).getAttribute("aria-selected")).toBe("true");
  });

  it.each(["  MARK sNiPeRs ", "Sniper\u2019s-Mark"])("filters names for %s without changing the selected skill", async query => {
    const onChange = vi.fn();
    render(<SkillFocusPicker {...props} onChange={onChange} />);
    await open();
    fireEvent.change(search(), { target: { value: query } });
    expect(ids()).toEqual(["snipers-mark", ""]);
    expect(trigger().value).toBe("fireball");
    expect(screen.getByRole("status").textContent).toBe("1 match");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps manual mode available without selecting it on Enter when nothing matches", async () => {
    const onChange = vi.fn();
    render(<SkillFocusPicker {...props} onChange={onChange} />);
    await open();
    fireEvent.change(search(), { target: { value: "no-such-skill-12345" } });
    expect(ids()).toEqual([""]);
    expect(screen.getByText("No matching skills.")).toBeDefined();
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(search(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger());
    expect(trigger().value).toBe("fireball");
    await open();
    expect(search().value).toBe("");
  });

  it("selects a filtered result, closes and restores focus to the updated trigger", async () => {
    function Harness() {
      const [value, setValue] = useState("fireball");
      return <SkillFocusPicker {...props} value={value} onChange={setValue} />;
    }
    render(<Harness />);
    await open();
    fireEvent.change(search(), { target: { value: "comet" } });
    fireEvent.keyDown(search(), { key: "Enter" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger().textContent).toBe("Comet");
    expect(document.activeElement).toBe(trigger());
  });

  it("does not reset supports by reselecting the current skill", async () => {
    const onChange = vi.fn();
    render(<SkillFocusPicker {...props} onChange={onChange} />);
    await open();
    fireEvent.click(screen.getByRole("option", { name: "Fireball" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("navigates filtered options with arrow keys", async () => {
    render(<SkillFocusPicker {...props} />);
    await open();
    fireEvent.change(search(), { target: { value: "comet" } });
    fireEvent.keyDown(search(), { key: "ArrowDown" });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("option", { name: "Comet" })));
  });

  it("closes on external focus changes and when editing becomes disabled", async () => {
    const { rerender } = render(<SkillFocusPicker {...props} />);
    await open();
    fireEvent.change(search(), { target: { value: "arrow" } });
    rerender(<SkillFocusPicker {...props} value="comet" />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger().textContent).toBe("Comet");
    await open();
    expect(search().value).toBe("");
    rerender(<SkillFocusPicker {...props} value="comet" disabled />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger().disabled).toBe(true);
  });

  it("keeps filtering local instead of rerendering the build", async () => {
    let renders = 0;
    function Harness() { renders++; return <SkillFocusPicker {...props} />; }
    render(<Harness />);
    const before = renders;
    await open();
    for (const value of ["c", "co", "com", "comet", ""]) fireEvent.change(search(), { target: { value } });
    expect(renders).toBe(before);
  });

  it.each(["comet", ""])("preserves priorities and budgets while clearing old focus-specific choices for '%s'", async id => {
    const current: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: "mortar-cannon", extraPointBudget: 8,
      pointBudgetMode: "all-available", preferences: [{ id: "energyShield", weight: 3 }], supportGemIds: ["magnified-area-i"],
      socketedGrenadeId: "explosive-grenade", socketedProxySkillId: "fireball" };
    const onChange = vi.fn();
    render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await open();
    fireEvent.change(search(), { target: { value: "comet" } });
    const popup = screen.getByRole("dialog", { name: "Skill options" });
    fireEvent.click(within(popup).getByRole("option", { name: id ? "Comet" : "None (manual preferences)" }));
    expect(onChange.mock.calls).toEqual([[{ mode: "weighted", focusSkillId: id || undefined, extraPointBudget: 8,
      pointBudgetMode: "all-available", preferences: current.preferences, supportGemIds: undefined, socketedGrenadeId: undefined }]]);
  });
});
