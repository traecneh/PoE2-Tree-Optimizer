import { memo, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { autoUpdate, flip, FloatingFocusManager, FloatingPortal, hide, offset, safePolygon, shift, size, useClick, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole } from "@floating-ui/react";
import { Info, X } from "lucide-react";

type ControlTooltipProps = {
  id: string;
  text: ReactNode;
  children?: ReactNode;
  block?: boolean;
  className?: string;
  detailsLabel?: string;
  triggerClassName?: string;
  deferContent?: boolean;
};

export function ControlTooltip({ id, text, children, block = false, className, detailsLabel, triggerClassName, deferContent = false }: ControlTooltipProps) {
  const [open, setOpen] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  const restoringFocus = useRef(false);
  const interactive = !!detailsLabel;
  const { refs, floatingStyles, context, isPositioned, middlewareData } = useFloating({
    open, onOpenChange: setOpen, placement: "bottom-start", strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 10 }), shift({ padding: 10, crossAxis: true }), size({
      padding: 10,
      apply({ availableHeight, availableWidth, elements }) {
        Object.assign(elements.floating.style, {
          maxHeight: `${Math.max(0, Math.min(480, availableHeight))}px`,
          maxWidth: `${Math.max(0, availableWidth)}px`,
        });
      },
    }), hide()],
  });
  const hover = useHover(context, { enabled: !suppressed, mouseOnly: true, move: false, delay: { open: 180, close: 0 }, handleClose: safePolygon() });
  // Info buttons must reopen on focus even after Escape dismissed hover-only help.
  const focus = useFocus(context, { enabled: !suppressed && !interactive });
  const click = useClick(context, { enabled: interactive });
  const dismiss = useDismiss(context, { referencePress: !interactive });
  const role = useRole(context, { role: interactive ? "dialog" : "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, click, dismiss, role]);

  useEffect(() => { if (middlewareData.hide?.referenceHidden) setOpen(false); }, [middlewareData.hide?.referenceHidden]);

  useEffect(() => {
    if (!open) return;
    const closeOther = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) setOpen(false); };
    document.dispatchEvent(new CustomEvent("poe2-help-open", { detail: id }));
    document.addEventListener("poe2-help-open", closeOther);
    return () => document.removeEventListener("poe2-help-open", closeOther);
  }, [id, open]);

  const classNames = [
    "control-tooltip",
    block ? "control-tooltip-block" : undefined,
    interactive ? "info-tooltip" : undefined,
    className,
  ].filter(Boolean).join(" ");

  const returnToTrigger = () => {
    if (!interactive) return;
    restoringFocus.current = true;
    (refs.domReference.current as HTMLElement | null)?.focus({ preventScroll: true });
    queueMicrotask(() => { restoringFocus.current = false; });
  };
  const surface = <div ref={refs.setFloating} {...getFloatingProps({ onKeyDown: (event: KeyboardEvent) => { if (event.key === "Escape") { returnToTrigger(); setOpen(false); } } })} data-help-for={id}
    className={`floating-help ${interactive ? "floating-help-details" : ""} ${className ?? ""}`}
    style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }} aria-label={detailsLabel}>
    {interactive ? <div className="floating-help-heading">
      <strong>{detailsLabel}</strong>
      <button className="info-trigger" type="button" aria-label="Close details" onClick={() => { returnToTrigger(); setOpen(false); }}><X size={14} aria-hidden="true" /></button>
    </div> : null}
    <div className="floating-help-body">{text}</div>
  </div>;

  return (
    <span className={classNames} ref={interactive ? undefined : refs.setReference}
      {...(interactive ? {} : getReferenceProps({
        onPointerDown: () => { setOpen(false); setSuppressed(true); },
        onClick: () => { setOpen(false); setSuppressed(true); },
        onInput: () => { setOpen(false); setSuppressed(true); },
        onMouseLeave: () => setSuppressed(false),
        onBlur: () => setSuppressed(false),
        onKeyDown: (event: KeyboardEvent) => {
          if ((event.target as HTMLElement).matches("input, select, textarea") && event.key !== "Tab") { setOpen(false); setSuppressed(true); }
        },
      }))}>
      {interactive ? <button ref={refs.setReference} {...getReferenceProps({
        onFocus: (event: FocusEvent<HTMLButtonElement>) => {
          if (!restoringFocus.current) context.onOpenChange(true, event.nativeEvent, "focus");
        },
      })} className={triggerClassName ?? "info-trigger"} type="button"
        aria-label={detailsLabel} aria-describedby={id} aria-expanded={open} aria-controls={open ? context.floatingId : undefined}>
        {children ?? <Info size={14} aria-hidden="true" />}
      </button> : children}
      <span id={id} className="control-tooltip-content" role="tooltip" hidden>{deferContent && !open ? null : text}</span>
      {open ? <FloatingPortal>
        {interactive ? <FloatingFocusManager context={context} modal={false} initialFocus={-1} returnFocus={false}>{surface}</FloatingFocusManager> : surface}
      </FloatingPortal> : null}
    </span>
  );
}

export const InfoTooltip = memo(function InfoTooltip({ id, label, children, deferContent }: { id: string; label: string; children: ReactNode; deferContent?: boolean }) {
  return <ControlTooltip id={id} detailsLabel={label} text={children} deferContent={deferContent} />;
});
