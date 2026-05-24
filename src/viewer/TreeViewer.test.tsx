import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { TreeViewer } from "./TreeViewer";

describe("TreeViewer", () => {
  it("resets the view after zooming", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" });
    const transformLayer = svg.querySelector("g");

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");

    fireEvent.wheel(svg, { deltaY: -100 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1.1)");

    fireEvent.click(screen.getByRole("button", { name: "Reset View" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("selects a focused node with Enter or Space", () => {
    const onSelectNode = vi.fn();

    render(<TreeViewer graph={sampleGraph} onSelectNode={onSelectNode} />);

    const node = screen.getByRole("button", { name: "Mercenary" });
    expect(node.getAttribute("tabindex")).toBe("0");

    fireEvent.keyDown(node, { key: "Enter" });
    fireEvent.keyDown(node, { key: " " });

    expect(onSelectNode).toHaveBeenNthCalledWith(1, "mercenary_start");
    expect(onSelectNode).toHaveBeenNthCalledWith(2, "mercenary_start");
  });
});
