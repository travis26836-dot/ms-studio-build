import { useMemo, useState } from "react";
import { Redo2, RefreshCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { createReflowPreview } from "./reflowEngine";
import { REFLOW_PRESETS } from "./reflowPresets";
import { BrandRuleToggles } from "./BrandRuleToggles";
import { ReflowModeSelector } from "./ReflowModeSelector";
import { ReflowPreviewGrid } from "./ReflowPreviewGrid";
import { ResizePresetGrid } from "./ResizePresetGrid";
import type {
  AcceptedReflowAction,
  BrandProfile,
  BrandRuleOptions,
  ReflowMode,
  ReflowResult,
} from "./types";

type ResizePanelEditor = {
  exportCanvas: (format: "png" | "jpg" | "json", quality?: number) => string;
};

type ResizePanelProps = {
  editor: ResizePanelEditor;
  canvasWidth: number;
  canvasHeight: number;
  projectName: string;
  brandProfile: BrandProfile | null;
  onOpenProject: (projectId: string, preview: ReflowResult) => void;
};

const DEFAULT_SELECTED_PRESETS = [
  "instagram-story",
  "facebook-post",
  "youtube-thumbnail",
];

const DEFAULT_BRAND_RULES: BrandRuleOptions = {
  preserveColors: true,
  preserveFonts: true,
  preserveTextHierarchy: true,
};

export function ResizePanel({
  editor,
  canvasWidth,
  canvasHeight,
  projectName,
  brandProfile,
  onOpenProject,
}: ResizePanelProps) {
  const [selectedPresetIds, setSelectedPresetIds] = useState(
    DEFAULT_SELECTED_PRESETS
  );
  const [mode, setMode] = useState<ReflowMode>("balanced");
  const [brandRules, setBrandRules] =
    useState<BrandRuleOptions>(DEFAULT_BRAND_RULES);
  const [previews, setPreviews] = useState<ReflowResult[]>([]);
  const [acceptedActions, setAcceptedActions] = useState<
    AcceptedReflowAction[]
  >([]);
  const [redoActions, setRedoActions] = useState<AcceptedReflowAction[]>([]);
  const [acceptingPreviewId, setAcceptingPreviewId] = useState<string | null>(
    null
  );
  const createProject = trpc.projects.create.useMutation();
  const deleteProject = trpc.projects.delete.useMutation();
  const hasBrandProfile = Boolean(
    brandProfile &&
    (brandProfile.colors.length > 0 || brandProfile.fonts.length > 0)
  );

  const acceptedByPreviewId = useMemo(() => {
    return new Map(
      acceptedActions.map(action => [action.previewId, action] as const)
    );
  }, [acceptedActions]);

  const selectedPresets = useMemo(
    () =>
      REFLOW_PRESETS.filter(preset => selectedPresetIds.includes(preset.id)),
    [selectedPresetIds]
  );

  const togglePreset = (presetId: string) => {
    setSelectedPresetIds(current =>
      current.includes(presetId)
        ? current.filter(id => id !== presetId)
        : [...current, presetId]
    );
  };

  const handleGeneratePreviews = () => {
    if (selectedPresets.length === 0) {
      toast.error("Select at least one preset.");
      return;
    }

    const sourceDesign = editor.exportCanvas("json");
    if (!sourceDesign) {
      toast.error("Canvas is not ready. Please try again.");
      return;
    }

    try {
      const nextPreviews = selectedPresets.map(preset =>
        createReflowPreview(sourceDesign, preset, {
          mode,
          brandProfile,
          brandRules,
          sourceCanvas: {
            width: canvasWidth,
            height: canvasHeight,
          },
        })
      );
      setPreviews(nextPreviews);
      toast.success(
        `${nextPreviews.length} reflow preview${
          nextPreviews.length === 1 ? "" : "s"
        } generated.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create previews.";
      toast.error(message);
    }
  };

  const handleRejectPreview = (previewId: string) => {
    setPreviews(current => current.filter(preview => preview.id !== previewId));
  };

  const handleAcceptPreview = async (preview: ReflowResult) => {
    setAcceptingPreviewId(preview.id);

    try {
      const canvasData = JSON.stringify(preview.design);
      const resizedProjectName = `${projectName.trim() || "Untitled Design"} - ${
        preview.preset.label
      }`;
      const created = await createProject.mutateAsync({
        name: resizedProjectName,
        canvasWidth: preview.preset.width,
        canvasHeight: preview.preset.height,
        canvasData,
      });

      setAcceptedActions(current => [
        ...current,
        {
          type: "ACCEPT_REFLOW_PREVIEW",
          previewId: preview.id,
          preset: preview.preset,
          projectId: created.id,
          projectName: resizedProjectName,
          canvasData,
        },
      ]);
      setRedoActions([]);
      toast.success("Resized design created.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create resized design.";
      toast.error(message);
    } finally {
      setAcceptingPreviewId(null);
    }
  };

  const handleUndoAcceptedReflow = async () => {
    const lastAction = acceptedActions.at(-1);
    if (!lastAction) {
      return;
    }

    try {
      await deleteProject.mutateAsync({ id: lastAction.projectId });
      setAcceptedActions(current => current.slice(0, -1));
      setRedoActions(current => [lastAction, ...current]);
      toast.success("Accepted reflow removed.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to undo reflow.";
      toast.error(message);
    }
  };

  const handleRedoAcceptedReflow = async () => {
    const action = redoActions[0];
    if (!action) {
      return;
    }

    try {
      const created = await createProject.mutateAsync({
        name: action.projectName,
        canvasWidth: action.preset.width,
        canvasHeight: action.preset.height,
        canvasData: action.canvasData,
      });
      setAcceptedActions(current => [
        ...current,
        { ...action, projectId: created.id },
      ]);
      setRedoActions(current => current.slice(1));
      toast.success("Accepted reflow restored.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to redo reflow.";
      toast.error(message);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-card-foreground">
            Smart Resize
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {canvasWidth}x{canvasHeight} source
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">
            Presets
          </p>
          <ResizePresetGrid
            presets={REFLOW_PRESETS}
            selectedIds={selectedPresetIds}
            onToggle={togglePreset}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">
            Reflow Mode
          </p>
          <ReflowModeSelector value={mode} onChange={setMode} />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">
            Brand Rules
          </p>
          <BrandRuleToggles
            value={brandRules}
            hasBrandProfile={hasBrandProfile}
            onChange={setBrandRules}
          />
        </div>

        <Button
          type="button"
          className="h-8 w-full text-xs"
          onClick={handleGeneratePreviews}
        >
          <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
          Generate Previews
        </Button>

        {(acceptedActions.length > 0 || redoActions.length > 0) && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              disabled={acceptedActions.length === 0 || deleteProject.isPending}
              onClick={handleUndoAcceptedReflow}
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Undo
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              disabled={redoActions.length === 0 || createProject.isPending}
              onClick={handleRedoAcceptedReflow}
            >
              <Redo2 className="mr-1.5 h-3.5 w-3.5" />
              Redo
            </Button>
          </div>
        )}

        <ReflowPreviewGrid
          previews={previews}
          acceptedByPreviewId={acceptedByPreviewId}
          acceptingPreviewId={acceptingPreviewId}
          onAccept={handleAcceptPreview}
          onReject={handleRejectPreview}
          onOpenProject={onOpenProject}
        />
      </div>
    </ScrollArea>
  );
}
