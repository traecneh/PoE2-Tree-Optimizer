import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { NodeInspector } from "./NodeInspector";

describe("NodeInspector", () => {
  it("names the selected node when no allocation path exists", () => {
    render(
      <NodeInspector
        node={sampleGraph.nodes.jewel_socket}
        edges={sampleGraph.edges}
        pathStartName="Mercenary"
      />,
    );

    expect(screen.getByText("No allocatable path from Mercenary to Jewel Socket.")).not.toBeNull();
  });
});
