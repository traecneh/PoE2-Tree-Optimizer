import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, shift, size, useClick, useDismiss, useFloating, useInteractions, useRole } from "@floating-ui/react";
import { X } from "lucide-react";

type Props = {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  describedBy?: string;
  onOpenChange?: (open: boolean) => void;
  onAction?: () => void;
  children: (close: () => void) => ReactNode;
};

// Settings and actions open on click, unlike explanatory hover tooltips.
export function ControlPopover({ label, trigger, triggerClassName = "tool-button", describedBy, onOpenChange, onAction, children }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const initialFocus = useRef<HTMLElement | null>(null);
  const changeOpen = (next: boolean) => { setOpen(next); onOpenChange?.(next); };
  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open, onOpenChange: changeOpen, placement: "bottom-end", strategy: "fixed", whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 10 }), shift({ padding: 10 }), size({ padding: 10,
      apply({ availableWidth, availableHeight, elements }) {
        Object.assign(elements.floating.style, {
          maxWidth: `${Math.max(0, availableWidth)}px`,
          maxHeight: `${Math.max(0, Math.min(480, availableHeight))}px`,
        });
      },
    })],
  });
  const click = useClick(context, { enabled: !onAction });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);
  const setFloating = useCallback((node: HTMLDivElement | null) => {
    refs.setFloating(node);
    // Do not auto-focus native settings fields and open their explanatory help.
    initialFocus.current = node?.querySelector<HTMLElement>("input:not([type='checkbox'])")
      ?? node?.querySelector<HTMLElement>(".popover-action:not(:disabled)")
      ?? node?.querySelector<HTMLElement>("button") ?? null;
  }, [refs]);

  return <>
    <button ref={refs.setReference} {...getReferenceProps({ onClick: onAction })} type="button" className={triggerClassName}
      aria-label={label} aria-describedby={describedBy} aria-haspopup={onAction ? undefined : "dialog"} aria-expanded={onAction ? undefined : open}
      aria-controls={open ? context.floatingId : undefined}>{trigger}</button>
    {open ? <FloatingPortal>
      <FloatingFocusManager context={context} modal={false} initialFocus={initialFocus}>
        <div ref={setFloating} {...getFloatingProps()} className="control-popover" aria-labelledby={id}
          style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}>
          <div className="control-popover-heading">
            <strong id={id}>{label}</strong>
            <button className="info-trigger" type="button" aria-label={`Close ${label.toLowerCase()}`} onClick={() => changeOpen(false)}>
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          {children(() => changeOpen(false))}
        </div>
      </FloatingFocusManager>
    </FloatingPortal> : null}
  </>;
}
