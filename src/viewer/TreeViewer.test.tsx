import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { TreeViewer } from "./TreeViewer";

describe("TreeViewer", () => {
  function mockSvgCoordinateConversion(svg: SVGSVGElement, scale = 1.7) {
    Object.defineProperties(svg, {
      createSVGPoint: {
        configurable: true,
        value: () => ({
          x: 0,
          y: 0,
          matrixTransform(matrix: { scale: number }) {
            return { x: this.x * matrix.scale, y: this.y * matrix.scale };
          },
        }),
      },
      getScreenCTM: {
        configurable: true,
        value: () => ({
          inverse: () => ({ scale }),
        }),
      },
    });
  }

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

  it("pans in viewBox units and resets the pan", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 140, clientY: 120 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(68 34) scale(1)");

    fireEvent.click(screen.getByRole("button", { name: "Reset View" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("keeps pan distance consistent after zooming", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.wheel(svg, { deltaY: -100 });
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 144, clientY: 122 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(68 34) scale(1.1)");
  });

  it("does not pan below the drag threshold", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 103, clientY: 100 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("does not select a node after dragging from it", () => {
    const onSelectNode = vi.fn();

    render(<TreeViewer graph={sampleGraph} onSelectNode={onSelectNode} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const node = screen.getByRole("button", { name: "Mercenary" });
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(node, { pointerId: 1, clientX: 120, clientY: 100 });
    fireEvent.pointerUp(node, { pointerId: 1 });
    fireEvent.click(node);

    expect(onSelectNode).not.toHaveBeenCalled();
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
