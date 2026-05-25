import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubTreeFetch() {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
  }

  it("lets the viewer node size be adjusted", () => {
    stubTreeFetch();

    render(<App />);

    const classStart = screen.getByRole("button", { name: "Mercenary" });
    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("52");

    fireEvent.change(screen.getByLabelText("Node size"), { target: { value: "1" } });

    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("26");
  });

  it("searches passive names and stats and highlights matching nodes", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    expect(screen.getByText("1 match")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("search-match")).toBe(true);
    expect(screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" })).not.toBeNull();
  });

  it("matches jewel sockets when searching for empty jewel slots", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });

    expect(screen.getByText("1 match")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("search-match")).toBe(true);
  });

  it("previews the allocation path from the selected class start to the selected target", () => {
    stubTreeFetch();

    render(<App />);

    expect((screen.getByLabelText("Path start") as HTMLSelectElement).value).toBe("mercenary_start");

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.getByText("Allocation path")).not.toBeNull();
    expect(screen.getByText("2 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(2);
  });
});
