import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ControlTooltip, InfoTooltip } from "./ControlTooltip";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";

describe("contextual help", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 100, 200, 40));
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1024);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(768);
  });
  afterEach(() => vi.restoreAllMocks());

  it("keeps descriptions available to assistive technology without displaying them by default", () => {
    render(<InfoTooltip id="effect-help" label="About this effect"><p>Secondary explanation</p></InfoTooltip>);
    const trigger = screen.getByRole("button", { name: "About this effect" });
    expect(trigger.getAttribute("aria-describedby")).toBe("effect-help");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("effect-help")?.hidden).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens details by click with working reference links and closes with Escape", async () => {
    render(<InfoTooltip id="linked-help" label="Support details"><p>Trade-off explanation</p><a href="https://example.com/">Data reference</a></InfoTooltip>);
    const trigger = screen.getByRole("button", { name: "Support details" });
    fireEvent.click(trigger);
    const popup = await screen.findByRole("dialog", { name: "Support details" });
    expect(trigger.getAttribute("aria-controls")).toBe(popup.id);
    const link = within(popup).getByRole("link", { name: "Data reference" });
    expect(link.getAttribute("href")).toBe("https://example.com/");
    await act(async () => { link.focus(); });
    fireEvent.keyDown(link, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("defers large unselected descriptions until requested and releases them after dismissal", async () => {
    render(<InfoTooltip id="deferred-help" label="Deferred details" deferContent><p>Detailed support mechanics</p></InfoTooltip>);
    expect(document.getElementById("deferred-help")?.textContent).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Deferred details" }));
    const popup = await screen.findByRole("dialog", { name: "Deferred details" });
    expect(within(popup).getByText("Detailed support mechanics")).toBeDefined();
    fireEvent.click(within(popup).getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(document.getElementById("deferred-help")?.textContent).toBe(""));
  });

  it("supports keyboard focus and an explicit close command", async () => {
    render(<InfoTooltip id="keyboard-help" label="Keyboard details">Readable explanation</InfoTooltip>);
    await act(async () => { screen.getByRole("button", { name: "Keyboard details" }).focus(); });
    const popup = await screen.findByRole("dialog", { name: "Keyboard details" });
    fireEvent.click(within(popup).getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("can be keyboard focused after dismissing help that was never focused", async () => {
    render(<InfoTooltip id="revisit-help" label="Revisited details">Explanation</InfoTooltip>);
    const trigger = screen.getByRole("button", { name: "Revisited details" });
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Revisited details" });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await act(async () => { trigger.focus(); });
    await screen.findByRole("dialog", { name: "Revisited details" });
  });

  it("dismisses on outside press and never leaves multiple help panels open", async () => {
    render(<><InfoTooltip id="first-help" label="First details">First</InfoTooltip><InfoTooltip id="second-help" label="Second details">Second</InfoTooltip></>);
    fireEvent.click(screen.getByRole("button", { name: "First details" }));
    await screen.findByRole("dialog", { name: "First details" });
    fireEvent.click(screen.getByRole("button", { name: "Second details" }));
    await screen.findByRole("dialog", { name: "Second details" });
    expect(screen.queryByRole("dialog", { name: "First details" })).toBeNull();
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("dismisses field help while clicking or typing without intercepting the control", async () => {
    const changed = vi.fn();
    render(<ControlTooltip id="select-help" text="Choose a class"><select aria-label="Class" aria-describedby="select-help" onChange={changed}><option>Witch</option><option>Huntress</option></select></ControlTooltip>);
    const select = screen.getByRole("combobox", { name: "Class" });
    await act(async () => { select.focus(); });
    await screen.findByRole("tooltip");
    fireEvent.click(select);
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    fireEvent.change(select, { target: { value: "Huntress" } });
    expect(changed).toHaveBeenCalledTimes(1);
    expect((select as HTMLSelectElement).value).toBe("Huntress");
  });

  it("opens help locally without rerendering its parent", async () => {
    let parentRenders = 0;
    function Harness() {
      parentRenders++;
      return <InfoTooltip id="isolated-help" label="Isolated details">Explanation</InfoTooltip>;
    }
    render(<Harness />);
    const before = parentRenders;
    fireEvent.click(screen.getByRole("button", { name: "Isolated details" }));
    const popup = await screen.findByRole("dialog");
    fireEvent.click(within(popup).getByRole("button", { name: "Close details" }));
    expect(parentRenders).toBe(before);
  });

  it("dismisses field help for paste and autofill input events without requiring key presses", async () => {
    render(<ControlTooltip id="paste-help" text="Paste a build"><textarea aria-label="Build code" /></ControlTooltip>);
    const field = screen.getByRole("textbox", { name: "Build code" });
    await act(async () => { field.focus(); });
    await screen.findByRole("tooltip");
    fireEvent.input(field, { target: { value: "pasted-code" } });
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    expect((field as HTMLTextAreaElement).value).toBe("pasted-code");
  });
});

describe("compact skill information", () => {
  it("keeps choices and priority changes visible while moving descriptions into separate info controls", () => {
    const onChange = vi.fn();
    render(<SkillPreferencePresetControls disabled={false} onChange={onChange} settings={{
      mode: "weighted", focusSkillId: "fireball", extraPointBudget: 8, preferences: [], supportGemIds: ["hourglass"],
    }} />);
    const preset = getSkillPreferencePreset("fireball")!;
    expect(screen.getByText(preset.description).closest("[hidden]")).not.toBeNull();
    const suggestedEffect = screen.getByRole("checkbox", { name: "Use Spell Damage for Fireball" });
    expect(suggestedEffect.closest("[hidden]")).toBeNull();
    const reason = document.getElementById("skill-suggestion-spellDamage-reason")!;
    expect(reason.hidden).toBe(true);
    expect(screen.getByRole("button", { name: "About Spell Damage for Fireball" }).closest("label")).toBeNull();
    const support = screen.getByRole("checkbox", { name: "Use Hourglass" });
    expect(support.matches(":checked")).toBe(true);
    expect(document.getElementById("support-hourglass-summary")?.hidden).toBe(true);
    expect(screen.getByRole("list", { name: "Support priority changes" }).closest("[hidden]")).toBeNull();
    expect(screen.getByRole("button", { name: "About Hourglass" }).closest("label")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
