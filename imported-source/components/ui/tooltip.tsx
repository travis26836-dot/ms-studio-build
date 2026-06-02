import React from "react";
import { renderWithOptionalSlot } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
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
}: {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return <span className="sr-only">{children}</span>;
}
