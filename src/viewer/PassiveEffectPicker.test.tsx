import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { passivePreferenceCatalog, type PassiveOptimizationSettings, type PassivePreference } from "../tree/passivePreferences";
import { PassiveEffectPicker } from "./PassiveEffectPicker";
import { PassivePreferenceControls } from "./PassivePreferenceControls";

const props = { preferences: [], onToggle: vi.fn(), disabled: false };
const trigger = () => screen.getByRole("combobox", { name: "Add effect preference" }) as HTMLButtonElement;
const search = () => screen.getByRole("searchbox", { name: "Search effects" }) as HTMLInputElement;
const popup = () => screen.getByRole("dialog", { name: "Add effect preference options" });
const ids = () => within(popup()).queryAllByRole("checkbox").map(option => option.getAttribute("data-picker-value"));
async function open() {
  fireEvent.click(trigger());
  await screen.findByRole("dialog", { name: "Add effect preference options" });
  await waitFor(() => expect(document.activeElement).toBe(search()));
}

describe("integrated multi-select effects", () => {
  it("uses a single closed control without a separate search field", () => {
    render(<PassiveEffectPicker {...props} preferences={[{ id: "energyShield", weight: 3 }]} />);
    expect(trigger().textContent).toBe("Choose effects (1)");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("opens the complete grouped catalog with existing selections checked", async () => {
    render(<PassiveEffectPicker {...props} preferences={[{ id: "energyShield", weight: 3 }]} />);
    await open();
    expect(within(popup()).getAllByRole("group").map(group => group.getAttribute("aria-label"))).toEqual(["Defence", "Offence", "Utility"]);
    expect(ids().length).toBe(passivePreferenceCatalog.length);
    expect(within(popup()).getByRole("checkbox", { name: "Energy Shield" }).matches(":checked")).toBe(true);
  });

  it("filters names by all tokens, ignoring case, order and punctuation", async () => {
    const onToggle = vi.fn();
    render(<PassiveEffectPicker {...props} onToggle={onToggle} />);
    await open();
    fireEvent.change(search(), { target: { value: "  rEcOuP-LIFE  " } });
    expect(ids()).toEqual(["lifeRecoup", "minionLifeRecoup"]);
    expect(within(popup()).getByRole("status").textContent).toBe("2 matches, 0 selected");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("supports repeated additions and removal without closing, hiding rows or clearing search", async () => {
    const onToggle = vi.fn();
    function Harness() {
      const [preferences, setPreferences] = useState<PassivePreference[]>([]);
      return <PassiveEffectPicker {...props} preferences={preferences} onToggle={(id, selected) => {
        onToggle(id, selected);
        setPreferences(current => selected ? [...current, { id, weight: 1 }] : current.filter(item => item.id !== id));
      }} />;
    }
    render(<Harness />);
    await open();
    fireEvent.change(search(), { target: { value: "life recoup" } });
    const life = within(popup()).getByRole("checkbox", { name: "Life Recoup" });
    fireEvent.click(life);
    fireEvent.click(within(popup()).getByRole("checkbox", { name: "Minion Life Recoup" }));
    expect(search().value).toBe("life recoup");
    expect(ids()).toEqual(["lifeRecoup", "minionLifeRecoup"]);
    expect(life.matches(":checked")).toBe(true);
    fireEvent.click(life);
    expect(life.matches(":checked")).toBe(false);
    expect(onToggle.mock.calls).toEqual([["lifeRecoup", true], ["minionLifeRecoup", true], ["lifeRecoup", false]]);
  });

  it("keeps all-selected effects available for removal", async () => {
    const onToggle = vi.fn();
    render(<PassiveEffectPicker {...props} onToggle={onToggle} preferences={passivePreferenceCatalog.map(effect => ({ id: effect.id, weight: 1 }))} />);
    await open();
    expect(within(popup()).getAllByRole("checkbox", { checked: true }).length).toBe(passivePreferenceCatalog.length);
    fireEvent.click(within(popup()).getByRole("checkbox", { name: "Maximum Life" }));
    expect(onToggle).toHaveBeenCalledWith("life", false);
  });

  it("does not cap broad matches or search descriptions", async () => {
    render(<PassiveEffectPicker {...props} />);
    await open();
    fireEvent.change(search(), { target: { value: "e" } });
    expect(ids().length).toBeGreaterThan(60);
    fireEvent.change(search(), { target: { value: "heuristic" } });
    expect(ids()).toEqual([]);
    expect(screen.getByText("No matching effects.")).toBeDefined();
  });

  it("closes with Done or Escape and clears the transient query for next time", async () => {
    render(<PassiveEffectPicker {...props} />);
    await open();
    fireEvent.change(search(), { target: { value: "minion" } });
    fireEvent.click(within(popup()).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger());
    await open();
    expect(search().value).toBe("");
    fireEvent.keyDown(search(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes and disables editing when optimization starts, leaving help accessible", async () => {
    const { rerender } = render(<PassiveEffectPicker {...props} />);
    await open();
    rerender(<PassiveEffectPicker {...props} disabled />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger().disabled).toBe(true);
    expect(screen.getByRole("button", { name: "About effect search" }).matches(":disabled")).toBe(false);
  });

  it("keeps search and navigation state local", async () => {
    let renders = 0;
    function Harness() { renders++; return <PassiveEffectPicker {...props} />; }
    render(<Harness />);
    const before = renders;
    await open();
    for (const value of ["m", "mi", "minion", ""]) fireEvent.change(search(), { target: { value } });
    expect(renders).toBe(before);
  });

  it("preserves priorities, supports and budget while toggling effects", async () => {
    const current: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: "fireball", supportGemIds: ["hourglass"],
      pointBudgetMode: "all-available", extraPointBudget: 7, preferences: [{ id: "energyShield", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={current} onChange={onChange} disabled={false} />);
    await open();
    fireEvent.change(search(), { target: { value: "maximum life" } });
    fireEvent.click(within(popup()).getByRole("checkbox", { name: "Maximum Life" }));
    const next: PassiveOptimizationSettings = { ...current, preferences: [...current.preferences, { id: "life", weight: 1 }] };
    expect(onChange.mock.calls).toEqual([[next]]);
    rerender(<PassivePreferenceControls settings={next} onChange={onChange} disabled={false} />);
    expect(search().value).toBe("maximum life");
    fireEvent.change(search(), { target: { value: "energy shield" } });
    fireEvent.click(within(popup()).getByRole("checkbox", { name: "Energy Shield" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, preferences: [{ id: "life", weight: 1 }] });
  });
});
