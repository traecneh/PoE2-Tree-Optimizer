import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ViewSettings } from "./ViewSettings";

describe("View settings", () => {
  it("keeps settings out of the way and wires both controls without closing", async () => {
    const onNodeVisualScaleChange = vi.fn(), onToggleHoverPathPreview = vi.fn();
    render(<ViewSettings nodeVisualScale={3} nodeVisualScaleOptions={[1, 1.5, 2, 3]} hoverPathPreviewEnabled={false}
      onNodeVisualScaleChange={onNodeVisualScaleChange} onToggleHoverPathPreview={onToggleHoverPathPreview} />);
    expect(screen.queryByLabelText("Node size")).toBeNull();
    const trigger = screen.getByRole("button", { name: "View settings" });
    fireEvent.click(trigger);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close view settings" })));
    expect((screen.getByLabelText("Node size") as HTMLSelectElement).value).toBe("3");
    fireEvent.change(screen.getByLabelText("Node size"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByLabelText("Hover path preview"));
    expect(onNodeVisualScaleChange).toHaveBeenCalledWith(1.5);
    expect(onToggleHoverPathPreview).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(screen.getByLabelText("Hover path preview"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByLabelText("Node size")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
