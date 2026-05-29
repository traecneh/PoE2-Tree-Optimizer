import type { ReactNode } from "react";

type ControlTooltipProps = {
  id: string;
  text: ReactNode;
  children: ReactNode;
  block?: boolean;
  className?: string;
};

export function ControlTooltip({ id, text, children, block = false, className }: ControlTooltipProps) {
  const classNames = [
    "control-tooltip",
    block ? "control-tooltip-block" : undefined,
    className,
  ].filter(Boolean).join(" ");

  return (
    <span className={classNames}>
      {children}
      <span id={id} className="control-tooltip-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}
