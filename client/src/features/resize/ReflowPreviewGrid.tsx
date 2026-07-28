import { Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AcceptedReflowAction, ReflowResult } from "./types";
import { ReflowWarningList } from "./ReflowWarningList";

type ReflowPreviewGridProps = {
  previews: ReflowResult[];
  acceptedByPreviewId: Map<string, AcceptedReflowAction>;
  acceptingPreviewId: string | null;
  onAccept: (preview: ReflowResult) => void;
  onReject: (previewId: string) => void;
  onOpenProject: (projectId: string, preview: ReflowResult) => void;
};

export function ReflowPreviewGrid({
  previews,
  acceptedByPreviewId,
  acceptingPreviewId,
  onAccept,
  onReject,
  onOpenProject,
}: ReflowPreviewGridProps) {
  if (previews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {previews.map(preview => {
        const accepted = acceptedByPreviewId.get(preview.id);
        return (
          <div
            key={preview.id}
            className="rounded-md border border-border bg-card p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-card-foreground">
                  {preview.preset.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {preview.preset.width}x{preview.preset.height}
                </p>
              </div>
              <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {preview.warnings.length} warning
                {preview.warnings.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-secondary">
              <div
                className="max-h-20 rounded-sm border border-primary/30 bg-background shadow-sm"
                style={{
                  aspectRatio: `${preview.preset.width} / ${preview.preset.height}`,
                  width:
                    preview.preset.width >= preview.preset.height
                      ? "78%"
                      : `${Math.max(
                          20,
                          (preview.preset.width / preview.preset.height) * 58
                        )}%`,
                }}
              />
            </div>

            <div className="mb-3 space-y-1">
              {preview.diff.summary.map(item => (
                <p key={item} className="text-[11px] text-muted-foreground">
                  {item}
                </p>
              ))}
            </div>

            <ReflowWarningList warnings={preview.warnings} />

            <div className="mt-3 grid grid-cols-2 gap-2">
              {accepted ? (
                <Button
                  type="button"
                  size="sm"
                  className="col-span-2 h-8 text-xs"
                  onClick={() => onOpenProject(accepted.projectId, preview)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open Design
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={acceptingPreviewId === preview.id}
                    onClick={() => onAccept(preview)}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs"
                    onClick={() => onReject(preview.id)}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
