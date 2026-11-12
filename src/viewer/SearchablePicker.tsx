import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, shift, size, useClick, useDismiss, useFloating, useInteractions, useListNavigation, useRole } from "@floating-ui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type PickerOption = { value: string; label: string; group?: string; alwaysVisible?: boolean };
type Props = {
  id: string; label: string; searchLabel: string; options: readonly PickerOption[]; selectedValues: readonly string[];
  multiple?: boolean; placeholder?: string; disabled: boolean; describedBy?: string; resetKey?: string;
  onSelect: (value: string, selected: boolean) => void;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/['\u2019]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function SearchablePicker({ id, label, searchLabel, options, selectedValues, multiple = false, placeholder = "Choose...", disabled, describedBy, resetKey, onSelect }: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const selected = new Set(selectedValues);
  const tokens = normalize(query).split(" ").filter(Boolean);
  const matches = options.filter(option => !option.alwaysVisible && tokens.every(token => normalize(option.label).includes(token)));
  const fixed = options.filter(option => option.alwaysVisible);
  const visible = tokens.length > 0 ? [...matches, ...fixed] : [...fixed, ...matches];
  const selectedLabel = multiple ? `${selected.size} selected` : options.find(option => selected.has(option.value))?.label ?? placeholder;
  const changeOpen = (next: boolean) => {
    setOpen(next && !disabled);
    if (!next) { setQuery(""); setActiveIndex(null); }
  };
  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open, onOpenChange: changeOpen, placement: "bottom-start", strategy: "fixed", whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 10 }), shift({ padding: 10 }), size({ padding: 10,
      apply({ availableHeight, availableWidth, rects, elements }) {
        Object.assign(elements.floating.style, {
          width: `${Math.min(Math.max(rects.reference.width, 320), Math.max(0, availableWidth))}px`,
          maxHeight: `${Math.max(0, Math.min(440, availableHeight))}px`,
        });
      },
    })],
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const navigation = useListNavigation(context, {
    listRef, activeIndex, onNavigate: setActiveIndex, enabled: open, loop: true,
    focusItemOnOpen: false, focusItemOnHover: false, openOnArrowKeyDown: false,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([click, dismiss, role, navigation]);
  useEffect(() => { changeOpen(false); }, [disabled, resetKey]);

  const choose = (option: PickerOption) => {
    if (disabled) return;
    onSelect(option.value, !selected.has(option.value));
    if (!multiple) changeOpen(false);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.target === searchRef.current && event.key === "Enter") {
      event.preventDefault();
      const first = tokens.length > 0 ? matches[0] : options.find(option => selected.has(option.value)) ?? visible[0];
      if (first) choose(first);
    } else if (event.target !== searchRef.current && event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); setQuery(current => current + event.key); setActiveIndex(null); searchRef.current?.focus();
    }
  };
  const groups = [...new Set(visible.map(option => option.group ?? ""))];

  return <>
    <button id={id} ref={refs.setReference} {...getReferenceProps({ onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); changeOpen(true); }
      else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); setQuery(event.key); changeOpen(true);
      }
    } })} className="searchable-picker-trigger" type="button" role="combobox" aria-label={label}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? context.floatingId : undefined}
      aria-describedby={`${uid}-value${describedBy ? ` ${describedBy}` : ""}`} disabled={disabled}
      value={multiple ? selectedValues.join(",") : selectedValues[0] ?? ""}>
      <span>{multiple ? `${placeholder}${selected.size > 0 ? ` (${selected.size})` : ""}` : selectedLabel}</span><ChevronDown size={15} aria-hidden="true" />
    </button>
    <span id={`${uid}-value`} hidden>{selectedLabel}</span>
    {open ? <FloatingPortal>
      <FloatingFocusManager context={context} modal={false} initialFocus={searchRef}>
        <div ref={refs.setFloating} {...getFloatingProps({ onKeyDown: handleKeyDown })} className="searchable-picker-popup"
          style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }} aria-label={`${label} options`}>
          <div className="picker-popup-search">
            <Search size={15} aria-hidden="true" />
            <input ref={searchRef} type="search" aria-label={searchLabel} placeholder={searchLabel} autoComplete="off" spellCheck={false}
              value={query} disabled={disabled} onChange={event => { setQuery(event.currentTarget.value); setActiveIndex(null); }} />
            <button className="info-trigger" type="button" aria-label={`Close ${label.toLowerCase()}`} onClick={() => changeOpen(false)}><X size={15} aria-hidden="true" /></button>
          </div>
          <div className="picker-popup-results" role={multiple ? undefined : "listbox"} aria-label={multiple ? undefined : label}>
            {matches.length === 0 ? <p className="picker-popup-empty">No matching {multiple ? "effects" : "skills"}.</p> : null}
            {groups.map(group => <div key={group} className="picker-option-group" role={group ? "group" : undefined} aria-label={group || undefined}>
              {group ? <div className="picker-group-label" aria-hidden="true">{group}</div> : null}
              {visible.filter(option => (option.group ?? "") === group).map(option => {
                const index = visible.indexOf(option);
                const itemProps = getItemProps({ onKeyDown: (event: KeyboardEvent) => {
                  if (multiple && event.key === "Enter") { event.preventDefault(); choose(option); }
                } });
                return multiple ? <label className={`picker-option${activeIndex === index ? " active" : ""}`} key={option.value}>
                  <input {...itemProps} ref={element => { listRef.current[index] = element; }} type="checkbox" aria-label={option.label}
                    data-picker-value={option.value} checked={selected.has(option.value)} disabled={disabled} onChange={() => choose(option)} />
                  <span>{option.label}</span>
                </label> : <button {...itemProps} ref={element => { listRef.current[index] = element; }} key={option.value}
                  className={`picker-option${activeIndex === index ? " active" : ""}`} type="button" role="option" aria-selected={selected.has(option.value)}
                  tabIndex={activeIndex === index ? 0 : -1} data-picker-value={option.value} disabled={disabled} onClick={() => choose(option)}>
                  <span>{option.label}</span><Check size={15} aria-hidden="true" className={selected.has(option.value) ? "" : "picker-check-hidden"} />
                </button>;
              })}
            </div>)}
          </div>
          <div className="picker-popup-footer">
            <span role="status" aria-live="polite" aria-atomic="true">{matches.length} {tokens.length > 0 ? matches.length === 1 ? "match" : "matches" : multiple ? "effects" : "skills"}{multiple ? `, ${selected.size} selected` : ""}</span>
            {multiple ? <button className="tool-button" type="button" onClick={() => changeOpen(false)}>Done</button> : null}
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal> : null}
  </>;
}
