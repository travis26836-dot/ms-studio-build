import React from "react";
import { cn, renderWithOptionalSlot } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";
type TooltipAlign = "start" | "center" | "end";

export function TooltipProvider({
  children,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <span className="group/tooltip relative inline-flex">{children}</span>;
}

export function TooltipTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  if (asChild) {
    return renderWithOptionalSlot(children, {});
  }
  return <>{children}</>;
}

export function TooltipContent({
  children,
  side = "top",
  align = "center",
  className,
}: {
  children: React.ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  className?: string;
  hidden?: boolean;
}) {
  const sideClasses: Record<TooltipSide, string> = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  const alignClasses: Record<TooltipAlign, string> = {
    start:
      side === "top" || side === "bottom"
        ? "left-0 translate-x-0"
        : "top-0 translate-y-0",
    center: "",
    end:
      side === "top" || side === "bottom"
        ? "left-auto right-0 translate-x-0"
        : "top-auto bottom-0 translate-y-0",
  };

  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground opacity-0 shadow-md transition-opacity duration-100 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
        sideClasses[side],
        alignClasses[align],
        className ?? "text-xs"
      )}
    >
      {children}
    </span>
  );
}
