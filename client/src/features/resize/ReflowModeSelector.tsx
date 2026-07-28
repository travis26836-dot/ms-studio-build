import type { ReflowMode } from "./types";

const MODES: Array<{ id: ReflowMode; label: string }> = [
  { id: "balanced", label: "Balanced" },
  { id: "fit", label: "Fit" },
  { id: "fill", label: "Fill" },
];

type ReflowModeSelectorProps = {
  value: ReflowMode;
  onChange: (mode: ReflowMode) => void;
};

export function ReflowModeSelector({
  value,
  onChange,
}: ReflowModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 rounded-md border border-border bg-secondary p-1">
      {MODES.map(mode => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`h-7 rounded-sm text-xs transition-colors ${
            value === mode.id
              ? "bg-background text-card-foreground shadow-sm"
              : "text-muted-foreground hover:text-card-foreground"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
