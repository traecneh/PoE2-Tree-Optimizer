import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  buildClassStartOptions,
} from "../tree/classStartAliases";
import { publicAssetPath } from "../tree/publicAssetPaths";
import { sampleGraph } from "../tree/sampleGraph";
import type { TreeGraph } from "../tree/types";

export type GraphLoadStatus = "loading" | "loaded" | "fallback";

type UseGraphPathStartStateOptions = {
  initialGraph?: TreeGraph;
  loadGraph?: () => Promise<TreeGraph>;
};

export function useGraphPathStartState({
  initialGraph = sampleGraph,
  loadGraph = loadPublicTreeGraph,
}: UseGraphPathStartStateOptions = {}) {
  const [graph, setGraph] = useState<TreeGraph>(initialGraph);
  const [graphLoadStatus, setGraphLoadStatus] = useState<GraphLoadStatus>("loading");
  const [selectedClassStartId, setSelectedClassStartId] = useState<string | undefined>();
  const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>();

  const classStartOptions = useMemo(
    () => buildClassStartOptions(graph),
    [graph],
  );
  const selectedClassStartOption = useMemo(
    () => (selectedClassStartId
      ? classStartOptions.find((option) => option.id === selectedClassStartId)
      : undefined),
    [classStartOptions, selectedClassStartId],
  );
  const selectedAscendancy = selectedClassStartOption?.ascendancy;

  useLayoutEffect(() => {
    const currentOption = selectedClassStartId
      ? classStartOptions.find((option) => option.id === selectedClassStartId)
      : undefined;
    const nextOption = currentOption
      ?? (pathStartNodeId ? classStartOptions.find((option) => option.nodeId === pathStartNodeId) : undefined)
      ?? classStartOptions[0];

    if (nextOption?.id !== selectedClassStartId) {
      setSelectedClassStartId(nextOption?.id);
    }
    if (nextOption?.nodeId !== pathStartNodeId) {
      setPathStartNodeId(nextOption?.nodeId);
    }
  }, [classStartOptions, pathStartNodeId, selectedClassStartId]);

  useEffect(() => {
    let active = true;

    loadGraph()
      .then((loaded) => {
        if (!active) return;
        setGraph(loaded);
        setGraphLoadStatus("loaded");
      })
      .catch(() => {
        if (!active) return;
        setGraph(initialGraph);
        setGraphLoadStatus("fallback");
      });

    return () => {
      active = false;
    };
  }, [initialGraph, loadGraph]);

  return {
    graph,
    graphLoadStatus,
    classStartOptions,
    selectedClassStartId,
    setSelectedClassStartId,
    selectedClassStartOption,
    selectedAscendancy,
    pathStartNodeId,
    setPathStartNodeId,
  };
}

async function loadPublicTreeGraph(): Promise<TreeGraph> {
  const response = await fetch(publicAssetPath("tree-graph.json"));
  if (!response.ok) throw new Error("Could not load passive tree graph.");
  return response.json();
}
