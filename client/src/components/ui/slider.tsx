import React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
}

export function Slider({
  value,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
}: SliderProps) {
  const currentValue = value ?? defaultValue;

  return (
    <input
      type="range"
      className={cn("w-full accent-[var(--color-primary)]", className)}
      value={currentValue[0] ?? 0}
      min={min}
      max={max}
      step={step}
      onChange={event => onValueChange?.([Number(event.target.value)])}
    />
  );
}
