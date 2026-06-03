import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("responsive workspace styles", () => {
  it("keeps the tree viewer usable on narrow screens", () => {
    expect(styles).toContain("@media (max-width: 900px)");
    expect(styles).toContain('grid-template-areas:\n      "tree"\n      "summary"\n      "side";');
    expect(styles).toContain(".tree-viewer-shell {\n    grid-area: tree;\n    min-height: 320px;");
    expect(styles).toContain(".build-summary-panel {\n    grid-area: summary;");
    expect(styles).toContain(".side-panel {\n    grid-area: side;");
  });
});
