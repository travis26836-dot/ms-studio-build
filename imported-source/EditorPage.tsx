import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import Editor from "./Editor";

export default function EditorPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const w = parseInt(params.get("w") || "1080", 10);
  const h = parseInt(params.get("h") || "1080", 10);
  const projectId = params.get("project") ? parseInt(params.get("project")!, 10) : undefined;
  const templateId = params.get("template") ? parseInt(params.get("template")!, 10) : undefined;

  // If template ID is provided, fetch the template data
  const { data: template, isLoading: templateLoading } = trpc.templates.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  // If project ID is provided, fetch the project data
  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  if ((templateId && templateLoading) || (projectId && projectLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading design...</p>
        </div>
      </div>
    );
  }

  // Determine template data to pass
  let templateData: string | undefined;
  if (template?.canvasData) {
    templateData = typeof template.canvasData === "string"
      ? template.canvasData
      : JSON.stringify(template.canvasData);
  } else if (project?.canvasData) {
    templateData = typeof project.canvasData === "string"
      ? project.canvasData
      : JSON.stringify(project.canvasData);
  }

  return (
    <Editor
      canvasWidth={w}
      canvasHeight={h}
      projectId={projectId}
      templateData={templateData}
    />
  );
}
