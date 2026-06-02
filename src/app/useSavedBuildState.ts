import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createSavedBuildId as createDefaultSavedBuildId,
  loadSavedBuilds as loadDefaultSavedBuilds,
  storeSavedBuilds as storeDefaultSavedBuilds,
  type SavedBuild,
  type SavedBuildState,
} from "../tree/savedBuilds";

const defaultSavedBuildToastDurationMs = 3000;

type UseSavedBuildStateOptions = {
  createSavedBuildId?: () => string;
  loadSavedBuilds?: () => SavedBuild[];
  storeSavedBuilds?: (builds: SavedBuild[]) => void;
  getCurrentState: () => SavedBuildState;
  toastDurationMs?: number;
};

export function useSavedBuildState({
  createSavedBuildId = createDefaultSavedBuildId,
  loadSavedBuilds = loadDefaultSavedBuilds,
  storeSavedBuilds = storeDefaultSavedBuilds,
  getCurrentState,
  toastDurationMs = defaultSavedBuildToastDurationMs,
}: UseSavedBuildStateOptions) {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => loadSavedBuilds());
  const [selectedSavedBuildId, setSelectedSavedBuildId] = useState("");
  const [savedBuildName, setSavedBuildName] = useState("");
  const [savedBuildStatus, setSavedBuildStatus] = useState("");
  const [savedBuildStatusFeedbackKey, setSavedBuildStatusFeedbackKey] = useState(0);
  const savedBuildStatusTimeoutId = useRef<number | undefined>(undefined);
  const selectedSavedBuild = useMemo(
    () => savedBuilds.find((build) => build.id === selectedSavedBuildId),
    [savedBuilds, selectedSavedBuildId],
  );
  const canSaveCurrentBuild = savedBuildName.trim().length > 0;

  const updateSavedBuilds = useCallback((nextBuilds: SavedBuild[]) => {
    setSavedBuilds(nextBuilds);
    storeSavedBuilds(nextBuilds);
  }, [storeSavedBuilds]);

  const clearSavedBuildStatus = useCallback(() => {
    if (savedBuildStatusTimeoutId.current !== undefined) {
      window.clearTimeout(savedBuildStatusTimeoutId.current);
      savedBuildStatusTimeoutId.current = undefined;
    }
    setSavedBuildStatus("");
  }, []);

  const showSavedBuildStatus = useCallback((nextStatus: string) => {
    if (savedBuildStatusTimeoutId.current !== undefined) {
      window.clearTimeout(savedBuildStatusTimeoutId.current);
    }
    setSavedBuildStatus(nextStatus);
    setSavedBuildStatusFeedbackKey((currentKey) => currentKey + 1);
    savedBuildStatusTimeoutId.current = window.setTimeout(() => {
      setSavedBuildStatus("");
      savedBuildStatusTimeoutId.current = undefined;
    }, toastDurationMs);
  }, [toastDurationMs]);

  const saveCurrentBuild = useCallback(() => {
    const name = savedBuildName.trim();
    if (!name) return undefined;

    const now = new Date().toISOString();
    const existingBuild = savedBuilds.find((build) => build.id === selectedSavedBuildId);
    const nextBuild: SavedBuild = existingBuild
      ? {
        ...existingBuild,
        name,
        updatedAt: now,
        state: getCurrentState(),
      }
      : {
        id: createSavedBuildId(),
        name,
        createdAt: now,
        updatedAt: now,
        state: getCurrentState(),
      };
    const nextBuilds = existingBuild
      ? savedBuilds.map((build) => (build.id === existingBuild.id ? nextBuild : build))
      : [...savedBuilds, nextBuild];

    updateSavedBuilds(nextBuilds);
    setSelectedSavedBuildId(nextBuild.id);
    setSavedBuildName(nextBuild.name);
    showSavedBuildStatus(`Saved ${nextBuild.name}`);
    return nextBuild;
  }, [
    createSavedBuildId,
    getCurrentState,
    savedBuildName,
    savedBuilds,
    selectedSavedBuildId,
    showSavedBuildStatus,
    updateSavedBuilds,
  ]);

  const loadSavedBuild = useCallback((buildId: string): SavedBuild | undefined => {
    setSelectedSavedBuildId(buildId);
    const build = savedBuilds.find((currentBuild) => currentBuild.id === buildId);
    if (!build) {
      setSavedBuildName("");
      clearSavedBuildStatus();
      return undefined;
    }

    setSavedBuildName(build.name);
    showSavedBuildStatus(`Loaded ${build.name}`);
    return build;
  }, [clearSavedBuildStatus, savedBuilds, showSavedBuildStatus]);

  const newUnsavedBuild = useCallback((nextStatus = "New unsaved build") => {
    setSelectedSavedBuildId("");
    setSavedBuildName("");
    showSavedBuildStatus(nextStatus);
  }, [showSavedBuildStatus]);

  const deleteSelectedBuild = useCallback((): SavedBuild | undefined => {
    if (!selectedSavedBuild) return undefined;
    const deletedBuild = selectedSavedBuild;
    updateSavedBuilds(savedBuilds.filter((build) => build.id !== deletedBuild.id));
    setSelectedSavedBuildId("");
    setSavedBuildName("");
    showSavedBuildStatus(`Deleted ${deletedBuild.name}`);
    return deletedBuild;
  }, [savedBuilds, selectedSavedBuild, showSavedBuildStatus, updateSavedBuilds]);

  useEffect(() => () => {
    if (savedBuildStatusTimeoutId.current !== undefined) {
      window.clearTimeout(savedBuildStatusTimeoutId.current);
    }
  }, []);

  return {
    savedBuilds,
    selectedSavedBuild,
    selectedSavedBuildId,
    setSelectedSavedBuildId,
    savedBuildName,
    setSavedBuildName,
    savedBuildStatus,
    savedBuildStatusFeedbackKey,
    canSaveCurrentBuild,
    saveCurrentBuild,
    loadSavedBuild,
    newUnsavedBuild,
    deleteSelectedBuild,
    clearSavedBuildStatus,
  };
}
