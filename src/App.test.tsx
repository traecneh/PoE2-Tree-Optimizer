import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lets the viewer node size be adjusted", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fixture fallback")));

    render(<App />);

    const classStart = screen.getByRole("button", { name: "Mercenary" });
    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("52");

    fireEvent.change(screen.getByLabelText("Node size"), { target: { value: "1" } });

    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("26");
  });
});
