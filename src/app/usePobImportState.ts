import { useCallback, useState } from "react";
import type { PobBuildImportStatus } from "../viewer/BuildGoalsPanel";

export function usePobImportState() {
  const [pobImportCode, setPobImportCode] = useState("");
  const [pobImportStatus, setPobImportStatus] = useState<PobBuildImportStatus>({ kind: "idle" });
  const clearPobImportStatus = useCallback(() => {
    setPobImportStatus({ kind: "idle" });
  }, []);
  const clearPobImport = useCallback(() => {
    setPobImportCode("");
    setPobImportStatus({ kind: "idle" });
  }, []);

  return {
    pobImportCode,
    setPobImportCode,
    pobImportStatus,
    setPobImportStatus,
    clearPobImport,
    clearPobImportStatus,
  };
}
