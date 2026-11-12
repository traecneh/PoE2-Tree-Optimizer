import { defineConfig } from "vitest/config";
import { availableParallelism } from "node:os";

export default defineConfig({
  test: {
    // Keep DOM-heavy suites from competing across every core on larger hosts.
    maxWorkers: Math.min(4, availableParallelism()),
    projects: [
      { test: {
        name: "node", environment: "node", globals: true,
        include: ["src/**/*.test.ts", "tools/coverage/**/*.test.ts", "tools/validation/**/*.test.mjs", "scripts/**/*.test.mjs"],
        exclude: ["src/app/use*.test.ts", "src/tree/savedBuilds.test.ts"],
      } },
      { test: {
        name: "dom", environment: "jsdom", globals: true,
        include: ["src/**/*.test.tsx", "src/app/use*.test.ts", "src/tree/savedBuilds.test.ts"],
      } },
    ],
  },
});
