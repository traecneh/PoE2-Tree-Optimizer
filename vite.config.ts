import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function githubPagesBase(): string {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) return normalizeBase(explicitBase);

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(1);
  return normalizeBase(repositoryName ? `/${repositoryName}/` : "/PoE2-Tree-Optimizer/");
}

function normalizeBase(base: string): string {
  if (!base || base === "/") return "/";
  return base.endsWith("/") ? base : `${base}/`;
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? githubPagesBase() : "/",
  plugins: [react()],
}));
