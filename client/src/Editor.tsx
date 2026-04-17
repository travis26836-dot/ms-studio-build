import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Type, Image, Square, Circle, Triangle, Star, Minus, Hexagon,
  Undo2, Redo2, ZoomIn, ZoomOut, Trash2, Copy, Lock, Unlock,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Group, Ungroup,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Download, Save, Palette, Layers, Sparkles, MessageSquare,
  FileText, LayoutTemplate, ImageIcon, Shapes, Upload, Search,
  ChevronLeft, Bold, Italic, Underline,
  Wand2, Eraser, Crop, SlidersHorizontal, Bot, Code2, Maximize2,
  Heart, Pentagon, Diamond, Loader2, Check, X, Sun, Contrast,
  Droplets, Focus, Paintbrush, RotateCcw, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CANVAS_PRESETS } from "@shared/designTypes";
import ExportDialog from "@/components/ExportDialog";
import AIChatPanel from "@/components/AIChatPanel";

type SidebarPanel = "templates" | "elements" | "text" | "uploads" | "photos" | "ai" | "brand" | "layers" | null;

interface EditorProps {
  projectId?: number;
  templateData?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export default function Editor({
  projectId,
  templateData,
  canvasWidth = 1080,
  canvasHeight = 1080,
}: EditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editor = useCanvasEditor(canvasRef, canvasWidth, canvasHeight);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | undefined>(projectId);
  const { user } = useAuth();

  const saveMutation = trpc.projects.save.useMutation();
  const createMutation = trpc.projects.create.useMutation();

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = editor.initCanvas();
      if (canvas) {
        const container = canvasContainerRef.current;
        if (container) {
          const padding = 80;
          const scaleX = (container.clientWidth - padding) / canvasWidth;
          const scaleY = (container.clientHeight - padding) / canvasHeight;
          const zoom = Math.min(scaleX, scaleY, 1);
          editor.setZoom(zoom);
        }
        if (templateData) {
          editor.loadFromJSON(templateData);
        }
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); editor.redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          editor.deleteSelected();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); editor.duplicateSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, currentProjectId]);

  const handleSave = useCallback(async () => {
    const json = editor.exportCanvas("json");
    if (!json) return;

    try {
      if (currentProjectId) {
        await saveMutation.mutateAsync({ id: currentProjectId, canvasData: json });
        toast.success("Project saved!");
      } else {
        const result = await createMutation.mutateAsync({
          name: "Untitled Design",
          canvasWidth,
          canvasHeight,
          canvasData: json,
        });
        setCurrentProjectId(result.id);
        toast.success("Project created and saved!");
      }
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }, [editor, currentProjectId, canvasWidth, canvasHeight]);

  const togglePanel = (panel: SidebarPanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const selectedObj = editor.editorState.selectedObjects[0];
  const hasSelection = editor.editorState.selectedObjects.length > 0;
  const multiSelect = editor.editorState.selectedObjects.length > 1;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-border bg-toolbar flex items-center px-3 gap-1 shrink-0">
        <Button variant="ghost" size="sm" className="text-toolbar-foreground gap-1.5 mr-2" onClick={() => window.history.back()}>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Manus Design Studio</span>
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton icon={Undo2} tooltip="Undo (Ctrl+Z)" onClick={editor.undo} />
        <ToolbarButton icon={Redo2} tooltip="Redo (Ctrl+Shift+Z)" onClick={editor.redo} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton icon={ZoomOut} tooltip="Zoom Out" onClick={() => editor.setZoom(editor.editorState.zoom - 0.1)} />
        <span className="text-xs text-muted-foreground w-12 text-center">
          {Math.round(editor.editorState.zoom * 100)}%
        </span>
        <ToolbarButton icon={ZoomIn} tooltip="Zoom In" onClick={() => editor.setZoom(editor.editorState.zoom + 0.1)} />
        <ToolbarButton icon={Maximize2} tooltip="Fit to Screen" onClick={() => {
          const container = canvasContainerRef.current;
          if (container) {
            const scaleX = (container.clientWidth - 80) / canvasWidth;
            const scaleY = (container.clientHeight - 80) / canvasHeight;
            editor.setZoom(Math.min(scaleX, scaleY, 1));
          }
        }} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {hasSelection && (
          <>
            <ToolbarButton icon={Copy} tooltip="Duplicate (Ctrl+D)" onClick={editor.duplicateSelected} />
            <ToolbarButton icon={Trash2} tooltip="Delete" onClick={editor.deleteSelected} />
            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton icon={ChevronsUp} tooltip="Bring to Front" onClick={editor.bringToFront} />
            <ToolbarButton icon={ArrowUp} tooltip="Bring Forward" onClick={editor.bringForward} />
            <ToolbarButton icon={ArrowDown} tooltip="Send Backward" onClick={editor.sendBackward} />
            <ToolbarButton icon={ChevronsDown} tooltip="Send to Back" onClick={editor.sendToBack} />
            <Separator orientation="vertical" className="h-6 mx-1" />
            {multiSelect && (
              <ToolbarButton icon={Group} tooltip="Group" onClick={editor.groupSelected} />
            )}
            {selectedObj?.type === "group" && (
              <ToolbarButton icon={Ungroup} tooltip="Ungroup" onClick={editor.ungroupSelected} />
            )}
            <ToolbarButton icon={Lock} tooltip="Toggle Lock" onClick={editor.toggleLock} />
          </>
        )}

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className={`text-toolbar-foreground gap-1.5 ${showChat ? "bg-primary/20 text-primary" : ""}`}
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">AI Chat</span>
        </Button>

        <Button variant="ghost" size="sm" className="text-toolbar-foreground gap-1.5" onClick={handleSave}>
          <Save className="w-4 h-4" />
          <span className="text-xs">Save</span>
        </Button>

        <ExportDialog
          onExport={(format, quality) => editor.exportCanvas(format, quality)}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        >
          <Button variant="default" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            <span className="text-xs">Export</span>
          </Button>
        </ExportDialog>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <div className="w-16 border-r border-border bg-toolbar flex flex-col items-center py-2 gap-1 shrink-0">
          <SidebarIcon icon={LayoutTemplate} label="Templates" active={activePanel === "templates"} onClick={() => togglePanel("templates")} />
          <SidebarIcon icon={Shapes} label="Elements" active={activePanel === "elements"} onClick={() => togglePanel("elements")} />
          <SidebarIcon icon={Type} label="Text" active={activePanel === "text"} onClick={() => togglePanel("text")} />
          <SidebarIcon icon={ImageIcon} label="Photos" active={activePanel === "photos"} onClick={() => togglePanel("photos")} />
          <SidebarIcon icon={Upload} label="Uploads" active={activePanel === "uploads"} onClick={() => togglePanel("uploads")} />
          <SidebarIcon icon={Palette} label="Brand" active={activePanel === "brand"} onClick={() => togglePanel("brand")} />
          <SidebarIcon icon={Sparkles} label="AI Tools" active={activePanel === "ai"} onClick={() => togglePanel("ai")} />
          <SidebarIcon icon={Layers} label="Layers" active={activePanel === "layers"} onClick={() => togglePanel("layers")} />
        </div>

        {/* Expandable Side Panel */}
        {activePanel && (
          <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
            <SidePanel
              panel={activePanel}
              editor={editor}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          </div>
        )}

        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 bg-canvas overflow-auto flex items-center justify-center relative"
          style={{ background: "oklch(0.18 0.005 260)" }}
        >
          <div className="relative" style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}>
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right Properties Panel */}
        {hasSelection && !showChat && (
          <div className="w-64 border-l border-border bg-card shrink-0">
            <PropertiesPanel editor={editor} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
          </div>
        )}

        {/* AI Chat Panel */}
        {showChat && (
          <div className="w-80 border-l border-border shrink-0">
            <AIChatPanel onClose={() => setShowChat(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toolbar Button ──────────────────────────────────────────
function ToolbarButton({ icon: Icon, tooltip, onClick, active }: {
  icon: React.ElementType;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 text-toolbar-foreground hover:bg-accent ${active ? "bg-accent" : ""}`}
          onClick={onClick}
        >
          <Icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ─── Sidebar Icon ────────────────────────────────────────────
function SidebarIcon({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg text-xs gap-0.5 transition-colors
        ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] leading-tight">{label}</span>
    </button>
  );
}

// ─── Side Panel Content ──────────────────────────────────────
function SidePanel({ panel, editor, searchQuery, setSearchQuery, canvasWidth, canvasHeight }: {
  panel: SidebarPanel;
  editor: ReturnType<typeof useCanvasEditor>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const panelTitles: Record<string, string> = {
    templates: "Templates",
    elements: "Elements",
    text: "Text",
    photos: "Photos",
    uploads: "Uploads",
    brand: "Brand Kit",
    ai: "AI Tools",
    layers: "Layers",
  };

  return (
    <>
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-2">{panelTitles[panel || ""]}</h3>
        {panel !== "layers" && panel !== "brand" && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-secondary border-border"
            />
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {panel === "templates" && <TemplatesPanel editor={editor} searchQuery={searchQuery} />}
          {panel === "elements" && <ElementsPanel editor={editor} />}
          {panel === "text" && <TextPanel editor={editor} />}
          {panel === "photos" && <PhotosPanel editor={editor} searchQuery={searchQuery} />}
          {panel === "uploads" && <UploadsPanel editor={editor} />}
          {panel === "brand" && <BrandPanel editor={editor} />}
          {panel === "ai" && <AIPanel editor={editor} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />}
          {panel === "layers" && <LayersPanel editor={editor} />}
        </div>
      </ScrollArea>
    </>
  );
}

// ─── Templates Panel (DB-connected) ─────────────────────────
function TemplatesPanel({ editor, searchQuery }: { editor: ReturnType<typeof useCanvasEditor>; searchQuery: string }) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { data: dbTemplates, isLoading } = trpc.templates.list.useQuery(
    activeCategory ? { category: activeCategory } : undefined
  );

  const categories = [
    { id: "menu", label: "Menus", icon: "🍽" },
    { id: "invitation", label: "Invitations", icon: "💌" },
    { id: "certificate", label: "Certificates", icon: "📜" },
    { id: "social-media", label: "Social Media", icon: "📱" },
    { id: "flyer", label: "Flyers", icon: "📄" },
    { id: "document", label: "Documents", icon: "📝" },
    { id: "presentation", label: "Presentations", icon: "📊" },
    { id: "promotional", label: "Promotional", icon: "🎯" },
  ];

  const filteredTemplates = useMemo(() => {
    if (!dbTemplates) return [];
    if (!searchQuery) return dbTemplates;
    const q = searchQuery.toLowerCase();
    return dbTemplates.filter(
      (t: any) => t.name.toLowerCase().includes(q) || (t.tags && JSON.stringify(t.tags).toLowerCase().includes(q))
    );
  }, [dbTemplates, searchQuery]);

  const handleApplyTemplate = (template: any) => {
    if (template.canvasData) {
      try {
        const data = typeof template.canvasData === "string" ? template.canvasData : JSON.stringify(template.canvasData);
        editor.loadFromJSON(data);
        toast.success(`Applied template: ${template.name}`);
      } catch {
        toast.error("Failed to load template");
      }
    }
  };

  const templateColors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#64748b"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1.5">
        <button
          className={`flex flex-col items-center p-2 rounded-lg transition-colors text-xs ${
            !activeCategory ? "bg-primary/20 text-primary" : "bg-secondary hover:bg-accent text-muted-foreground"
          }`}
          onClick={() => setActiveCategory(undefined)}
        >
          <span className="text-lg mb-0.5">✨</span>
          <span className="text-[10px]">All</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors text-xs ${
              activeCategory === cat.id ? "bg-primary/20 text-primary" : "bg-secondary hover:bg-accent text-muted-foreground"
            }`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="text-lg mb-0.5">{cat.icon}</span>
            <span className="text-[10px]">{cat.label}</span>
          </button>
        ))}
      </div>
      <Separator />
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">{filteredTemplates.length} templates</p>
          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map((t: any, i: number) => (
              <button
                key={t.id}
                className="aspect-[3/4] rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all group relative"
                style={{ background: `linear-gradient(135deg, ${templateColors[i % templateColors.length]}22, ${templateColors[i % templateColors.length]}44)` }}
                onClick={() => handleApplyTemplate(t)}
              >
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-lg mx-auto mb-1.5" style={{ background: templateColors[i % templateColors.length] }} />
                    <p className="text-[10px] text-card-foreground font-medium leading-tight">{t.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{t.canvasWidth}x{t.canvasHeight}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-xs font-medium text-primary bg-background/80 px-2 py-1 rounded">Apply</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No templates found</p>
        </div>
      )}
    </div>
  );
}

// ─── Elements Panel ──────────────────────────────────────────
function ElementsPanel({ editor }: { editor: ReturnType<typeof useCanvasEditor> }) {
  const shapes = [
    { type: "rect", label: "Rectangle", icon: Square },
    { type: "rounded-rect", label: "Rounded", icon: Square },
    { type: "circle", label: "Circle", icon: Circle },
    { type: "triangle", label: "Triangle", icon: Triangle },
    { type: "star", label: "Star", icon: Star },
    { type: "line", label: "Line", icon: Minus },
    { type: "ellipse", label: "Ellipse", icon: Circle },
    { type: "polygon", label: "Pentagon", icon: Hexagon },
  ];

  const decorativeShapes = [
    { type: "heart", label: "Heart", svgPath: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
    { type: "diamond", label: "Diamond", svgPath: "M12 2L2 12l10 10 10-10L12 2z" },
    { type: "hexagon", label: "Hexagon", svgPath: "M12 2l9.5 5.5v11L12 24l-9.5-5.5v-11L12 2z" },
    { type: "arrow", label: "Arrow", svgPath: "M5 12h14m-7-7l7 7-7 7" },
  ];

  const colors = [
    "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#64748b",
    "#000000", "#ffffff",
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-medium">Basic Shapes</p>
      <div className="grid grid-cols-4 gap-2">
        {shapes.map((s) => (
          <button
            key={s.type}
            onClick={() => editor.addShape(s.type as Parameters<typeof editor.addShape>[0])}
            className="aspect-square rounded-lg bg-secondary hover:bg-accent border border-border flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <s.icon className="w-5 h-5 text-card-foreground" />
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
          </button>
        ))}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">Quick Colors</p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => editor.addShape("rect", { fill: c, width: 100, height: 100 })}
            className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform"
            style={{ background: c }}
          />
        ))}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">Lines & Connectors</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => editor.addShape("line")}
          className="h-10 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center text-xs text-card-foreground"
        >
          <Minus className="w-5 h-5 mr-1" /> Line
        </button>
        <button
          onClick={() => editor.addShape("line", { stroke: "#6366f1", strokeWidth: 4 })}
          className="h-10 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center text-xs text-card-foreground"
        >
          <Minus className="w-5 h-5 mr-1" /> Thick
        </button>
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">Gradient Blocks</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["#6366f1", "#a855f7"],
          ["#ec4899", "#f43f5e"],
          ["#14b8a6", "#06b6d4"],
          ["#f59e0b", "#ef4444"],
          ["#22c55e", "#3b82f6"],
          ["#8b5cf6", "#ec4899"],
        ].map(([c1, c2], i) => (
          <button
            key={i}
            onClick={() => editor.addShape("rounded-rect", { fill: c1, width: 200, height: 200 })}
            className="aspect-square rounded-lg border border-border hover:scale-105 transition-transform"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Text Panel ──────────────────────────────────────────────
function TextPanel({ editor }: { editor: ReturnType<typeof useCanvasEditor> }) {
  return (
    <div className="space-y-3">
      <button
        onClick={() => editor.addHeading()}
        className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
      >
        <p className="text-lg font-bold text-card-foreground" style={{ fontFamily: "Montserrat" }}>Add a heading</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Montserrat Bold, 48px</p>
      </button>
      <button
        onClick={() => editor.addSubheading()}
        className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
      >
        <p className="text-base font-semibold text-card-foreground" style={{ fontFamily: "Poppins" }}>Add a subheading</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Poppins Semibold, 28px</p>
      </button>
      <button
        onClick={() => editor.addText()}
        className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
      >
        <p className="text-sm text-card-foreground" style={{ fontFamily: "Inter" }}>Add body text</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Inter Regular, 16px</p>
      </button>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">Font Combinations</p>
      <div className="space-y-2">
        {[
          { heading: "Playfair Display", body: "Lato", label: "Elegant", desc: "Classic serif + clean sans" },
          { heading: "Montserrat", body: "Open Sans", label: "Modern", desc: "Geometric + humanist" },
          { heading: "Poppins", body: "Roboto", label: "Clean", desc: "Round + neutral" },
          { heading: "Raleway", body: "Source Sans Pro", label: "Professional", desc: "Thin + readable" },
          { heading: "Oswald", body: "Merriweather", label: "Bold", desc: "Condensed + traditional" },
        ].map((combo) => (
          <button
            key={combo.label}
            className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
            onClick={() => {
              editor.addText({ fontFamily: combo.heading, fontSize: 36, fontWeight: "bold" });
              toast.success(`Applied ${combo.label} font combination`);
            }}
          >
            <p className="text-sm font-bold text-card-foreground" style={{ fontFamily: combo.heading }}>{combo.label}</p>
            <p className="text-[10px] text-muted-foreground">{combo.desc}</p>
          </button>
        ))}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">Text Presets</p>
      <div className="space-y-1.5">
        {[
          { text: "SALE", size: 72, weight: "900", color: "#ef4444", label: "Sale Banner" },
          { text: "Coming Soon", size: 42, weight: "300", color: "#6366f1", label: "Announcement" },
          { text: "THANK YOU", size: 48, weight: "bold", color: "#22c55e", label: "Thank You" },
          { text: "NEW", size: 64, weight: "900", color: "#f59e0b", label: "New Badge" },
        ].map((preset) => (
          <button
            key={preset.label}
            className="w-full p-2 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
            onClick={() => editor.addText({
              fontSize: preset.size,
              fontWeight: preset.weight as any,
              fill: preset.color,
              fontFamily: "Montserrat",
            } as any)}
          >
            <span className="text-xs" style={{ color: preset.color, fontWeight: preset.weight }}>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Photos Panel ────────────────────────────────────────────
function PhotosPanel({ editor, searchQuery }: { editor: ReturnType<typeof useCanvasEditor>; searchQuery: string }) {
  const [query, setQuery] = useState("");
  const effectiveQuery = searchQuery || query;
  const { data: photos, isLoading, refetch } = trpc.assets.searchPhotos.useQuery(
    { query: effectiveQuery || "nature" },
    { enabled: true }
  );

  const handleSearch = () => {
    if (query.trim()) refetch();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <Input
          placeholder="Search free photos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-8 text-xs bg-secondary"
        />
        <Button size="sm" className="h-8 px-2" onClick={handleSearch}>
          <Search className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {["Nature", "Business", "Technology", "People", "Food", "Abstract"].map((tag) => (
          <button
            key={tag}
            onClick={() => { setQuery(tag.toLowerCase()); }}
            className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Click a photo to add it to your design</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {(photos || []).map((photo: any, i: number) => (
            <button
              key={i}
              onClick={() => {
                editor.addImage(photo.url);
                toast.success("Photo added to canvas");
              }}
              className="aspect-square rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all group relative"
            >
              <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Uploads Panel ───────────────────────────────────────────
function UploadsPanel({ editor }: { editor: ReturnType<typeof useCanvasEditor> }) {
  const [uploads, setUploads] = useState<Array<{ url: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setUploads((prev) => [...prev, { url, name: file.name }]);
        editor.addImage(url);
        toast.success(`Added ${file.name}`);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    });
  }, [editor]);

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-colors bg-secondary/50">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mb-1" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
        )}
        <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload images"}</span>
        <span className="text-[10px] text-muted-foreground/60">PNG, JPG, SVG up to 10MB</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        {uploads.map((u, i) => (
          <button
            key={i}
            onClick={() => editor.addImage(u.url)}
            className="aspect-square rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all relative group"
          >
            <img src={u.url} alt={u.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white truncate">{u.name}</p>
            </div>
          </button>
        ))}
      </div>
      {uploads.length === 0 && !uploading && (
        <div className="text-center py-6 text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No uploads yet</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Upload images to use in your designs</p>
        </div>
      )}
    </div>
  );
}

// ─── Brand Kit Panel ─────────────────────────────────────────
function BrandPanel({ editor }: { editor: ReturnType<typeof useCanvasEditor> }) {
  const [brandColors, setBrandColors] = useState([
    { name: "Primary", hex: "#6366f1" },
    { name: "Secondary", hex: "#ec4899" },
    { name: "Accent", hex: "#14b8a6" },
    { name: "Dark", hex: "#1e293b" },
    { name: "Light", hex: "#f8fafc" },
  ]);
  const [newColor, setNewColor] = useState("#6366f1");

  const brandFonts = [
    { name: "Montserrat", style: "Geometric Sans" },
    { name: "Poppins", style: "Round Sans" },
    { name: "Inter", style: "Neutral Sans" },
    { name: "Playfair Display", style: "Elegant Serif" },
    { name: "Roboto", style: "Material Sans" },
    { name: "Lato", style: "Humanist Sans" },
    { name: "Oswald", style: "Condensed" },
    { name: "Raleway", style: "Thin Sans" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Brand Colors</p>
        <div className="flex flex-wrap gap-2">
          {brandColors.map((c, i) => (
            <div key={i} className="text-center">
              <button
                className="w-10 h-10 rounded-lg border border-border hover:scale-110 transition-transform"
                style={{ background: c.hex }}
                onClick={() => editor.updateActiveObject({ fill: c.hex })}
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">{c.name}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer"
          />
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-7 text-xs bg-secondary flex-1"
            placeholder="#hex"
          />
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setBrandColors([...brandColors, { name: `Color ${brandColors.length + 1}`, hex: newColor }]);
              toast.success("Color added to brand kit");
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Brand Fonts</p>
        <div className="space-y-1.5">
          {brandFonts.map((font) => (
            <button
              key={font.name}
              className="w-full p-2 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors flex items-center justify-between"
              onClick={() => {
                editor.updateActiveObject({ fontFamily: font.name });
                toast.success(`Applied ${font.name}`);
              }}
            >
              <span className="text-sm text-card-foreground" style={{ fontFamily: font.name }}>{font.name}</span>
              <span className="text-[10px] text-muted-foreground">{font.style}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Logos</p>
        <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-colors bg-secondary/50">
          <Upload className="w-4 h-4 text-muted-foreground mb-0.5" />
          <span className="text-[10px] text-muted-foreground">Upload logo</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                editor.addImage(ev.target?.result as string);
                toast.success("Logo added to canvas");
              };
              reader.readAsDataURL(file);
            }
          }} />
        </label>
      </div>
    </div>
  );
}

// ─── AI Tools Panel ──────────────────────────────────────────
function AIPanel({ editor, canvasWidth, canvasHeight }: {
  editor: ReturnType<typeof useCanvasEditor>;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [bgPrompt, setBgPrompt] = useState("");

  const generateImageMut = trpc.ai.generateImage.useMutation();
  const generateBgMut = trpc.ai.generateBackground.useMutation();
  const suggestLayoutMut = trpc.ai.suggestLayout.useMutation();

  const handleGenerateElement = async () => {
    if (!aiPrompt.trim()) return;
    toast.info("Generating with AI...");
    try {
      const result = await generateImageMut.mutateAsync({ prompt: aiPrompt });
      if (result.url) {
        await editor.addImage(result.url);
        toast.success("AI element added to canvas!");
        setAiPrompt("");
      }
    } catch {
      toast.error("Generation failed. Please try again.");
    }
  };

  const handleGenerateBackground = async () => {
    if (!bgPrompt.trim()) return;
    toast.info("Generating background...");
    try {
      const result = await generateBgMut.mutateAsync({
        prompt: bgPrompt,
        width: canvasWidth,
        height: canvasHeight,
      });
      if (result.url) {
        await editor.addImage(result.url);
        toast.success("AI background added!");
        setBgPrompt("");
      }
    } catch {
      toast.error("Background generation failed.");
    }
  };

  const handleSuggestLayout = async (purpose: string) => {
    toast.info("AI is designing a layout...");
    try {
      const result = await suggestLayoutMut.mutateAsync({
        purpose,
        canvasWidth,
        canvasHeight,
      });
      if (result.elements && result.elements.length > 0) {
        for (const el of result.elements) {
          if (el.type === "text" && el.text) {
            editor.addText({
              left: el.left,
              top: el.top,
              width: el.width,
              fontSize: el.fontSize || 24,
              fontFamily: el.fontFamily || "Inter",
              fill: el.fill || "#000000",
            } as any);
          } else {
            editor.addShape("rounded-rect", {
              left: el.left,
              top: el.top,
              width: el.width,
              height: el.height,
              fill: el.fill || "#6366f1",
            });
          }
        }
        toast.success(`Layout applied: ${result.description}`);
      }
    } catch {
      toast.error("Layout suggestion failed.");
    }
  };

  const magicResizePresets = [
    { key: "instagram-post", label: "Instagram Post", size: "1080x1080" },
    { key: "instagram-story", label: "Instagram Story", size: "1080x1920" },
    { key: "facebook-post", label: "Facebook Post", size: "1200x630" },
    { key: "youtube-thumbnail", label: "YouTube Thumb", size: "1280x720" },
    { key: "twitter-post", label: "Twitter/X Post", size: "1200x675" },
    { key: "linkedin-post", label: "LinkedIn Post", size: "1200x627" },
  ];

  return (
    <div className="space-y-3">
      {/* AI Element Generation */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Image Generation
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe an element to generate..."
          className="w-full h-16 text-xs bg-secondary rounded-md border border-border p-2 resize-none text-card-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="sm"
          className="w-full mt-1.5 h-7 text-xs"
          disabled={!aiPrompt.trim() || generateImageMut.isPending}
          onClick={handleGenerateElement}
        >
          {generateImageMut.isPending ? (
            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1" /> Generate Element</>
          )}
        </Button>
      </div>

      {/* AI Background */}
      <div className="p-3 rounded-lg bg-secondary border border-border">
        <p className="text-xs font-medium text-card-foreground mb-1.5 flex items-center gap-1">
          <Paintbrush className="w-3 h-3" /> AI Background
        </p>
        <textarea
          value={bgPrompt}
          onChange={(e) => setBgPrompt(e.target.value)}
          placeholder="Describe a background..."
          className="w-full h-12 text-xs bg-background rounded-md border border-border p-2 resize-none text-card-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="sm"
          variant="secondary"
          className="w-full mt-1.5 h-7 text-xs"
          disabled={!bgPrompt.trim() || generateBgMut.isPending}
          onClick={handleGenerateBackground}
        >
          {generateBgMut.isPending ? (
            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
          ) : (
            <><Wand2 className="w-3 h-3 mr-1" /> Generate Background</>
          )}
        </Button>
      </div>

      <Separator />

      {/* AI Layout Suggestions */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">AI Layout Suggestions</p>
        <div className="space-y-1.5">
          {[
            { purpose: "Business flyer with headline, body text, and call to action", label: "Business Flyer" },
            { purpose: "Social media post with bold headline and product showcase", label: "Social Post" },
            { purpose: "Event invitation with date, venue, and RSVP details", label: "Event Invite" },
            { purpose: "Professional resume with sections for experience and skills", label: "Resume" },
          ].map((layout) => (
            <button
              key={layout.label}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              onClick={() => handleSuggestLayout(layout.purpose)}
              disabled={suggestLayoutMut.isPending}
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-card-foreground">{layout.label}</p>
                <p className="text-[10px] text-muted-foreground">Auto-generate layout</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Magic Resize */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Magic Resize</p>
        <div className="grid grid-cols-2 gap-1.5">
          {magicResizePresets.map((preset) => (
            <button
              key={preset.key}
              className="text-left p-2 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors"
              onClick={() => {
                const p = CANVAS_PRESETS[preset.key];
                if (p) {
                  window.location.href = `/editor?w=${p.width}&h=${p.height}&preset=${preset.key}`;
                }
              }}
            >
              <p className="text-[10px] font-medium text-card-foreground">{preset.label}</p>
              <p className="text-[9px] text-muted-foreground">{preset.size}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Image Filters */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Image Adjustments</p>
        <p className="text-[10px] text-muted-foreground mb-2">Select an image on canvas, then adjust</p>
        <div className="space-y-3">
          {[
            { icon: Sun, label: "Brightness", prop: "brightness", min: -100, max: 100 },
            { icon: Contrast, label: "Contrast", prop: "contrast", min: -100, max: 100 },
            { icon: Droplets, label: "Saturation", prop: "saturation", min: -100, max: 100 },
            { icon: Focus, label: "Blur", prop: "blur", min: 0, max: 20 },
          ].map((filter) => (
            <div key={filter.prop} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <filter.icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{filter.label}</span>
                </div>
                <span className="text-[10px] text-card-foreground">0</span>
              </div>
              <Slider
                defaultValue={[0]}
                min={filter.min}
                max={filter.max}
                step={1}
                onValueChange={([v]) => {
                  toast.info(`${filter.label}: ${v} (applied to selected image)`);
                }}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layers Panel ────────────────────────────────────────────
function LayersPanel({ editor }: { editor: ReturnType<typeof useCanvasEditor> }) {
  const objects = editor.getObjects();

  return (
    <div className="space-y-1">
      {objects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No elements on canvas</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Add elements to see layers</p>
        </div>
      )}
      {[...objects].reverse().map((obj, i) => {
        const realIndex = objects.length - 1 - i;
        const typeName = obj.type === "textbox" ? "Text" : obj.type === "image" ? "Image" : obj.type === "group" ? "Group" : obj.type || "Element";
        const isSelected = editor.editorState.selectedObjects.includes(obj);
        return (
          <button
            key={i}
            onClick={() => editor.selectObject(realIndex)}
            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
              isSelected ? "bg-primary/15 border border-primary/30" : "hover:bg-accent border border-transparent"
            }`}
          >
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
              {obj.type === "textbox" ? <Type className="w-3.5 h-3.5 text-muted-foreground" /> :
               obj.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" /> :
               obj.type === "group" ? <Group className="w-3.5 h-3.5 text-muted-foreground" /> :
               <Square className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-card-foreground truncate capitalize">{typeName}</p>
              <p className="text-[10px] text-muted-foreground">Layer {realIndex + 1}</p>
            </div>
            <div className="flex items-center gap-1">
              {obj.lockMovementX && <Lock className="w-3 h-3 text-muted-foreground" />}
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Properties Panel ────────────────────────────────────────
function PropertiesPanel({ editor, canvasWidth, canvasHeight }: {
  editor: ReturnType<typeof useCanvasEditor>;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const selectedObj = editor.editorState.selectedObjects[0];
  if (!selectedObj) return null;

  const isText = selectedObj.type === "textbox" || selectedObj.type === "i-text";

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <h3 className="text-xs font-semibold text-card-foreground uppercase tracking-wider">Properties</h3>

        {/* Position & Size */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Position & Size</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-muted-foreground">X</label>
              <Input
                type="number"
                value={Math.round(selectedObj.left || 0)}
                onChange={(e) => editor.updateActiveObject({ left: Number(e.target.value) })}
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Y</label>
              <Input
                type="number"
                value={Math.round(selectedObj.top || 0)}
                onChange={(e) => editor.updateActiveObject({ top: Number(e.target.value) })}
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">W</label>
              <Input
                type="number"
                value={Math.round((selectedObj.width || 0) * (selectedObj.scaleX || 1))}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  editor.updateActiveObject({ scaleX: w / (selectedObj.width || 1) });
                }}
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">H</label>
              <Input
                type="number"
                value={Math.round((selectedObj.height || 0) * (selectedObj.scaleY || 1))}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  editor.updateActiveObject({ scaleY: h / (selectedObj.height || 1) });
                }}
                className="h-7 text-xs bg-secondary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-muted-foreground">Rotation</label>
              <Input
                type="number"
                value={Math.round(selectedObj.angle || 0)}
                onChange={(e) => editor.updateActiveObject({ angle: Number(e.target.value) })}
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Corner Radius</label>
              <Input
                type="number"
                value={(selectedObj as any).rx || 0}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  editor.updateActiveObject({ rx: r, ry: r });
                }}
                className="h-7 text-xs bg-secondary"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Opacity</p>
            <span className="text-xs text-card-foreground">
              {Math.round((selectedObj.opacity ?? 1) * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round((selectedObj.opacity ?? 1) * 100)]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => editor.updateActiveObject({ opacity: v / 100 })}
          />
        </div>

        <Separator />

        {/* Fill Color */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Fill</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(selectedObj.fill as string) || "#000000"}
              onChange={(e) => editor.updateActiveObject({ fill: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <Input
              value={(selectedObj.fill as string) || "#000000"}
              onChange={(e) => editor.updateActiveObject({ fill: e.target.value })}
              className="h-7 text-xs bg-secondary flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {["#000000", "#ffffff", "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#22c55e"].map((c) => (
              <button
                key={c}
                onClick={() => editor.updateActiveObject({ fill: c })}
                className="w-5 h-5 rounded border border-border hover:scale-125 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Stroke */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Stroke</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(selectedObj.stroke as string) || "#000000"}
              onChange={(e) => editor.updateActiveObject({ stroke: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <Input
              type="number"
              value={selectedObj.strokeWidth || 0}
              onChange={(e) => editor.updateActiveObject({ strokeWidth: Number(e.target.value) })}
              className="h-7 text-xs bg-secondary w-16"
              placeholder="Width"
            />
          </div>
        </div>

        {/* Text-specific properties */}
        {isText && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Typography</p>
              <select
                value={(selectedObj as any).fontFamily || "Inter"}
                onChange={(e) => editor.updateActiveObject({ fontFamily: e.target.value })}
                className="w-full h-7 text-xs bg-secondary border border-border rounded-md px-2 text-card-foreground"
              >
                {["Inter", "Montserrat", "Poppins", "Playfair Display", "Roboto", "Lato", "Open Sans", "Raleway", "Oswald", "Merriweather"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  value={(selectedObj as any).fontSize || 16}
                  onChange={(e) => editor.updateActiveObject({ fontSize: Number(e.target.value) })}
                  className="h-7 text-xs bg-secondary w-16"
                />
                <Button
                  variant={(selectedObj as any).fontWeight === "bold" ? "secondary" : "ghost"}
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => editor.updateActiveObject({
                    fontWeight: (selectedObj as any).fontWeight === "bold" ? "normal" : "bold"
                  })}
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={(selectedObj as any).fontStyle === "italic" ? "secondary" : "ghost"}
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => editor.updateActiveObject({
                    fontStyle: (selectedObj as any).fontStyle === "italic" ? "normal" : "italic"
                  })}
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={(selectedObj as any).underline ? "secondary" : "ghost"}
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => editor.updateActiveObject({
                    underline: !(selectedObj as any).underline
                  })}
                >
                  <Underline className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex gap-1">
                {["left", "center", "right"].map((align) => (
                  <Button
                    key={align}
                    variant={(selectedObj as any).textAlign === align ? "secondary" : "ghost"}
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => editor.updateActiveObject({ textAlign: align })}
                  >
                    {align === "left" ? <AlignLeft className="w-3.5 h-3.5" /> :
                     align === "center" ? <AlignCenter className="w-3.5 h-3.5" /> :
                     <AlignRight className="w-3.5 h-3.5" />}
                  </Button>
                ))}
              </div>

              {/* Line Height & Letter Spacing */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[10px] text-muted-foreground">Line Height</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={(selectedObj as any).lineHeight || 1.2}
                    onChange={(e) => editor.updateActiveObject({ lineHeight: Number(e.target.value) })}
                    className="h-7 text-xs bg-secondary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Spacing</label>
                  <Input
                    type="number"
                    value={(selectedObj as any).charSpacing || 0}
                    onChange={(e) => editor.updateActiveObject({ charSpacing: Number(e.target.value) })}
                    className="h-7 text-xs bg-secondary"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Alignment */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Align on Canvas</p>
          <div className="grid grid-cols-3 gap-1">
            <Button variant="ghost" size="icon" className="w-full h-7" onClick={() => editor.alignObjects("left")}>
              <AlignStartVertical className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-full h-7" onClick={() => editor.alignObjects("center")}>
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-full h-7" onClick={() => editor.alignObjects("right")}>
              <AlignEndVertical className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Button variant="ghost" size="icon" className="w-full h-7" onClick={() => editor.alignObjects("top")}>
              <ChevronsUp className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-full h-7" onClick={() => editor.alignObjects("middle")}>
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-full h-7" onClick={() => editor.alignObjects("bottom")}>
              <ChevronsDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Canvas Background */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Canvas Background</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              defaultValue="#ffffff"
              onChange={(e) => editor.setBackground(e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <div className="flex gap-1">
              {["#ffffff", "#f8fafc", "#1e293b", "#0f172a", "#fef3c7", "#fce7f3"].map((c) => (
                <button
                  key={c}
                  onClick={() => editor.setBackground(c)}
                  className="w-5 h-5 rounded border border-border hover:scale-125 transition-transform"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-1.5">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 text-card-foreground" onClick={editor.duplicateSelected}>
            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 text-destructive" onClick={editor.deleteSelected}>
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
