import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { TreeNode } from "../tree/types";

export const ascendancyInspectionLeaveDelayMs = 120;

export function ascendancyIdFromTarget(target: EventTarget | null): string | undefined {
  return target instanceof Element ? target.closest("[data-ascendancy-id]")?.getAttribute("data-ascendancy-id") ?? undefined : undefined;
}

// Hover updates only the old/new cluster's elements, not React's full tree.
export function useAscendancyInspection(
  rootRef: RefObject<HTMLDivElement | null>,
  nodes: Record<string, TreeNode>,
  activeAscendancyId: string | undefined,
  onDismiss: () => void,
) {
  const elementsById = useRef(new Map<string, Element[]>());
  const namesById = useRef(new Map<string, string>());
  const state = useRef<{ pointer?: string; focus?: string; touch?: string; shown?: string; active?: string; keyboard: boolean }>({ keyboard: true });
  const leaveTimer = useRef<number | undefined>(undefined);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const display = useCallback((id: string | undefined) => {
    const next = id && id !== state.current.active && elementsById.current.has(id) ? id : undefined;
    if (next === state.current.shown) return;
    for (const element of elementsById.current.get(state.current.shown ?? "") ?? []) element.classList.remove("ascendancy-inspected");
    for (const element of elementsById.current.get(next ?? "") ?? []) element.classList.add("ascendancy-inspected");
    state.current.shown = next;
    if (rootRef.current) {
      if (next) rootRef.current.dataset.inspectedAscendancy = next;
      else delete rootRef.current.dataset.inspectedAscendancy;
      const name = rootRef.current.querySelector<HTMLElement>(".ascendancy-inspection-name");
      if (name) { name.textContent = namesById.current.get(next ?? "") ?? ""; name.hidden = !next; }
    }
  }, [rootRef]);

  const refresh = useCallback((delay: boolean) => {
    const next = state.current.focus ?? state.current.pointer ?? state.current.touch;
    if (!next && delay) {
      if (!state.current.shown || leaveTimer.current !== undefined) return;
      leaveTimer.current = window.setTimeout(() => { leaveTimer.current = undefined; display(undefined); }, ascendancyInspectionLeaveDelayMs);
    } else {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = undefined;
      display(next);
    }
  }, [display]);

  const clear = useCallback(() => {
    state.current.pointer = state.current.focus = state.current.touch = undefined;
    refresh(false);
    dismissRef.current();
  }, [refresh]);

  const setPointer = useCallback((id: string | undefined) => {
    state.current.keyboard = false;
    state.current.focus = undefined;
    state.current.pointer = id === state.current.active ? undefined : id;
    refresh(true);
  }, [refresh]);

  const setFocus = useCallback((id: string | undefined) => {
    state.current.focus = state.current.keyboard && id !== state.current.active ? id : undefined;
    refresh(false);
  }, [refresh]);

  const pinTouch = useCallback((id: string) => {
    state.current.touch = id;
    refresh(false);
  }, [refresh]);

  useEffect(() => {
    clear();
    state.current.active = activeAscendancyId;
    namesById.current = new Map(Object.values(nodes).flatMap(node => node.flags.ascendancy && node.ascendancy
      ? [[node.ascendancy.id, `${node.ascendancy.className} - ${node.ascendancy.name}`] as const] : []));
    return clear;
  }, [nodes, activeAscendancyId, clear]);

  // Overlays can be added by search without changing the underlying graph.
  useEffect(() => {
    const index = new Map<string, Element[]>();
    for (const element of rootRef.current?.querySelectorAll("[data-ascendancy-id]") ?? []) {
      const id = element.getAttribute("data-ascendancy-id")!;
      const entries = index.get(id) ?? [];
      entries.push(element);
      index.set(id, entries);
    }
    elementsById.current = index;
    for (const element of index.get(state.current.shown ?? "") ?? []) element.classList.add("ascendancy-inspected");
  });

  useEffect(() => {
    const pointerDown = (event: globalThis.PointerEvent) => {
      state.current.keyboard = false;
      state.current.focus = undefined;
      if (event.pointerType === "touch") state.current.pointer = undefined;
      if (!rootRef.current?.contains(event.target as Node) || !ascendancyIdFromTarget(event.target)) clear();
      else refresh(false);
    };
    const keyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Tab" || event.key.startsWith("Arrow")) state.current.keyboard = true;
      if (event.key === "Escape") clear();
    };
    document.addEventListener("pointerdown", pointerDown, true);
    document.addEventListener("keydown", keyDown, true);
    return () => {
      document.removeEventListener("pointerdown", pointerDown, true);
      document.removeEventListener("keydown", keyDown, true);
      window.clearTimeout(leaveTimer.current);
    };
  }, [clear, refresh, rootRef]);

  return { setPointer, setFocus, pinTouch, reveal: display, clear };
}
