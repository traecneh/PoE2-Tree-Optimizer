import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { PassivePreferenceControls } from "./PassivePreferenceControls";

describe("PassivePreferenceControls point budget", () => {
  it("defaults to extra points with a bounded input and both budget choices", () => {
    render(<PassivePreferenceControls settings={weightedSettings()} onChange={vi.fn()} disabled={false} />);

    const budgetMode = screen.getByRole("combobox", { name: "Point budget" }) as HTMLSelectElement;
    expect(budgetMode.value).toBe("extra");
    expect(Array.from(budgetMode.options, (option) => option.value)).toEqual(["extra", "all-available"]);
    expect((within(budgetMode).getByRole("option", { name: "Use all available (123 total)" }) as HTMLOptionElement).value)
      .toBe("all-available");

    const extraPoints = screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement;
    expect(extraPoints.value).toBe("7");
    expect(extraPoints.min).toBe("0");
    expect(extraPoints.max).toBe("123");
    expect(extraPoints.step).toBe("1");
    expect((screen.getByRole("button", { name: "Decrease extra points" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Increase extra points" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/points reserved for weapon sets/)).toBeNull();
  });

  it("preserves the edited extra budget and preferences when switching to all available and back", () => {
    const settings = weightedSettings();
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);

    fireEvent.change(screen.getByRole("spinbutton", { name: "Extra points" }), { target: { value: "9" } });

    const editedSettings = onChange.mock.calls[0][0];
    expect(editedSettings).toEqual({ ...settings, extraPointBudget: 9 });
    rerender(<PassivePreferenceControls settings={editedSettings} onChange={onChange} disabled={false} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Point budget" }), { target: { value: "all-available" } });

    const allAvailableSettings = onChange.mock.calls[1][0];
    expect(allAvailableSettings).toEqual({ ...editedSettings, pointBudgetMode: "all-available" });
    rerender(<PassivePreferenceControls settings={allAvailableSettings} onChange={onChange} disabled={false} />);

    expect(screen.queryByRole("spinbutton", { name: "Extra points" })).toBeNull();
    const budgetMode = screen.getByRole("combobox", { name: "Point budget" }) as HTMLSelectElement;
    expect(budgetMode.value).toBe("all-available");
    expect(budgetMode.selectedOptions[0].textContent).toBe("Use all available (123 total)");
    expect(screen.queryByText(/points reserved for weapon sets/)).toBeNull();

    fireEvent.change(budgetMode, { target: { value: "extra" } });

    const restoredSettings = onChange.mock.calls[2][0];
    expect(restoredSettings).toMatchObject(editedSettings);
    expect(restoredSettings.pointBudgetMode ?? "extra").toBe("extra");
    rerender(<PassivePreferenceControls settings={restoredSettings} onChange={onChange} disabled={false} />);

    expect((screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement).value).toBe("9");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(settings).toEqual(weightedSettings());
  });

  it("increments and decrements extra points by one using complete settings snapshots", () => {
    const settings = weightedSettings();
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Increase extra points" }));

    const increasedSettings = onChange.mock.calls[0][0];
    expect(increasedSettings).toEqual({ ...settings, extraPointBudget: 8 });
    rerender(<PassivePreferenceControls settings={increasedSettings} onChange={onChange} disabled={false} />);
    expect((screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement).value).toBe("8");

    fireEvent.click(screen.getByRole("button", { name: "Decrease extra points" }));

    expect(onChange).toHaveBeenNthCalledWith(2, settings);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(settings).toEqual(weightedSettings());
  });

  it.each([
    { budget: 0, blocked: "Decrease extra points", allowed: "Increase extra points", nextBudget: 1 },
    { budget: 123, blocked: "Increase extra points", allowed: "Decrease extra points", nextBudget: 122 },
  ])("disables the outward stepper at $budget and re-enables it after stepping inward", ({ budget, blocked, allowed, nextBudget }) => {
    const settings = { ...weightedSettings(), extraPointBudget: budget };
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);

    const blockedButton = screen.getByRole("button", { name: blocked }) as HTMLButtonElement;
    const allowedButton = screen.getByRole("button", { name: allowed }) as HTMLButtonElement;
    expect(blockedButton.disabled).toBe(true);
    expect(allowedButton.disabled).toBe(false);
    fireEvent.click(blockedButton);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(allowedButton);

    const nextSettings = onChange.mock.calls[0][0];
    expect(nextSettings).toEqual({ ...settings, extraPointBudget: nextBudget });
    rerender(<PassivePreferenceControls settings={nextSettings} onChange={onChange} disabled={false} />);

    const returnButton = screen.getByRole("button", { name: blocked }) as HTMLButtonElement;
    expect(returnButton.disabled).toBe(false);
    fireEvent.click(returnButton);
    expect(onChange).toHaveBeenNthCalledWith(2, settings);
    rerender(<PassivePreferenceControls settings={onChange.mock.calls[1][0]} onChange={onChange} disabled={false} />);

    expect((screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement).value).toBe(String(budget));
    expect((screen.getByRole("button", { name: blocked }) as HTMLButtonElement).disabled).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it.each(["extra", "all-available"] as const)("disables controls while running in %s mode", (pointBudgetMode) => {
    const settings = { ...weightedSettings(), pointBudgetMode };
    const onChange = vi.fn();
    render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled />);

    expect(screen.getByRole("combobox", { name: "Point budget" }).matches(":disabled")).toBe(true);
    for (const role of ["radio", "combobox", "spinbutton", "button"]) {
      for (const control of screen.queryAllByRole(role)) {
        expect(control.matches(":disabled")).toBe(true);
      }
    }
    if (pointBudgetMode === "extra") {
      expect(screen.getByRole("spinbutton", { name: "Extra points" }).matches(":disabled")).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Decrease extra points" }));
      fireEvent.click(screen.getByRole("button", { name: "Increase extra points" }));
    } else {
      expect(screen.queryByRole("spinbutton", { name: "Extra points" })).toBeNull();
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the weapon-set reserve with a 99-point main limit in all-available mode", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), pointBudgetMode: "all-available" };
    const onChange = vi.fn();
    render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} mainPointLimit={99} />);

    expect(screen.getByText("24 points reserved for weapon sets.")).not.toBeNull();
    expect(within(screen.getByRole("combobox", { name: "Point budget" }))
      .getByRole("option", { name: "Use all available (123 total)" })).not.toBeNull();
    expect(settings.extraPointBudget).toBe(7);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides weighted budget controls for the shortest objective", () => {
    render(<PassivePreferenceControls settings={{ ...weightedSettings(), mode: "shortest" }} onChange={vi.fn()} disabled={false} />);

    expect(screen.queryByRole("combobox", { name: "Point budget" })).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: "Extra points" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decrease extra points" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Increase extra points" })).toBeNull();
  });
});

function weightedSettings(): PassiveOptimizationSettings {
  return { mode: "weighted", extraPointBudget: 7, preferences: [{ id: "life", weight: 2 }] };
}
