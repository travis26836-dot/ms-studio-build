import { Check } from "lucide-react";
import type { CanvasPreset } from "./types";

type ResizePresetGridProps = {
  presets: CanvasPreset[];
  selectedIds: string[];
  onToggle: (presetId: string) => void;
};

export function ResizePresetGrid({
  presets,
  selectedIds,
  onToggle,
}: ResizePresetGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map(preset => {
        const selected = selectedIds.includes(preset.id);
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onToggle(preset.id)}
            className={`rounded-md border p-2 text-left transition-colors ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:bg-accent"
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-card-foreground">
                  {preset.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {preset.width}x{preset.height}
                </p>
              </div>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {selected && <Check className="h-3 w-3" />}
              </span>
            </div>
            <div className="flex h-12 items-center justify-center rounded bg-background/70">
              <div
                className="max-h-9 min-h-4 rounded-sm border border-muted-foreground/30 bg-muted"
                style={{
                  aspectRatio: `${preset.width} / ${preset.height}`,
                  width:
                    preset.width >= preset.height
                      ? "72%"
                      : `${Math.max(22, (preset.width / preset.height) * 44)}%`,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
