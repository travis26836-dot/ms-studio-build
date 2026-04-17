import React from "react";
import { renderWithOptionalSlot } from "@/lib/utils";

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
  return <>{children}</>;
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
  className,
}: {
  children: React.ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  className?: string;
  hidden?: boolean;
}) {
  return <span className={className ?? "sr-only"}>{children}</span>;
}
