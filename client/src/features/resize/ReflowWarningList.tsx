import { AlertTriangle, Info } from "lucide-react";
import type { ReflowWarning } from "./types";

type ReflowWarningListProps = {
  warnings: ReflowWarning[];
};

export function ReflowWarningList({ warnings }: ReflowWarningListProps) {
  if (warnings.length === 0) {
    return (
      <p className="rounded-md border border-border bg-secondary px-2 py-2 text-[11px] text-muted-foreground">
        No warnings.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {warnings.map(warning => {
        const Icon = warning.severity === "info" ? Info : AlertTriangle;
        return (
          <div
            key={warning.id}
            className="flex gap-2 rounded-md border border-border bg-secondary px-2 py-2"
          >
            <Icon
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                warning.severity === "critical"
                  ? "text-destructive"
                  : warning.severity === "warning"
                    ? "text-amber-500"
                    : "text-muted-foreground"
              }`}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              {warning.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
