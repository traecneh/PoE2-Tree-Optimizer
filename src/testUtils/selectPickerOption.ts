import { fireEvent, waitFor } from "@testing-library/react";

export async function openPicker(trigger: HTMLElement) {
  if (trigger.getAttribute("aria-expanded") !== "true") fireEvent.click(trigger);
  return waitFor(() => {
    const popup = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
    if (!popup || popup.style.visibility === "hidden") throw new Error("Picker is not positioned yet.");
    return popup;
  });
}

export function selectPickerOption(trigger: HTMLElement, value: string) {
  if (trigger.matches(":disabled")) return;
  if (trigger.getAttribute("aria-expanded") !== "true") fireEvent.click(trigger);
  const popup = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
  const item = Array.from(popup?.querySelectorAll<HTMLElement>("[data-picker-value]") ?? [])
    .find(element => element.getAttribute("data-picker-value") === value);
  if (!item) throw new Error(`Picker option '${value}' was not found for '${trigger.getAttribute("aria-label")}'.`);
  if (!(item instanceof HTMLInputElement) || !item.checked) fireEvent.click(item);
  const done = Array.from(popup?.querySelectorAll("button") ?? []).find(button => button.textContent === "Done");
  if (done?.isConnected) fireEvent.click(done);
}
