import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import type { ShapeType } from "@/hooks/useCanvasEditor";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Type,
  Image,
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  Hexagon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Save,
  Palette,
  Layers,
  Sparkles,
  MessageSquare,
  FileText,
  LayoutTemplate,
  Grid3x3,
  ImageIcon,
  Shapes,
  Upload,
  Search,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  Wand2,
  Eraser,
  Crop,
  SlidersHorizontal,
  Bot,
  Code2,
  Heart,
  Pentagon,
  Diamond,
  Loader2,
  Check,
  X,
  Sun,
  Contrast,
  Droplets,
  Focus,
  Paintbrush,
  RotateCcw,
  Eye,
  ExternalLink,
  Settings,
  ChevronDown,
  Camera,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc, type UnsplashPhoto } from "@/lib/trpc";
import { CANVAS_PRESETS } from "@shared/designTypes";
import AIChatPanel from "@/components/AIChatPanel";
import DownloadMenu from "@/components/DownloadMenu";
import { ResizePanel } from "@/features/resize/ResizePanel";
import type { BrandProfile, ReflowResult } from "@/features/resize/types";
import { getPortalUrl } from "@/const";
import styles from "./Editor.module.css";

type SidebarPanel =
  | "templates"
  | "elements"
  | "text"
  | "uploads"
  | "photos"
  | "ai"
  | "brand"
  | "layers"
  | "settings"
  | null;

type RightPanelMode = "properties" | "resize";

const FONT_OPTIONS = [
  "Inter",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Roboto",
  "Lato",
  "Open Sans",
  "Raleway",
  "Oswald",
  "Merriweather",
  "Nunito",
  "Work Sans",
  "DM Sans",
  "Source Sans 3",
  "Bebas Neue",
  "Lora",
  "Rubik",
  "PT Sans",
  "Quicksand",
  "Anton",
];

const AUTOSAVE_DRAFT_VERSION = 1;
const AUTOSAVE_DRAFT_PREFIX = "ms-studio.editorDraft.";
const RECENT_TEMPLATE_SEARCHES_KEY = "ms-studio.recentTemplateSearches.v1";
const RECENT_TEMPLATE_AI_PROMPTS_KEY = "ms-studio.recentTemplateAiPrompts.v1";
const RECENT_ELEMENT_SEARCHES_KEY = "ms-studio.recentElementSearches.v1";
const RECENT_ELEMENT_AI_PROMPTS_KEY = "ms-studio.recentElementAiPrompts.v1";
const RECENT_STOCK_ASSETS_KEY = "ms-studio.recentStockAssets.v1";
const BRAND_KIT_STORAGE_KEY = "ms-studio.brandKit.v1";
const EDITOR_LAYOUT_PREFS_KEY = "ms-studio.editorLayoutPrefs.v1";
const UPLOADS_STORAGE_KEY = "ms-studio.uploads.v1";
const MAX_RECENT_AI_ITEMS = 6;
const LEFT_ICON_SIDEBAR_WIDTH = 52;
const DEFAULT_LEFT_PANEL_WIDTH = 256;
const DEFAULT_RIGHT_PANEL_WIDTH = 320;

function applyNodeStyles(
  node: HTMLElement | SVGElement | null,
  styleMap: Record<string, string | number>
) {
  if (!node) return;
  for (const [key, value] of Object.entries(styleMap)) {
    node.style.setProperty(key, String(value));
  }
}

function getTextPresetClass(label: string): string {
  if (label === "Sale Banner") return styles.textPresetSale;
  if (label === "Announcement") return styles.textPresetAnnouncement;
  if (label === "Thank You") return styles.textPresetThankYou;
  if (label === "New Badge") return styles.textPresetNew;
  return "";
}

const AI_CREDIT_ESTIMATES = {
  chat: 1,
  layout: 2,
  image: 10,
  background: 10,
  svg: 2,
  code: 2,
  chart: 2,
  form: 2,
} as const;

const DEFAULT_BRAND_COLORS = [
  { name: "Primary", hex: "#6366f1" },
  { name: "Secondary", hex: "#ec4899" },
  { name: "Accent", hex: "#14b8a6" },
  { name: "Dark", hex: "#1e293b" },
  { name: "Light", hex: "#f8fafc" },
];

const BRAND_FONT_OPTIONS = [
  { name: "Montserrat", style: "Geometric Sans" },
  { name: "Poppins", style: "Round Sans" },
  { name: "Inter", style: "Neutral Sans" },
  { name: "Playfair Display", style: "Elegant Serif" },
  { name: "Roboto", style: "Material Sans" },
  { name: "Lato", style: "Humanist Sans" },
  { name: "Oswald", style: "Condensed" },
  { name: "Raleway", style: "Thin Sans" },
  { name: "Nunito", style: "Friendly Sans" },
  { name: "Work Sans", style: "Modern Sans" },
  { name: "DM Sans", style: "Contemporary Sans" },
  { name: "Source Sans 3", style: "Readable Sans" },
  { name: "Bebas Neue", style: "Display Sans" },
  { name: "Lora", style: "Editorial Serif" },
  { name: "Rubik", style: "Rounded Sans" },
  { name: "PT Sans", style: "Classic Sans" },
  { name: "Quicksand", style: "Soft Sans" },
  { name: "Anton", style: "Bold Display" },
];

const RECOMMENDED_TEMPLATE_PROMPTS = [
  "Social media launch post",
  "Product mockup layout",
  "Blog outline graphic",
  "Flyer",
  "Brand announcement",
  "Sale promo creative",
  "Story reel cover",
  "YouTube thumbnail",
  "Email header",
  "Print-ready product insert",
];

const ELEMENT_AI_SCOPES = [
  "Image",
  "Graphic",
  "Code",
  "Video",
  "Music",
  "Sound Effects",
  "Voiceovers",
  "Shapes",
  "3D",
  "Charts",
  "Forms",
] as const;

const RECOMMENDED_ELEMENT_PROMPTS = [
  "Minimal product icon",
  "Editable abstract graphic",
  "Promo badge",
  "Rounded chart widget",
  "Hero image accent",
  "Geometric shape cluster",
];
const AUTOSAVE_INTERVAL_MS = 2000;

function readRecentItems(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const items = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(items)
      ? items.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function rememberRecentItem(key: string, value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || typeof window === "undefined") {
    return readRecentItems(key);
  }

  const next = [
    trimmed,
    ...readRecentItems(key).filter(
      item => item.toLowerCase() !== trimmed.toLowerCase()
    ),
  ].slice(0, MAX_RECENT_AI_ITEMS);

  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Local recent chips are a convenience; failed storage should not block editing.
  }

  return next;
}

type BrandKitSnapshot = {
  colors: Array<{ name: string; hex: string }>;
  fonts: string[];
  logos: BrandLogoAsset[];
  logoCount: number;
};

type BrandLogoAsset = {
  id: string;
  name: string;
  url: string;
  source: "upload" | "ai";
  createdAt: number;
};

function createBrandLogoAsset(
  name: string,
  url: string,
  source: BrandLogoAsset["source"]
): BrandLogoAsset {
  return {
    id: `logo-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    name,
    url,
    source,
    createdAt: Date.now(),
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("Logo upload failed."));
    };
    reader.onerror = () => reject(new Error("Logo upload failed."));
    reader.readAsDataURL(file);
  });
}

function loadImageForBrandLogo(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo preview could not be saved."));
    image.src = url;
  });
}

async function createPersistableLogoDataUrl(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);

  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return originalDataUrl;
  }

  const image = await loadImageForBrandLogo(originalDataUrl);
  const maxDimension = 512;
  const scale = Math.min(
    maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1),
    1
  );

  if (scale >= 1 && originalDataUrl.length < 750_000) {
    return originalDataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    return originalDataUrl;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const webpDataUrl = canvas.toDataURL("image/webp", 0.88);
  return webpDataUrl.startsWith("data:image/webp")
    ? webpDataUrl
    : canvas.toDataURL("image/png");
}

function readBrandKitSnapshot(): BrandKitSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(BRAND_KIT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BrandKitSnapshot>;
    const colors = Array.isArray(parsed.colors)
      ? parsed.colors.filter(
          (item): item is { name: string; hex: string } =>
            typeof item?.name === "string" && typeof item?.hex === "string"
        )
      : [];
    const fonts = Array.isArray(parsed.fonts)
      ? parsed.fonts.filter((item): item is string => typeof item === "string")
      : [];
    const logos = Array.isArray(parsed.logos)
      ? parsed.logos.filter(
          (item): item is BrandLogoAsset =>
            typeof item?.id === "string" &&
            typeof item?.name === "string" &&
            typeof item?.url === "string" &&
            (item?.source === "upload" || item?.source === "ai") &&
            typeof item?.createdAt === "number"
        )
      : [];

    if (
      colors.length === 0 &&
      fonts.length === 0 &&
      logos.length === 0 &&
      !parsed.logoCount
    ) {
      return null;
    }

    const legacyLogoCount =
      typeof parsed.logoCount === "number" && parsed.logoCount > 0
        ? parsed.logoCount
        : 0;

    return {
      colors,
      fonts,
      logos,
      logoCount: Math.max(logos.length, legacyLogoCount),
    };
  } catch {
    return null;
  }
}

function writeBrandKitSnapshot(snapshot: BrandKitSnapshot) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      BRAND_KIT_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
    return true;
  } catch {
    // Brand Kit persistence is local convenience data; editing can continue.
    return false;
  }
}

function readResizeBrandProfile(): BrandProfile | null {
  const snapshot = readBrandKitSnapshot();
  if (!snapshot) {
    return null;
  }

  return {
    colors: snapshot.colors,
    fonts: snapshot.fonts,
    logoCount: snapshot.logoCount,
  };
}

function buildBrandKitContext(fallbackPurpose: string) {
  const brandKit = readBrandKitSnapshot();
  if (!brandKit) {
    return [
      "No saved Brand Kit was found for this browser session.",
      `Infer a temporary style from: ${fallbackPurpose}`,
    ].join("\n");
  }

  return [
    "Use only this current user's saved Brand Kit context.",
    brandKit.colors.length
      ? `Colors: ${brandKit.colors.map(color => `${color.name} ${color.hex}`).join(", ")}`
      : "Colors: not set",
    brandKit.fonts.length
      ? `Fonts: ${brandKit.fonts.join(", ")}`
      : "Fonts: not set",
    `Uploaded logo references available in this session: ${brandKit.logoCount}`,
  ].join("\n");
}

function aiCreditLabel(cost: number) {
  return `Estimated ${cost} AI credit${cost === 1 ? "" : "s"}`;
}

type AutosaveDraft = {
  version: number;
  projectId?: string;
  sourceFingerprint: string;
  canvasWidth: number;
  canvasHeight: number;
  projectName: string;
  canvasData: string;
  updatedAt: number;
};

type EditorLayoutPrefs = {
  resizablePanels: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readEditorLayoutPrefs(): EditorLayoutPrefs {
  if (typeof window === "undefined") {
    return {
      resizablePanels: false,
      leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
      rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
    };
  }

  try {
    const raw = window.localStorage.getItem(EDITOR_LAYOUT_PREFS_KEY);
    if (!raw) {
      return {
        resizablePanels: false,
        leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
        rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
      };
    }

    const parsed = JSON.parse(raw) as Partial<EditorLayoutPrefs>;

    return {
      resizablePanels: Boolean(parsed.resizablePanels),
      leftPanelWidth: clamp(
        typeof parsed.leftPanelWidth === "number"
          ? parsed.leftPanelWidth
          : DEFAULT_LEFT_PANEL_WIDTH,
        220,
        520
      ),
      rightPanelWidth: clamp(
        typeof parsed.rightPanelWidth === "number"
          ? parsed.rightPanelWidth
          : DEFAULT_RIGHT_PANEL_WIDTH,
        260,
        560
      ),
    };
  } catch {
    return {
      resizablePanels: false,
      leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
      rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
    };
  }
}

function writeEditorLayoutPrefs(prefs: EditorLayoutPrefs) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EDITOR_LAYOUT_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Layout preferences are non-critical UI convenience values.
  }
}

function fingerprintText(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getInitialCanvasFingerprint(templateData?: string) {
  return templateData ? fingerprintText(templateData) : "blank";
}

function getAutosaveDraftKey(
  projectId: string | undefined,
  canvasWidth: number,
  canvasHeight: number,
  sourceFingerprint: string
) {
  const scope = projectId ? `project:${projectId}` : "new";
  return `${AUTOSAVE_DRAFT_PREFIX}${scope}:${canvasWidth}x${canvasHeight}:${sourceFingerprint}`;
}

function readAutosaveDraft(key: string): AutosaveDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const draft = JSON.parse(raw) as AutosaveDraft;
    if (
      draft.version !== AUTOSAVE_DRAFT_VERSION ||
      typeof draft.canvasData !== "string" ||
      typeof draft.projectName !== "string"
    ) {
      return null;
    }
    return draft;
  } catch (error) {
    console.warn("Failed to read editor autosave draft", error);
    return null;
  }
}

function findLatestAutosaveDraftForProject(
  projectId: string,
  canvasWidth: number,
  canvasHeight: number
): AutosaveDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const prefix = `${AUTOSAVE_DRAFT_PREFIX}project:${projectId}:${canvasWidth}x${canvasHeight}:`;
  let latestDraft: AutosaveDraft | null = null;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) {
      continue;
    }

    const draft = readAutosaveDraft(key);
    if (
      draft &&
      draft.projectId === projectId &&
      draft.canvasWidth === canvasWidth &&
      draft.canvasHeight === canvasHeight &&
      (!latestDraft || draft.updatedAt > latestDraft.updatedAt)
    ) {
      latestDraft = draft;
    }
  }

  return latestDraft;
}

function writeAutosaveDraft(key: string, draft: AutosaveDraft) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch (error) {
    console.warn("Failed to write editor autosave draft", error);
  }
}

function clearAutosaveDraft(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to clear editor autosave draft", error);
  }
}

interface EditorProps {
  projectId?: string;
  templateData?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  initialProjectName?: string;
}

export default function Editor({
  projectId,
  templateData,
  canvasWidth = 1080,
  canvasHeight = 1080,
  initialProjectName,
}: EditorProps) {
  const editorLayoutRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const editor = useCanvasEditor(canvasRef, canvasWidth, canvasHeight);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("templates");
  const [rightPanelMode, setRightPanelMode] =
    useState<RightPanelMode>("properties");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(
    projectId
  );
  const [projectName, setProjectName] = useState(
    initialProjectName || "Untitled Design"
  );
  const [showSnapMenu, setShowSnapMenu] = useState(false);
  const snapMenuRef = useRef<HTMLDivElement>(null);
  const snapMenuButtonRef = useRef<HTMLButtonElement>(null);
  const sourceFingerprint = useMemo(
    () => getInitialCanvasFingerprint(templateData),
    [templateData]
  );
  const autosaveDraftKey = useMemo(
    () =>
      getAutosaveDraftKey(
        currentProjectId,
        canvasWidth,
        canvasHeight,
        sourceFingerprint
      ),
    [currentProjectId, canvasWidth, canvasHeight, sourceFingerprint]
  );
  const lastAutosavedCanvasRef = useRef<string | null>(null);
  const lastAutosavedNameRef = useRef(projectName);
  const lastRemoteSavedCanvasRef = useRef<string | null>(null);
  const lastRemoteSavedNameRef = useRef(projectName);
  const remoteAutosaveInFlightRef = useRef(false);
  const hasCompletedInitialLoadRef = useRef(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [resizablePanels, setResizablePanels] = useState(
    () => readEditorLayoutPrefs().resizablePanels
  );
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    () => readEditorLayoutPrefs().leftPanelWidth
  );
  const [rightPanelWidth, setRightPanelWidth] = useState(
    () => readEditorLayoutPrefs().rightPanelWidth
  );
  const [resizeTarget, setResizeTarget] = useState<"left" | "right" | null>(
    null
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
  }>({ open: false, x: 0, y: 0 });
  const canvasContextMenuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const persistDraftOnUnmountRef = useRef<() => void>(() => {});
  const { isAuthenticated } = useAuth();

  const saveMutation = trpc.projects.save.useMutation();
  const createMutation = trpc.projects.create.useMutation();

  const buildThumbnailUrl = useCallback(() => {
    try {
      const thumbnailUrl = editor.exportCanvas("png");
      return thumbnailUrl || undefined;
    } catch (error) {
      console.warn("Failed to generate project thumbnail", error);
      return undefined;
    }
  }, [editor]);

  // Stable refs so keyboard / init effects don't re-run on every render
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const currentProjectIdRef = useRef(currentProjectId);
  currentProjectIdRef.current = currentProjectId;
  const closeCanvasContextMenu = useCallback(() => {
    setCanvasContextMenu(current =>
      current.open ? { ...current, open: false } : current
    );
  }, []);

  const fitCanvasToViewport = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) {
      return;
    }

    const padding = 0;
    const scaleX = (container.clientWidth - padding) / canvasWidth;
    const scaleY = (container.clientHeight - padding) / canvasHeight;
    editorRef.current.setZoom(Math.min(scaleX, scaleY, 1));
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      fitCanvasToViewport();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [fitCanvasToViewport]);

  useEffect(() => {
    fitCanvasToViewport();
  }, [fitCanvasToViewport, activePanel, showChat]);

  useEffect(() => {
    writeEditorLayoutPrefs({
      resizablePanels,
      leftPanelWidth,
      rightPanelWidth,
    });
  }, [leftPanelWidth, resizablePanels, rightPanelWidth]);

  useEffect(() => {
    if (!resizablePanels || !resizeTarget) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const bounds = editorLayoutRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      if (resizeTarget === "left") {
        const nextWidth = clamp(
          event.clientX - bounds.left - LEFT_ICON_SIDEBAR_WIDTH,
          220,
          520
        );
        setLeftPanelWidth(nextWidth);
        return;
      }

      const nextWidth = clamp(bounds.right - event.clientX, 260, 560);
      setRightPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setResizeTarget(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizablePanels, resizeTarget]);

  // Initialize canvas — run once on mount only
  useEffect(() => {
    let cancelled = false;

    const initializeCanvas = async () => {
      if (!canvasRef.current) {
        return;
      }

      const canvas = editorRef.current.initCanvas();
      if (!canvas) {
        return;
      }

      fitCanvasToViewport();

      try {
        if (templateData) {
          await editorRef.current.loadFromJSON(templateData);
        }

        const exactDraft = readAutosaveDraft(autosaveDraftKey);
        const draft =
          exactDraft ??
          (!templateData && projectId
            ? findLatestAutosaveDraftForProject(
                projectId,
                canvasWidth,
                canvasHeight
              )
            : null);

        if (
          !cancelled &&
          draft &&
          draft.projectId === projectId &&
          draft.canvasWidth === canvasWidth &&
          draft.canvasHeight === canvasHeight &&
          (exactDraft ? draft.sourceFingerprint === sourceFingerprint : true)
        ) {
          await editorRef.current.loadFromJSON(draft.canvasData);
          setProjectName(draft.projectName || "Untitled Design");
          lastAutosavedCanvasRef.current = draft.canvasData;
          lastAutosavedNameRef.current = draft.projectName;
        }
      } catch (error) {
        console.warn("Failed to load editor canvas data", error);
      } finally {
        if (!cancelled) {
          hasCompletedInitialLoadRef.current = true;
          setIsCanvasReady(true);
        }
      }
    };

    void initializeCanvas();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts — stable empty deps, reads editor/save via refs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) editorRef.current.redo();
        else editorRef.current.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        editorRef.current.redo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        editorRef.current.setZoom(editorRef.current.editorState.zoom - 0.1);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        editorRef.current.setZoom(editorRef.current.editorState.zoom + 0.1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        fitCanvasToViewport();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          editorRef.current.deleteSelected();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        editorRef.current.duplicateSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fitCanvasToViewport]);

  const persistLocalDraft = useCallback(
    (canvasData: string, name: string) => {
      writeAutosaveDraft(autosaveDraftKey, {
        version: AUTOSAVE_DRAFT_VERSION,
        projectId: currentProjectId,
        sourceFingerprint,
        canvasWidth,
        canvasHeight,
        projectName: name,
        canvasData,
        updatedAt: Date.now(),
      });
      lastAutosavedCanvasRef.current = canvasData;
      lastAutosavedNameRef.current = name;
    },
    [
      autosaveDraftKey,
      canvasHeight,
      canvasWidth,
      currentProjectId,
      sourceFingerprint,
    ]
  );

  const handleSave = useCallback(async () => {
    try {
      const json = editor.exportCanvas("json");
      if (!json) {
        toast.error("Canvas is not ready. Please try again.");
        return;
      }

      const name = projectName.trim() || "Untitled Design";
      const thumbnailUrl = buildThumbnailUrl();

      if (currentProjectId) {
        await saveMutation.mutateAsync({
          id: currentProjectId,
          canvasData: json,
          name,
          thumbnailUrl,
        });
        clearAutosaveDraft(autosaveDraftKey);
        lastAutosavedCanvasRef.current = json;
        lastAutosavedNameRef.current = name;
        lastRemoteSavedCanvasRef.current = json;
        lastRemoteSavedNameRef.current = name;
        toast.success("Project saved!");
      } else {
        const result = await createMutation.mutateAsync({
          name,
          canvasWidth,
          canvasHeight,
          canvasData: json,
          thumbnailUrl,
        });
        setCurrentProjectId(result.id);
        clearAutosaveDraft(autosaveDraftKey);
        lastAutosavedCanvasRef.current = json;
        lastAutosavedNameRef.current = name;
        lastRemoteSavedCanvasRef.current = json;
        lastRemoteSavedNameRef.current = name;
        toast.success("Project created and saved!");
      }
    } catch (error) {
      console.error("Save failed:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : typeof error === "string" && error
            ? error
            : "Failed to save. Please try again.";
      const json = editor.exportCanvas("json");
      if (json) {
        persistLocalDraft(json, projectName.trim() || "Untitled Design");
        toast.error(`${message} Saved locally in this browser.`);
        return;
      }
      toast.error(message);
    }
  }, [
    editor,
    currentProjectId,
    canvasWidth,
    canvasHeight,
    saveMutation,
    createMutation,
    autosaveDraftKey,
    projectName,
    persistLocalDraft,
    buildThumbnailUrl,
  ]);

  // Stable ref so the keyboard shortcut effect can call the latest handleSave
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!isCanvasReady || !hasCompletedInitialLoadRef.current) {
      return;
    }

    const persistDraft = () => {
      const canvasData = editorRef.current.exportCanvas("json");
      if (!canvasData) {
        return;
      }

      const name = projectName.trim() || "Untitled Design";
      if (
        lastAutosavedCanvasRef.current === canvasData &&
        lastAutosavedNameRef.current === name
      ) {
        return;
      }

      persistLocalDraft(canvasData, name);
    };

    persistDraftOnUnmountRef.current = persistDraft;

    const intervalId = window.setInterval(persistDraft, AUTOSAVE_INTERVAL_MS);
    window.addEventListener("pagehide", persistDraft);
    window.addEventListener("beforeunload", persistDraft);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pagehide", persistDraft);
      window.removeEventListener("beforeunload", persistDraft);
    };
  }, [
    autosaveDraftKey,
    canvasHeight,
    canvasWidth,
    currentProjectId,
    isCanvasReady,
    projectName,
    sourceFingerprint,
  ]);

  useEffect(() => {
    if (!canvasContextMenu.open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (canvasContextMenuRef.current?.contains(event.target as Node | null)) {
        return;
      }
      closeCanvasContextMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCanvasContextMenu();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvasContextMenu.open, closeCanvasContextMenu]);

  const handleCanvasContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const canvas = editor.fabricRef.current;
      if (!canvas) {
        closeCanvasContextMenu();
        return;
      }

      const target = canvas.findTarget(
        event.nativeEvent as unknown as Event,
        false
      ) as { type?: string } | undefined;

      if (!target || target.type !== "image") {
        closeCanvasContextMenu();
        return;
      }

      event.preventDefault();

      canvas.setActiveObject(target as never);
      canvas.renderAll();

      setCanvasContextMenu({
        open: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [closeCanvasContextMenu, editor.fabricRef]
  );

  const handleMakeBackgroundFromContextMenu = useCallback(async () => {
    closeCanvasContextMenu();

    try {
      const didApply = await editor.setSelectedImageAsBackground();
      if (!didApply) {
        toast.error("Right-click an image to make it the background.");
        return;
      }

      toast.success("Image set as the canvas background.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set background.";
      toast.error(message);
    }
  }, [closeCanvasContextMenu, editor]);

  useEffect(() => {
    if (
      !isCanvasReady ||
      !hasCompletedInitialLoadRef.current ||
      !isAuthenticated
    ) {
      return;
    }

    const persistRemoteDraft = async () => {
      if (remoteAutosaveInFlightRef.current) {
        return;
      }

      const canvasData = editorRef.current.exportCanvas("json");
      if (!canvasData) {
        return;
      }

      const name = projectName.trim() || "Untitled Design";
      const thumbnailUrl = buildThumbnailUrl();
      if (
        lastRemoteSavedCanvasRef.current === canvasData &&
        lastRemoteSavedNameRef.current === name
      ) {
        return;
      }

      remoteAutosaveInFlightRef.current = true;

      try {
        const existingId = currentProjectIdRef.current;

        if (existingId) {
          await saveMutation.mutateAsync({
            id: existingId,
            canvasData,
            name,
            thumbnailUrl,
          });
        } else {
          const created = await createMutation.mutateAsync({
            name,
            canvasWidth,
            canvasHeight,
            canvasData,
            thumbnailUrl,
          });
          setCurrentProjectId(created.id);
        }

        clearAutosaveDraft(autosaveDraftKey);
        lastAutosavedCanvasRef.current = canvasData;
        lastAutosavedNameRef.current = name;
        lastRemoteSavedCanvasRef.current = canvasData;
        lastRemoteSavedNameRef.current = name;
      } catch (error) {
        console.warn("Remote autosave failed; keeping local draft", error);
      } finally {
        remoteAutosaveInFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void persistRemoteDraft();
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    autosaveDraftKey,
    canvasHeight,
    canvasWidth,
    createMutation,
    isAuthenticated,
    isCanvasReady,
    projectName,
    saveMutation,
    buildThumbnailUrl,
  ]);

  useEffect(() => {
    return () => {
      persistDraftOnUnmountRef.current();
    };
  }, []);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        snapMenuRef.current?.contains(target) ||
        snapMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setShowSnapMenu(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const togglePanel = (panel: SidebarPanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleOpenReflowProject = useCallback(
    (projectId: string, preview: ReflowResult) => {
      const params = new URLSearchParams({
        project: projectId,
        w: String(preview.preset.width),
        h: String(preview.preset.height),
      });
      setLocation(`/editor?${params.toString()}`);
    },
    [setLocation]
  );

  const selectedObj = editor.editorState.selectedObjects[0];
  const hasSelection = editor.editorState.selectedObjects.length > 0;
  const multiSelect = editor.editorState.selectedObjects.length > 1;
  const anySnapOptionEnabled =
    editor.editorState.snapToGrid ||
    editor.editorState.snapToEdges ||
    editor.editorState.snapToCenter ||
    editor.editorState.smartSpacing;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Toolbar */}
      <div
        className="h-12 flex items-center gap-1 px-3 shrink-0 bg-[oklch(0.12_0.006_260)]"
        style={{
          borderTop: "1px solid var(--amber)",
          borderBottom: "1px solid var(--toolbar-border)",
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-toolbar-foreground gap-1.5 mr-2"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">ManuScript Studio</span>
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          icon={Undo2}
          tooltip="Undo (Ctrl+Z)"
          onClick={editor.undo}
        />
        <ToolbarButton
          icon={Redo2}
          tooltip="Redo (Ctrl+Shift+Z)"
          onClick={editor.redo}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          icon={ZoomOut}
          tooltip="Zoom Out (Ctrl+-)"
          onClick={() => editor.setZoom(editor.editorState.zoom - 0.1)}
        />
        <ToolbarButton
          icon={ZoomIn}
          tooltip="Zoom In (Ctrl+=)"
          onClick={() => editor.setZoom(editor.editorState.zoom + 0.1)}
        />

        <div className="relative" ref={snapMenuRef}>
          <Button
            ref={snapMenuButtonRef}
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-sm text-toolbar-foreground hover:bg-[oklch(0.19_0.006_260)] hover:text-[oklch(0.91_0.008_75)] ${anySnapOptionEnabled ? "bg-[oklch(0.78_0.17_75)]/15 text-[oklch(0.78_0.17_75)]" : ""}`}
            aria-label="Grid and snapping settings"
            onClick={() => setShowSnapMenu(prev => !prev)}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>

          {showSnapMenu && (
            <div className="absolute left-0 top-10 z-50 w-80 rounded-md border bg-popover p-3 shadow-md">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">Grid and Snapping</h4>
                  <p className="text-xs text-muted-foreground">
                    Configure canvas snapping behavior and alignment helpers.
                  </p>
                </div>

                <div className="space-y-2">
                  <SnapSettingRow
                    label="Snap to grid"
                    description="Align dragged elements to 20px increments"
                    checked={editor.editorState.snapToGrid}
                    onCheckedChange={editor.setSnapToGrid}
                  />
                  <SnapSettingRow
                    label="Show grid lines"
                    description="Render alignment grid on the canvas"
                    checked={editor.editorState.showGridLines}
                    onCheckedChange={editor.setShowGridLines}
                  />
                  <SnapSettingRow
                    label="Snap to canvas edges"
                    description="Attract objects to top, bottom, left, and right bounds"
                    checked={editor.editorState.snapToEdges}
                    onCheckedChange={editor.setSnapToEdges}
                  />
                  <SnapSettingRow
                    label="Strong center snap"
                    description="Use stronger magnetism at horizontal and vertical center"
                    checked={editor.editorState.snapToCenter}
                    onCheckedChange={editor.setSnapToCenter}
                  />
                  <SnapSettingRow
                    label="Smart equal spacing"
                    description="Snap dragged or resized objects to matching spacing"
                    checked={editor.editorState.smartSpacing}
                    onCheckedChange={editor.setSmartSpacing}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Center selected object
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!hasSelection}
                      onClick={editor.centerSelectionHorizontally}
                    >
                      Horizontal
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!hasSelection}
                      onClick={editor.centerSelectionVertically}
                    >
                      Vertical
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {hasSelection && (
          <>
            <ToolbarButton
              icon={Copy}
              tooltip="Duplicate (Ctrl+D)"
              onClick={editor.duplicateSelected}
            />
            <ToolbarButton
              icon={Trash2}
              tooltip="Delete"
              onClick={editor.deleteSelected}
            />
            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton
              icon={ChevronsUp}
              tooltip="Bring to Front"
              onClick={editor.bringToFront}
            />
            <ToolbarButton
              icon={ArrowUp}
              tooltip="Bring Forward"
              onClick={editor.bringForward}
            />
            <ToolbarButton
              icon={ArrowDown}
              tooltip="Send Backward"
              onClick={editor.sendBackward}
            />
            <ToolbarButton
              icon={ChevronsDown}
              tooltip="Send to Back"
              onClick={editor.sendToBack}
            />
            <Separator orientation="vertical" className="h-6 mx-1" />
            {multiSelect && (
              <ToolbarButton
                icon={Group}
                tooltip="Group"
                onClick={editor.groupSelected}
              />
            )}
            {selectedObj?.type === "group" && (
              <ToolbarButton
                icon={Ungroup}
                tooltip="Ungroup"
                onClick={editor.ungroupSelected}
              />
            )}
            <ToolbarButton
              icon={Lock}
              tooltip="Toggle Lock"
              onClick={editor.toggleLock}
            />
          </>
        )}

        <div className="flex-1 flex justify-center items-center px-2">
          {isEditingName ? (
            <input
              placeholder="Project name"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setIsEditingName(false);
                }
              }}
              className={`bg-transparent border border-primary rounded px-2 py-0.5 text-sm text-foreground text-center outline-none ${styles.projectNameInput}`}
              ref={node => {
                nameInputRef.current = node;
                applyNodeStyles(node, {
                  width: `${Math.max(120, projectName.length * 8 + 24)}px`,
                });
              }}
              maxLength={80}
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className={`text-sm font-medium tracking-wide text-[oklch(0.82_0.007_75)] hover:text-[oklch(0.91_0.008_75)] rounded-sm px-3 py-1 hover:bg-[oklch(0.19_0.006_260)] transition-colors truncate max-w-xs ${styles.fontSpaceGrotesk}`}
              style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}
              title="Click to rename"
            >
              {projectName}
            </button>
          )}
        </div>

        <ToolbarButton
          icon={Maximize2}
          tooltip="Smart Resize"
          onClick={() => {
            setShowChat(false);
            setRightPanelMode(current =>
              current === "resize" ? "properties" : "resize"
            );
          }}
          active={!showChat && rightPanelMode === "resize"}
        />
        <ToolbarButton
          icon={MessageSquare}
          tooltip="AI Chat"
          onClick={() => setShowChat(!showChat)}
          active={showChat}
        />
        <ToolbarButton icon={Save} tooltip="Save" onClick={handleSave} />
        <ToolbarButton
          icon={ExternalLink}
          tooltip="Open Customer Portal"
          onClick={() =>
            window.open(
              getPortalUrl({ returnTo: window.location.origin }),
              "_blank"
            )
          }
        />

        <DownloadMenu
          onExport={(format, quality) => editor.exportCanvas(format, quality)}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          isSubscribed={false}
          projectName={projectName}
        />
      </div>

      <div ref={editorLayoutRef} className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <div
          className="w-[52px] border-r bg-[oklch(0.12_0.006_260)] flex flex-col items-center py-3 gap-0.5 shrink-0"
          style={{ borderRightColor: "var(--panel-border)" }}
        >
          <SidebarIcon
            icon={LayoutTemplate}
            label="Templates"
            active={activePanel === "templates"}
            onClick={() => togglePanel("templates")}
          />
          <SidebarIcon
            icon={Shapes}
            label="Elements"
            active={activePanel === "elements"}
            onClick={() => togglePanel("elements")}
          />
          <SidebarIcon
            icon={Type}
            label="Text"
            active={activePanel === "text"}
            onClick={() => togglePanel("text")}
          />
          <SidebarIcon
            icon={ImageIcon}
            label="Photos"
            active={activePanel === "photos"}
            onClick={() => togglePanel("photos")}
          />
          <SidebarIcon
            icon={Upload}
            label="Uploads"
            active={activePanel === "uploads"}
            onClick={() => togglePanel("uploads")}
          />
          <SidebarIcon
            icon={Palette}
            label="Brand"
            active={activePanel === "brand"}
            onClick={() => togglePanel("brand")}
          />
          <SidebarIcon
            icon={Layers}
            label="Layers"
            active={activePanel === "layers"}
            onClick={() => togglePanel("layers")}
          />
          <SidebarIcon
            icon={Sparkles}
            label="AI Tools"
            active={activePanel === "ai"}
            onClick={() => togglePanel("ai")}
          />

          <div className="mt-auto pt-2">
            <SidebarIcon
              icon={Settings}
              label="Settings"
              active={activePanel === "settings"}
              onClick={() => togglePanel("settings")}
            />
          </div>
        </div>

        {/* Expandable Side Panel */}
        {activePanel && (
          <div
            className="border-r bg-[oklch(0.14_0.006_260)] flex flex-col shrink-0 panel-glide"
            style={{
              borderRightColor: "var(--panel-border)",
              width: leftPanelWidth,
            }}
          >
            <SidePanel
              panel={activePanel}
              editor={editor}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resizablePanels={resizablePanels}
              setResizablePanels={setResizablePanels}
            />
          </div>
        )}

        {resizablePanels && activePanel && (
          <div
            role="separator"
            aria-orientation="vertical"
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-border/80 transition-colors"
            onMouseDown={() => setResizeTarget("left")}
          />
        )}

        {/* Canvas Area — zoom via CSS transform keeps Fabric canvas at native pixel dimensions,
             preserving retina (devicePixelRatio) context scaling and correct pointer coordinates */}
        <div
          ref={canvasContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ background: "oklch(0.18 0.005 260)" }}
          onContextMenu={handleCanvasContextMenu}
        >
          <div className="min-h-full min-w-full flex items-center justify-center p-0">
            {/* Outer div sizes to visual (zoomed) dimensions for layout and shadow */}
            <div
              className={styles.canvasOuter}
              ref={node => {
                applyNodeStyles(node, {
                  width: `${canvasWidth * editor.editorState.zoom}px`,
                  height: `${canvasHeight * editor.editorState.zoom}px`,
                  "--grid-size": `${20 * editor.editorState.zoom}px`,
                  "--grid-major-size": `${100 * editor.editorState.zoom}px`,
                });
              }}
            >
              {editor.editorState.showGridLines && (
                <div className={styles.canvasGridOverlay} />
              )}

              {/* Inner div: CSS scale the native canvas without resizing the element */}
              <div
                className={styles.canvasInner}
                ref={node => {
                  applyNodeStyles(node, {
                    transform: `scale(${editor.editorState.zoom})`,
                  });
                }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          {canvasContextMenu.open && (
            <div
              ref={node => {
                canvasContextMenuRef.current = node;
                applyNodeStyles(node, {
                  left: `${canvasContextMenu.x}px`,
                  top: `${canvasContextMenu.y}px`,
                });
              }}
              className="fixed z-50 min-w-[220px] rounded-md border border-border bg-popover p-1 shadow-md"
              onContextMenu={event => event.preventDefault()}
            >
              <button
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => void handleMakeBackgroundFromContextMenu()}
              >
                Set as Background
              </button>
            </div>
          )}
        </div>

        {/* Right Properties Panel */}
        {/* Always render at fixed width to prevent canvas layout shift on selection */}
        {!showChat && (
          <>
            {resizablePanels && (
              <div
                role="separator"
                aria-orientation="vertical"
                className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-border/80 transition-colors"
                onMouseDown={() => setResizeTarget("right")}
              />
            )}
            <div
              className="border-l border-border bg-card shrink-0"
              style={{ width: rightPanelWidth }}
            >
              {rightPanelMode === "resize" ? (
                <ResizePanel
                  editor={editor}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  projectName={projectName}
                  brandProfile={readResizeBrandProfile()}
                  onOpenProject={handleOpenReflowProject}
                />
              ) : hasSelection ? (
                <PropertiesPanel
                  editor={editor}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center gap-2">
                  <Shapes className="w-8 h-8 opacity-20 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Select an element to edit properties
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI Chat Panel */}
        {showChat && (
          <>
            {resizablePanels && (
              <div
                role="separator"
                aria-orientation="vertical"
                className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-border/80 transition-colors"
                onMouseDown={() => setResizeTarget("right")}
              />
            )}
            <div
              className="border-l border-border shrink-0"
              style={{ width: rightPanelWidth }}
            >
              <AIChatPanel onClose={() => setShowChat(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Toolbar Button ──────────────────────────────────────────
function ToolbarButton({
  icon: Icon,
  tooltip,
  onClick,
  active,
}: {
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
          className={`w-8 h-8 rounded-sm text-toolbar-foreground hover:bg-[oklch(0.19_0.006_260)] hover:text-[oklch(0.91_0.008_75)] ${active ? "bg-[oklch(0.78_0.17_75)]/15 text-[oklch(0.78_0.17_75)]" : ""}`}
          onClick={onClick}
        >
          <Icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function SnapSettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-md border border-border/70 p-2.5">
      <div>
        <div className="text-sm font-medium leading-tight">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

// ─── Sidebar Icon ────────────────────────────────────────────
function SidebarIcon({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-11 flex flex-col items-center justify-center rounded-sm text-xs gap-0.5 transition-colors
        ${active ? "bg-[oklch(0.78_0.17_75)]/15 text-[oklch(0.78_0.17_75)]" : "text-muted-foreground hover:bg-[oklch(0.19_0.006_260)] hover:text-[oklch(0.82_0.007_75)]"}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] leading-tight">{label}</span>
    </button>
  );
}

// ─── Side Panel Content ──────────────────────────────────────
function SidePanel({
  panel,
  editor,
  searchQuery,
  setSearchQuery,
  canvasWidth,
  canvasHeight,
  resizablePanels,
  setResizablePanels,
}: {
  panel: SidebarPanel;
  editor: ReturnType<typeof useCanvasEditor>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  resizablePanels: boolean;
  setResizablePanels: React.Dispatch<React.SetStateAction<boolean>>;
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
    settings: "Settings",
  };
  const [aiSearchMode, setAiSearchMode] = useState<
    Partial<Record<"templates" | "elements" | "photos", boolean>>
  >({});
  const supportsAiSearch =
    panel === "templates" || panel === "elements" || panel === "photos";
  const isAiMode = supportsAiSearch ? !!aiSearchMode[panel] : false;

  return (
    <>
      <div className="p-3 border-b border-border">
        <h3
          className="text-xs font-semibold text-card-foreground mb-2 tracking-[0.08em] uppercase"
          style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}
        >
          {panelTitles[panel || ""]}
        </h3>
        {panel !== "layers" && panel !== "brand" && panel !== "settings" && (
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  isAiMode
                    ? "WHAT CAN WE HELP YOU MAKE TODAY?"
                    : "SEARCH FOR ANYTHING"
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary border-border"
              />
            </div>
            {supportsAiSearch && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant={isAiMode ? "default" : "secondary"}
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      setAiSearchMode(current => ({
                        ...current,
                        [panel]: !current[panel],
                      }))
                    }
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isAiMode ? "AI prompt mode" : "Search mode"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {panel === "templates" && (
            <TemplatesPanel
              editor={editor}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              aiMode={isAiMode}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          )}
          {panel === "elements" && (
            <ElementsPanel
              editor={editor}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              aiMode={isAiMode}
            />
          )}
          {panel === "text" && <TextPanel editor={editor} />}
          {panel === "photos" && (
            <PhotosPanel
              editor={editor}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              aiMode={isAiMode}
            />
          )}
          {panel === "uploads" && <UploadsPanel editor={editor} />}
          {panel === "brand" && <BrandPanel editor={editor} />}
          {panel === "ai" && (
            <AIPanel
              editor={editor}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          )}
          {panel === "layers" && <LayersPanel editor={editor} />}
          {panel === "settings" && (
            <EditorSettingsPanel
              resizablePanels={resizablePanels}
              setResizablePanels={setResizablePanels}
            />
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function EditorSettingsPanel({
  resizablePanels,
  setResizablePanels,
}: {
  resizablePanels: boolean;
  setResizablePanels: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <p className="text-xs font-medium text-card-foreground">
          Editor Layout
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Enable adjustable panel widths and drag the divider bars between
          panels.
        </p>
        <Button
          type="button"
          size="sm"
          variant={resizablePanels ? "default" : "secondary"}
          className="mt-3 w-full h-8 text-xs"
          onClick={() => setResizablePanels(current => !current)}
        >
          {resizablePanels ? "Resizable Panels: On" : "Resizable Panels: Off"}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground px-1">
        When enabled, drag either vertical divider to resize the left or right
        panel.
      </p>
    </div>
  );
}

function applyLayoutSuggestionToCanvas(
  editor: ReturnType<typeof useCanvasEditor>,
  result: {
    description?: string;
    elements?: Array<{
      type: "text" | "shape" | "image";
      left: number;
      top: number;
      width: number;
      height: number;
      fill?: string;
      text?: string;
      fontSize?: number;
      fontFamily?: string;
    }>;
  }
) {
  if (!result.elements?.length) {
    return false;
  }

  for (const el of result.elements) {
    if (el.type === "text") {
      editor.addText({
        text: el.text || "Add text",
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

  return true;
}

// ─── Templates Panel (DB-connected) ─────────────────────────
function TemplatesPanel({
  editor,
  searchQuery,
  setSearchQuery,
  aiMode,
  canvasWidth,
  canvasHeight,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  aiMode: boolean;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    undefined
  );
  const { data: dbTemplates, isLoading } = trpc.templates.list.useQuery(
    activeCategory ? { category: activeCategory } : undefined
  );
  const suggestLayoutMut = trpc.ai.suggestLayout.useMutation();
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readRecentItems(RECENT_TEMPLATE_SEARCHES_KEY)
  );
  const [recentAiPrompts, setRecentAiPrompts] = useState<string[]>(() =>
    readRecentItems(RECENT_TEMPLATE_AI_PROMPTS_KEY)
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
    if (!searchQuery || aiMode) return dbTemplates;
    const q = searchQuery.toLowerCase();
    return dbTemplates.filter(
      (t: any) =>
        t.name.toLowerCase().includes(q) ||
        (t.tags && JSON.stringify(t.tags).toLowerCase().includes(q))
    );
  }, [aiMode, dbTemplates, searchQuery]);

  useEffect(() => {
    if (!aiMode && searchQuery.trim().length > 2) {
      setRecentSearches(
        rememberRecentItem(RECENT_TEMPLATE_SEARCHES_KEY, searchQuery)
      );
    }
  }, [aiMode, searchQuery]);

  const handleApplyTemplate = (template: any) => {
    if (template.canvasData) {
      try {
        const data =
          typeof template.canvasData === "string"
            ? template.canvasData
            : JSON.stringify(template.canvasData);
        editor.loadFromJSON(data);
        toast.success(`Applied template: ${template.name}`);
      } catch {
        toast.error("Failed to load template");
      }
    }
  };

  const templateColors = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#64748b",
  ];

  const handleGenerateTemplateLayout = async () => {
    const prompt = searchQuery.trim();
    if (!prompt || suggestLayoutMut.isPending) return;

    toast.info("AI is designing a template layout...");
    try {
      const result = await suggestLayoutMut.mutateAsync({
        purpose: prompt,
        canvasWidth,
        canvasHeight,
        brandContext: buildBrandKitContext(prompt),
      });

      if (applyLayoutSuggestionToCanvas(editor, result)) {
        setRecentAiPrompts(
          rememberRecentItem(RECENT_TEMPLATE_AI_PROMPTS_KEY, prompt)
        );
        toast.success(`Layout applied: ${result.description}`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Template generation failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      {aiMode ? (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/10 p-3">
          <p className="text-[10px] text-muted-foreground">
            {aiCreditLabel(AI_CREDIT_ESTIMATES.layout)}
          </p>
          <Button
            size="sm"
            className="h-8 w-full text-xs"
            disabled={!searchQuery.trim() || suggestLayoutMut.isPending}
            onClick={handleGenerateTemplateLayout}
          >
            {suggestLayoutMut.isPending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1 h-3 w-3" /> Generate Layout
              </>
            )}
          </Button>
          <div className="flex flex-wrap gap-1.5">
            {RECOMMENDED_TEMPLATE_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                className="rounded-full bg-background/70 px-2 py-1 text-[10px] text-card-foreground hover:bg-background"
                onClick={() => setSearchQuery(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          {recentAiPrompts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-primary/20 pt-2">
              {recentAiPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground hover:text-card-foreground"
                  onClick={() => setSearchQuery(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        recentSearches.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map(query => (
              <button
                key={query}
                type="button"
                className="rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground hover:text-card-foreground"
                onClick={() => setSearchQuery(query)}
              >
                {query}
              </button>
            ))}
          </div>
        )
      )}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          className={`flex flex-col items-center p-2 rounded-lg transition-colors text-xs ${
            !activeCategory
              ? "bg-primary/20 text-primary"
              : "bg-secondary hover:bg-accent text-muted-foreground"
          }`}
          onClick={() => setActiveCategory(undefined)}
        >
          <span className="text-lg mb-0.5">✨</span>
          <span className="text-[10px]">All</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors text-xs ${
              activeCategory === cat.id
                ? "bg-primary/20 text-primary"
                : "bg-secondary hover:bg-accent text-muted-foreground"
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
          <p className="text-xs text-muted-foreground">
            {filteredTemplates.length} templates
          </p>
          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map((t: any, i: number) => (
              <button
                key={t.id}
                className="aspect-[3/4] rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all group relative"
                ref={node => {
                  const color = templateColors[i % templateColors.length];
                  applyNodeStyles(node, {
                    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                  });
                }}
                onClick={() => handleApplyTemplate(t)}
              >
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <div className="text-center">
                    <div
                      className="w-8 h-8 rounded-lg mx-auto mb-1.5"
                      ref={node => {
                        applyNodeStyles(node, {
                          background: templateColors[i % templateColors.length],
                        });
                      }}
                    />
                    <p className="text-[10px] text-card-foreground font-medium leading-tight">
                      {t.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {t.canvasWidth}x{t.canvasHeight}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-xs font-medium text-primary bg-background/80 px-2 py-1 rounded">
                    Apply
                  </span>
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

// ─── Shape preview helpers ───────────────────────────────────
function makePolygonPath(sides: number, r = 85, cx = 100, cy = 100): string {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join("L")}Z`;
}

function makeStarPath(
  pts: number,
  outerR = 85,
  innerR = 40,
  cx = 100,
  cy = 100
): string {
  const points: string[] = [];
  const step = Math.PI / pts;
  let angle = -Math.PI / 2;
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(
      `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
    );
    angle += step;
  }
  return `M${points.join("L")}Z`;
}

// ─── Shape library data ──────────────────────────────────────
const ARROW_SHAPES = [
  {
    label: "Right",
    path: "M10,65 L140,65 L140,20 L195,100 L140,180 L140,135 L10,135 Z",
    vb: "0 0 205 200",
  },
  {
    label: "Left",
    path: "M190,65 L60,65 L60,20 L5,100 L60,180 L60,135 L190,135 Z",
    vb: "0 0 200 200",
  },
  {
    label: "Up",
    path: "M65,190 L65,60 L20,60 L100,5 L180,60 L135,60 L135,190 Z",
    vb: "0 0 200 200",
  },
  {
    label: "Down",
    path: "M65,10 L65,140 L20,140 L100,195 L180,140 L135,140 L135,10 Z",
    vb: "0 0 200 205",
  },
  {
    label: "↔ Double",
    path: "M5,100 L45,42 L45,78 L155,78 L155,42 L195,100 L155,158 L155,122 L45,122 L45,158 Z",
    vb: "0 0 200 200",
  },
  {
    label: "↕ Double",
    path: "M100,5 L158,45 L122,45 L122,155 L158,155 L100,195 L42,155 L78,155 L78,45 L42,45 Z",
    vb: "0 0 200 200",
  },
  {
    label: "Chevron →",
    path: "M0,0 L130,100 L0,200 L55,200 L190,100 L55,0 Z",
    vb: "0 0 195 200",
  },
  {
    label: "Chevron ←",
    path: "M200,0 L70,100 L200,200 L145,200 L10,100 L145,0 Z",
    vb: "0 0 205 200",
  },
  {
    label: "Notch →",
    path: "M0,72 L155,72 L200,100 L155,128 L0,128 L38,100 Z",
    vb: "0 0 205 200",
  },
  {
    label: "Notch ←",
    path: "M200,72 L45,72 L0,100 L45,128 L200,128 L162,100 Z",
    vb: "0 0 205 200",
  },
] as const;

const BUBBLE_SHAPES = [
  {
    label: "Round",
    path: "M20,0 Q0,0 0,20 L0,110 Q0,130 20,130 L55,130 L35,162 L85,130 L180,130 Q200,130 200,110 L200,20 Q200,0 180,0 Z",
    vb: "0 0 205 170",
  },
  {
    label: "Square",
    path: "M0,0 L200,0 L200,120 L120,120 L100,158 L80,120 L0,120 Z",
    vb: "0 0 205 165",
  },
  {
    label: "Oval",
    path: "M95,5 C42,5 0,38 0,80 C0,122 42,155 95,155 C115,155 133,149 148,138 L176,166 L163,132 C184,118 200,101 200,80 C200,38 148,5 95,5 Z",
    vb: "0 0 205 172",
  },
  {
    label: "Thought",
    path: "M10,78 C10,36 50,5 100,5 C150,5 190,36 190,78 C190,120 150,151 100,151 C88,151 77,149 67,145 L52,168 L65,144 C34,133 10,108 10,78 Z M73,165 C73,158 78,152 85,152 C92,152 97,158 97,165 C97,172 92,178 85,178 C78,178 73,172 73,165 Z M60,180 C60,174 65,169 71,169 C77,169 82,174 82,180 C82,186 77,191 71,191 C65,191 60,186 60,180 Z",
    vb: "0 0 200 195",
  },
  {
    label: "Spiky",
    path: "M100,5 L115,32 L148,17 L136,47 L170,40 L153,66 L188,68 L163,87 L194,96 L164,103 L188,121 L156,118 L174,146 L141,133 L144,164 L114,149 L107,180 L93,151 L79,180 L72,149 L42,164 L45,133 L12,146 L30,118 L-2,121 L22,103 L-7,96 L24,87 L-1,68 L34,66 L17,40 L51,47 L39,17 L72,32 Z",
    vb: "5 5 190 180",
  },
] as const;

const CLOUD_SHAPES = [
  {
    label: "Simple",
    path: "M50,90 C30,90 15,75 15,57 C15,41 28,28 46,27 C48,13 62,5 80,7 C90,1 104,5 110,15 C120,9 134,10 140,19 C155,15 168,27 166,43 C180,45 190,59 186,73 C182,83 172,91 160,89 L50,89 Z",
    vb: "10 0 185 95",
  },
  {
    label: "Fluffy",
    path: "M27,100 C13,100 3,88 7,73 C7,55 21,43 39,43 C39,25 55,13 73,15 C81,3 97,0 112,7 C125,0 142,7 147,21 C163,16 181,30 178,49 C193,51 203,67 199,82 C197,95 185,105 170,101 L43,101 Z",
    vb: "3 0 205 110",
  },
  {
    label: "Wispy",
    path: "M17,77 C7,77 1,66 6,55 C6,43 18,33 33,33 C35,21 47,13 61,15 C69,7 82,5 92,10 C102,4 117,9 121,20 C135,17 148,28 146,41 C159,44 166,57 162,68 C160,77 151,83 141,79 L23,79 Z",
    vb: "0 3 170 82",
  },
  {
    label: "Puffy",
    path: "M35,115 C15,115 2,100 6,82 C5,62 20,48 40,48 C40,28 56,14 76,16 C84,4 100,0 115,7 C130,0 148,12 151,28 C168,22 186,38 183,58 C198,62 206,78 200,94 C196,106 183,117 169,113 L52,113 Z",
    vb: "2 0 210 120",
  },
] as const;

const HEART_SHAPES: Array<{
  label: string;
  path: string;
  vb: string;
  opts?: Record<string, unknown>;
}> = [
  {
    label: "Classic",
    path: "M100,170 C100,170 5,115 5,65 C5,30 28,10 58,10 C74,10 88,18 100,30 C112,18 126,10 142,10 C172,10 195,30 195,65 C195,115 100,170 100,170 Z",
    vb: "0 5 200 170",
  },
  {
    label: "Chubby",
    path: "M100,175 C100,175 0,120 0,68 C0,30 25,5 58,5 C76,5 92,16 100,30 C108,16 124,5 142,5 C175,5 200,30 200,68 C200,120 100,175 100,175 Z",
    vb: "0 5 200 175",
  },
  {
    label: "Outline",
    path: "M100,170 C100,170 5,115 5,65 C5,30 28,10 58,10 C74,10 88,18 100,30 C112,18 126,10 142,10 C172,10 195,30 195,65 C195,115 100,170 100,170 Z",
    vb: "0 5 200 170",
    opts: { fill: "transparent", stroke: "#6366f1", strokeWidth: 8 },
  },
  {
    label: "Pointy",
    path: "M100,192 C80,162 5,112 5,65 C5,30 28,10 58,10 C74,10 88,20 100,35 C112,20 126,10 142,10 C172,10 195,30 195,65 C195,112 120,162 100,192 Z",
    vb: "0 5 200 195",
  },
];

const BANNER_SHAPES: Array<{
  label: string;
  path?: string;
  vb?: string;
  scale?: number;
  star?: { pts: number; ratio: number };
}> = [
  {
    label: "Ribbon",
    path: "M0,0 L18,38 L0,76 L220,76 L202,38 L220,0 Z",
    vb: "0 0 225 80",
    scale: 0.85,
  },
  {
    label: "Wavy",
    path: "M0,40 Q50,5 100,40 Q150,75 200,40 L200,95 Q150,130 100,95 Q50,60 0,95 Z",
    vb: "0 0 205 135",
    scale: 0.95,
  },
  {
    label: "Tag",
    path: "M0,0 L175,0 L205,60 L175,120 L0,120 Z",
    vb: "0 0 210 125",
    scale: 0.9,
  },
  {
    label: "Pennant",
    path: "M0,0 L200,70 L0,140 Z",
    vb: "0 0 205 145",
    scale: 0.9,
  },
  {
    label: "Scroll",
    path: "M30,10 C15,10 5,20 5,35 L5,115 C5,130 15,140 30,140 L170,140 C185,140 195,130 195,115 L195,35 C195,20 185,10 170,10 Z",
    vb: "0 0 205 155",
    scale: 0.9,
  },
  { label: "Badge", star: { pts: 16, ratio: 0.82 } },
];

// ─── Reusable shape button ────────────────────────────────────
function ShapeBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-lg bg-secondary hover:bg-accent border border-border flex flex-col items-center justify-center gap-1 transition-colors p-1"
    >
      {children}
      <span className="text-[9px] text-muted-foreground leading-tight text-center">
        {label}
      </span>
    </button>
  );
}

function addCodeWidgetToCanvas(
  editor: ReturnType<typeof useCanvasEditor>,
  prompt: string
) {
  editor.addShape("rounded-rect", {
    left: 120,
    top: 120,
    width: 520,
    height: 320,
    fill: "#0f172a",
    stroke: "#38bdf8",
    strokeWidth: 2,
  });
  editor.addText({
    text: `// ${prompt.slice(0, 48) || "Generated widget"}\nconst widget = {\n  title: "Interactive block",\n  action: "Customize in editor"\n};`,
    left: 150,
    top: 155,
    width: 460,
    fontSize: 22,
    fontFamily: "Source Code Pro, monospace",
    fill: "#e2e8f0",
  } as any);
}

function addChartWidgetToCanvas(
  editor: ReturnType<typeof useCanvasEditor>,
  prompt: string
) {
  const values = [68, 44, 82, 55];
  editor.addText({
    text: prompt || "AI chart",
    left: 120,
    top: 110,
    width: 420,
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Montserrat",
    fill: "#111827",
  } as any);
  values.forEach((value, index) => {
    editor.addShape("rounded-rect", {
      left: 130 + index * 88,
      top: 330 - value * 2,
      width: 54,
      height: value * 2,
      fill: ["#2563eb", "#14b8a6", "#f97316", "#8b5cf6"][index],
    });
    editor.addText({
      text: `${value}`,
      left: 132 + index * 88,
      top: 344,
      width: 52,
      fontSize: 16,
      fontFamily: "Inter",
      fill: "#475569",
    } as any);
  });
}

function addFormWidgetToCanvas(
  editor: ReturnType<typeof useCanvasEditor>,
  prompt: string
) {
  editor.addText({
    text: prompt || "Contact form",
    left: 120,
    top: 110,
    width: 420,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "Montserrat",
    fill: "#111827",
  } as any);

  ["Name", "Email", "Message"].forEach((label, index) => {
    const top = 175 + index * 74;
    editor.addText({
      text: label,
      left: 126,
      top: top - 26,
      width: 160,
      fontSize: 16,
      fontFamily: "Inter",
      fill: "#475569",
    } as any);
    editor.addShape("rounded-rect", {
      left: 120,
      top,
      width: 430,
      height: index === 2 ? 86 : 46,
      fill: "#ffffff",
      stroke: "#cbd5e1",
      strokeWidth: 2,
    });
  });
}

// ─── Elements Panel ──────────────────────────────────────────
function ElementsPanel({
  editor,
  searchQuery,
  setSearchQuery,
  aiMode,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  aiMode: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState("basic");
  const [aiScope, setAiScope] =
    useState<(typeof ELEMENT_AI_SCOPES)[number]>("Image");
  const generateImageMut = trpc.ai.generateImage.useMutation();
  const generateSvgMut = trpc.ai.generateSvg.useMutation();
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readRecentItems(RECENT_ELEMENT_SEARCHES_KEY)
  );
  const [recentAiPrompts, setRecentAiPrompts] = useState<string[]>(() =>
    readRecentItems(RECENT_ELEMENT_AI_PROMPTS_KEY)
  );

  const categories = [
    { id: "basic", label: "Basic" },
    { id: "polygons", label: "Polygons" },
    { id: "stars", label: "Stars" },
    { id: "arrows", label: "Arrows" },
    { id: "bubbles", label: "Bubbles" },
    { id: "clouds", label: "Clouds" },
    { id: "hearts", label: "Hearts" },
    { id: "banners", label: "Banners" },
  ];

  const quickColors = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#64748b",
    "#000000",
    "#ffffff",
  ];
  const normalizedSearch = aiMode ? "" : searchQuery.trim().toLowerCase();
  const isGeneratingElement =
    generateImageMut.isPending || generateSvgMut.isPending;
  const selectedScopeCost =
    aiScope === "Image"
      ? AI_CREDIT_ESTIMATES.image
      : aiScope === "Graphic"
        ? AI_CREDIT_ESTIMATES.svg
        : aiScope === "Code"
          ? AI_CREDIT_ESTIMATES.code
          : aiScope === "Charts"
            ? AI_CREDIT_ESTIMATES.chart
            : aiScope === "Forms"
              ? AI_CREDIT_ESTIMATES.form
              : 0;
  const visibleCategories = normalizedSearch
    ? categories.filter(
        category =>
          category.id.includes(normalizedSearch) ||
          category.label.toLowerCase().includes(normalizedSearch)
      )
    : categories;

  useEffect(() => {
    if (!aiMode && searchQuery.trim().length > 2) {
      setRecentSearches(
        rememberRecentItem(RECENT_ELEMENT_SEARCHES_KEY, searchQuery)
      );
    }
  }, [aiMode, searchQuery]);

  const handleGenerateElement = async () => {
    const prompt = searchQuery.trim();
    if (!prompt || isGeneratingElement) return;

    if (aiScope === "Image") {
      toast.info(
        `Generating AI element. ${aiCreditLabel(AI_CREDIT_ESTIMATES.image)}.`
      );
      try {
        const result = await generateImageMut.mutateAsync({ prompt });
        if (result.url) {
          await editor.addImage(result.url);
          setRecentAiPrompts(
            rememberRecentItem(RECENT_ELEMENT_AI_PROMPTS_KEY, prompt)
          );
          toast.success("AI element added to canvas!");
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Element generation failed.";
        toast.error(msg);
      }
      return;
    }

    if (aiScope === "Graphic") {
      toast.info(
        `Generating editable SVG. ${aiCreditLabel(AI_CREDIT_ESTIMATES.svg)}.`
      );
      try {
        const result = await generateSvgMut.mutateAsync({
          prompt,
          width: 1024,
          height: 1024,
        });
        await editor.addSvg(result.svg);
        setRecentAiPrompts(
          rememberRecentItem(RECENT_ELEMENT_AI_PROMPTS_KEY, prompt)
        );
        toast.success("Editable SVG added to canvas.");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "SVG generation failed.";
        toast.error(msg);
      }
      return;
    }

    if (aiScope === "Code") {
      addCodeWidgetToCanvas(editor, prompt);
      setRecentAiPrompts(
        rememberRecentItem(RECENT_ELEMENT_AI_PROMPTS_KEY, prompt)
      );
      toast.success("Code widget added to canvas.");
      return;
    }

    if (aiScope === "Shapes") {
      editor.addShape("rounded-rect", {
        width: 180,
        height: 120,
        fill: "#6366f1",
      });
      setRecentAiPrompts(
        rememberRecentItem(RECENT_ELEMENT_AI_PROMPTS_KEY, prompt)
      );
      toast.success("Shape added to canvas.");
      return;
    }

    if (aiScope === "Charts") {
      addChartWidgetToCanvas(editor, prompt);
      setRecentAiPrompts(
        rememberRecentItem(RECENT_ELEMENT_AI_PROMPTS_KEY, prompt)
      );
      toast.success("Chart widget added to canvas.");
      return;
    }

    if (aiScope === "Forms") {
      addFormWidgetToCanvas(editor, prompt);
      setRecentAiPrompts(
        rememberRecentItem(RECENT_ELEMENT_AI_PROMPTS_KEY, prompt)
      );
      toast.success("Form layout added to canvas.");
      return;
    }

    toast.info(`${aiScope} generation is tracked for a later provider phase.`);
  };

  return (
    <div className="space-y-3">
      {aiMode && (
        <div className="flex gap-1.5">
          <select
            title="AI generation scope"
            value={aiScope}
            onChange={event =>
              setAiScope(
                event.target.value as (typeof ELEMENT_AI_SCOPES)[number]
              )
            }
            className="h-8 flex-1 rounded-md border border-border bg-secondary px-2 text-xs text-card-foreground"
          >
            {ELEMENT_AI_SCOPES.map(scope => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            className="h-8 px-2 text-xs shrink-0"
            disabled={!searchQuery.trim() || isGeneratingElement}
            onClick={handleGenerateElement}
          >
            {isGeneratingElement ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}
      {recentSearches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recentSearches.map(query => (
            <button
              key={query}
              type="button"
              className="rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground hover:text-card-foreground"
              onClick={() => setSearchQuery(query)}
            >
              {query}
            </button>
          ))}
        </div>
      )}
      {/* Category tabs */}
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Basic ── */}
      {activeCategory === "basic" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { type: "rect" as ShapeType, label: "Rect", icon: Square },
                {
                  type: "rounded-rect" as ShapeType,
                  label: "Rounded",
                  icon: Square,
                },
                { type: "circle" as ShapeType, label: "Circle", icon: Circle },
                {
                  type: "triangle" as ShapeType,
                  label: "Triangle",
                  icon: Triangle,
                },
                { type: "star" as ShapeType, label: "Star", icon: Star },
                {
                  type: "ellipse" as ShapeType,
                  label: "Ellipse",
                  icon: Circle,
                },
                {
                  type: "diamond" as ShapeType,
                  label: "Diamond",
                  icon: Diamond,
                },
                { type: "heart" as ShapeType, label: "Heart", icon: Heart },
              ] as Array<{
                type: ShapeType;
                label: string;
                icon: React.ComponentType<{ className?: string }>;
              }>
            ).map(s => (
              <button
                key={s.type}
                onClick={() => editor.addShape(s.type)}
                className="aspect-square rounded-lg bg-secondary hover:bg-accent border border-border flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <s.icon className="w-5 h-5 text-card-foreground" />
                <span className="text-[9px] text-muted-foreground">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground font-medium">
            Quick Colors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickColors.map(c => (
              <button
                key={c}
                onClick={() =>
                  editor.addShape("rect", { fill: c, width: 100, height: 100 })
                }
                title={c}
                className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground font-medium">Lines</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => editor.addShape("line")}
              className="h-10 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center text-xs text-card-foreground"
            >
              <Minus className="w-5 h-5 mr-1" /> Thin
            </button>
            <button
              onClick={() =>
                editor.addShape("line", { stroke: "#6366f1", strokeWidth: 4 })
              }
              className="h-10 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center text-xs text-card-foreground"
            >
              <Minus className="w-5 h-5 mr-1" /> Thick
            </button>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground font-medium">
            Gradient Blocks
          </p>
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
                onClick={() =>
                  editor.addShape("rounded-rect", {
                    fill: c1,
                    width: 200,
                    height: 200,
                  })
                }
                title={`Gradient: ${c1} to ${c2}`}
                className="aspect-square rounded-lg border border-border hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Polygons ── */}
      {activeCategory === "polygons" && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { sides: 3, label: "Triangle" },
            { sides: 4, label: "Square" },
            { sides: 5, label: "Pentagon" },
            { sides: 6, label: "Hexagon" },
            { sides: 7, label: "Heptagon" },
            { sides: 8, label: "Octagon" },
          ].map(({ sides, label }) => (
            <ShapeBtn
              key={sides}
              label={label}
              onClick={() => editor.addPolygonByCount(sides)}
            >
              <svg
                viewBox="0 0 200 200"
                className="w-9 h-9 fill-current text-card-foreground"
              >
                <path d={makePolygonPath(sides)} />
              </svg>
            </ShapeBtn>
          ))}
        </div>
      )}

      {/* ── Stars ── */}
      {activeCategory === "stars" && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { pts: 4, ratio: 0.38, label: "4-Point" },
            { pts: 5, ratio: 0.45, label: "5-Point" },
            { pts: 6, ratio: 0.45, label: "6-Point" },
            { pts: 8, ratio: 0.5, label: "8-Point" },
            { pts: 12, ratio: 0.82, label: "Burst" },
            { pts: 16, ratio: 0.6, label: "Spiky" },
          ].map(({ pts, ratio, label }) => (
            <ShapeBtn
              key={pts}
              label={label}
              onClick={() => editor.addStarByCount(pts, ratio)}
            >
              <svg
                viewBox="0 0 200 200"
                className="w-9 h-9 fill-current text-card-foreground"
              >
                <path d={makeStarPath(pts, 85, Math.round(85 * ratio))} />
              </svg>
            </ShapeBtn>
          ))}
        </div>
      )}

      {/* ── Arrows ── */}
      {activeCategory === "arrows" && (
        <div className="grid grid-cols-3 gap-2">
          {ARROW_SHAPES.map(s => (
            <ShapeBtn
              key={s.label}
              label={s.label}
              onClick={() => editor.addPath(s.path, 0.9)}
            >
              <svg
                viewBox={s.vb}
                className="w-9 h-9 fill-current text-card-foreground"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d={s.path} />
              </svg>
            </ShapeBtn>
          ))}
        </div>
      )}

      {/* ── Speech Bubbles ── */}
      {activeCategory === "bubbles" && (
        <div className="grid grid-cols-2 gap-2">
          {BUBBLE_SHAPES.map(s => (
            <ShapeBtn
              key={s.label}
              label={s.label}
              onClick={() => editor.addPath(s.path, 0.85)}
            >
              <svg
                viewBox={s.vb}
                className="w-12 h-10 fill-current text-card-foreground"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d={s.path} />
              </svg>
            </ShapeBtn>
          ))}
        </div>
      )}

      {/* ── Clouds ── */}
      {activeCategory === "clouds" && (
        <div className="grid grid-cols-2 gap-2">
          {CLOUD_SHAPES.map(s => (
            <ShapeBtn
              key={s.label}
              label={s.label}
              onClick={() => editor.addPath(s.path, 1.0)}
            >
              <svg
                viewBox={s.vb}
                className="w-14 h-7 fill-current text-card-foreground"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d={s.path} />
              </svg>
            </ShapeBtn>
          ))}
        </div>
      )}

      {/* ── Hearts ── */}
      {activeCategory === "hearts" && (
        <div className="grid grid-cols-2 gap-2">
          {HEART_SHAPES.map(s => (
            <ShapeBtn
              key={s.label}
              label={s.label}
              onClick={() => editor.addPath(s.path, 1.0, s.opts ?? {})}
            >
              <svg
                viewBox={s.vb}
                preserveAspectRatio="xMidYMid meet"
                className={`w-9 h-9 text-card-foreground ${
                  s.opts ? styles.heartOutline : styles.heartFill
                }`}
              >
                <path d={s.path} />
              </svg>
            </ShapeBtn>
          ))}
        </div>
      )}

      {/* ── Banners ── */}
      {activeCategory === "banners" && (
        <div className="grid grid-cols-2 gap-2">
          {BANNER_SHAPES.map(s =>
            s.star ? (
              <ShapeBtn
                key={s.label}
                label={s.label}
                onClick={() =>
                  editor.addStarByCount(s.star!.pts, s.star!.ratio)
                }
              >
                <svg
                  viewBox="0 0 200 200"
                  className="w-9 h-9 fill-current text-card-foreground"
                >
                  <path
                    d={makeStarPath(
                      s.star.pts,
                      85,
                      Math.round(85 * s.star.ratio)
                    )}
                  />
                </svg>
              </ShapeBtn>
            ) : (
              <ShapeBtn
                key={s.label}
                label={s.label}
                onClick={() => editor.addPath(s.path!, s.scale ?? 1.0)}
              >
                <svg
                  viewBox={s.vb}
                  className="w-14 h-8 fill-current text-card-foreground"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path d={s.path} />
                </svg>
              </ShapeBtn>
            )
          )}
        </div>
      )}
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
        <p
          className="text-lg font-bold text-card-foreground"
          style={{ fontFamily: "Montserrat" }}
        >
          Add a heading
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Montserrat Bold, 48px
        </p>
      </button>
      <button
        onClick={() => editor.addSubheading()}
        className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
      >
        <p
          className="text-base font-semibold text-card-foreground"
          style={{ fontFamily: "Poppins" }}
        >
          Add a subheading
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Poppins Semibold, 28px
        </p>
      </button>
      <button
        onClick={() => editor.addText()}
        className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
      >
        <p
          className="text-sm text-card-foreground"
          style={{ fontFamily: "Inter" }}
        >
          Add body text
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Inter Regular, 16px
        </p>
      </button>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">
        Font Combinations
      </p>
      <div className="space-y-2">
        {[
          {
            heading: "Playfair Display",
            body: "Lato",
            label: "Elegant",
            desc: "Classic serif + clean sans",
          },
          {
            heading: "Montserrat",
            body: "Open Sans",
            label: "Modern",
            desc: "Geometric + humanist",
          },
          {
            heading: "Poppins",
            body: "Roboto",
            label: "Clean",
            desc: "Round + neutral",
          },
          {
            heading: "Raleway",
            body: "Source Sans Pro",
            label: "Professional",
            desc: "Thin + readable",
          },
          {
            heading: "Oswald",
            body: "Merriweather",
            label: "Bold",
            desc: "Condensed + traditional",
          },
        ].map(combo => (
          <button
            key={combo.label}
            className="w-full p-3 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
            onClick={() => {
              editor.addText({
                fontFamily: combo.heading,
                fontSize: 36,
                fontWeight: "bold",
              });
              toast.success(`Applied ${combo.label} font combination`);
            }}
          >
            <p
              className="text-sm font-bold text-card-foreground"
              style={{ fontFamily: combo.heading }}
            >
              {combo.label}
            </p>
            <p className="text-[10px] text-muted-foreground">{combo.desc}</p>
          </button>
        ))}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground font-medium">Text Presets</p>
      <div className="space-y-1.5">
        {[
          {
            text: "SALE",
            size: 72,
            weight: "900",
            color: "#ef4444",
            label: "Sale Banner",
          },
          {
            text: "Coming Soon",
            size: 42,
            weight: "300",
            color: "#6366f1",
            label: "Announcement",
          },
          {
            text: "THANK YOU",
            size: 48,
            weight: "bold",
            color: "#22c55e",
            label: "Thank You",
          },
          {
            text: "NEW",
            size: 64,
            weight: "900",
            color: "#f59e0b",
            label: "New Badge",
          },
        ].map(preset => (
          <button
            key={preset.label}
            className="w-full p-2 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors"
            onClick={() =>
              editor.addText({
                fontSize: preset.size,
                fontWeight: preset.weight as any,
                fill: preset.color,
                fontFamily: "Montserrat",
              } as any)
            }
          >
            <span
              className="text-xs"
              style={{ color: preset.color, fontWeight: preset.weight }}
            >
              {preset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Photos Panel ────────────────────────────────────────────
function PhotosPanel({
  editor,
  searchQuery,
  setSearchQuery,
  aiMode,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  aiMode: boolean;
}) {
  const [committedQuery, setCommittedQuery] = useState(
    searchQuery.trim() || "nature"
  );
  const [orientation, setOrientation] = useState("");
  const [page, setPage] = useState(1);
  const [allPhotos, setAllPhotos] = useState<UnsplashPhoto[]>([]);
  const generatePhotoMut = trpc.ai.generateImage.useMutation();
  const triggerDownload = trpc.assets.triggerUnsplashDownload.useMutation();

  const handleGeneratePhoto = async () => {
    const prompt = searchQuery.trim();
    if (!prompt || generatePhotoMut.isPending) return;
    toast.info(
      `Generating AI photo. ${aiCreditLabel(AI_CREDIT_ESTIMATES.image)}.`
    );
    try {
      const result = await generatePhotoMut.mutateAsync({ prompt });
      if (result.url) {
        await editor.addImage(result.url);
        toast.success("AI photo added to canvas!");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Photo generation failed."
      );
    }
  };

  const { data: unsplashResult, isLoading } =
    trpc.assets.searchUnsplash.useQuery(
      { query: committedQuery, page, orientation: orientation || undefined },
      { enabled: !aiMode }
    );

  // Accumulate pages — reset when query/orientation changes (page resets to 1)
  useEffect(() => {
    if (!unsplashResult?.photos) return;
    if (page === 1) {
      setAllPhotos(unsplashResult.photos);
    } else {
      setAllPhotos(prev => [...prev, ...unsplashResult.photos]);
    }
  }, [unsplashResult, page]);

  useEffect(() => {
    if (aiMode) return;

    const nextQuery = searchQuery.trim() || "nature";
    if (nextQuery !== committedQuery) {
      setCommittedQuery(nextQuery);
      setPage(1);
      setAllPhotos([]);
    }
  }, [aiMode, committedQuery, searchQuery]);

  const hasMore =
    unsplashResult != null && page < (unsplashResult.totalPages ?? 1);

  const handleAddPhoto = async (photo: UnsplashPhoto) => {
    await editor.addImage(photo.url);
    toast.success("Photo added to canvas");
    triggerDownload.mutateAsync(photo.downloadLocation).catch(() => {
      /* non-fatal */
    });
  };

  const QUICK_TOPICS = [
    "Nature",
    "Business",
    "Technology",
    "People",
    "Food",
    "Abstract",
    "Architecture",
    "Travel",
  ];

  return (
    <div className="space-y-3">
      {aiMode && (
        <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-3">
          <p className="text-[10px] text-muted-foreground">
            {aiCreditLabel(AI_CREDIT_ESTIMATES.image)}
          </p>
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            disabled={!searchQuery.trim() || generatePhotoMut.isPending}
            onClick={handleGeneratePhoto}
          >
            {generatePhotoMut.isPending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1 h-3 w-3" /> Generate Photo
              </>
            )}
          </Button>
        </div>
      )}

      {/* Unsplash search mode */}
      {!aiMode && (
        <>
          {/* Orientation filter */}
          <select
            title="Orientation"
            value={orientation}
            onChange={e => {
              setOrientation(e.target.value);
              setPage(1);
              setAllPhotos([]);
            }}
            className="w-full h-8 rounded-md border border-border bg-secondary px-2 text-xs text-card-foreground"
          >
            <option value="">Any orientation</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
            <option value="squarish">Square</option>
          </select>

          {/* Quick topic chips */}
          <div className="flex flex-wrap gap-1">
            {QUICK_TOPICS.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag.toLowerCase());
                }}
                className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Click a photo to add it to your design
          </p>

          {/* Photo grid */}
          {isLoading && allPhotos.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allPhotos.map((photo, i) => (
                <div
                  key={`${photo.id}-${i}`}
                  className="aspect-square rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all group relative"
                >
                  <button
                    type="button"
                    onClick={() => handleAddPhoto(photo)}
                    className="absolute inset-0 z-10"
                    aria-label={`Add photo by ${photo.photographer} to design`}
                  />
                  <img
                    src={photo.thumb}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  {/* Photographer attribution — shown on hover, required by Unsplash */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform bg-black/75 px-1.5 py-1 text-left">
                    <div className="flex items-center gap-1">
                      <Camera className="h-2.5 w-2.5 text-white/70 shrink-0" />
                      <a
                        href={photo.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="truncate text-[9px] text-white/90 hover:text-white hover:underline"
                      >
                        {photo.photographer}
                      </a>
                    </div>
                    <a
                      href={photo.unsplashUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[8px] text-white/60 hover:text-white/90 hover:underline"
                    >
                      Unsplash
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full h-8 text-xs"
              disabled={isLoading}
              onClick={() => setPage(p => p + 1)}
            >
              {isLoading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ChevronDown className="mr-1 h-3 w-3" />
              )}
              Load more photos
            </Button>
          )}

          {/* Unsplash branding — required by Unsplash API guidelines */}
          <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-border">
            <span className="text-[9px] text-muted-foreground">Photos by</span>
            <a
              href="https://unsplash.com/?utm_source=ms_studio&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-medium text-foreground hover:underline"
            >
              Unsplash
            </a>
            <span className="text-[9px] text-muted-foreground">
              · Free to use
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Uploads Panel ───────────────────────────────────────────
function UploadsPanel({
  editor,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
}) {
  const [uploads, setUploads] = useState<Array<{ url: string; name: string }>>(
    () => {
      try {
        const stored = window.localStorage.getItem(UPLOADS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  );
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      setUploading(true);

      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const url = ev.target?.result as string;
          setUploads(prev => {
            const next = [...prev, { url, name: file.name }];
            try {
              window.localStorage.setItem(
                UPLOADS_STORAGE_KEY,
                JSON.stringify(next)
              );
            } catch {}
            return next;
          });
          editor.addImage(url);
          toast.success(`Added ${file.name}`);
          setUploading(false);
        };
        reader.readAsDataURL(file);
      });
    },
    [editor]
  );

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-colors bg-secondary/50">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mb-1" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
        )}
        <span className="text-xs text-muted-foreground">
          {uploading ? "Uploading..." : "Upload images"}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          PNG, JPG, SVG up to 10MB
        </span>
        <input
          type="file"
          title="Upload images"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        {uploads.map((u, i) => (
          <button
            key={i}
            onClick={() => editor.addImage(u.url)}
            className="aspect-square rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all relative group"
          >
            <img
              src={u.url}
              alt={u.name}
              className="w-full h-full object-cover"
            />
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
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Upload images to use in your designs
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Brand Kit Panel ─────────────────────────────────────────
function BrandPanel({
  editor,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
}) {
  const [brandColors, setBrandColors] = useState(() => {
    const stored = readBrandKitSnapshot();
    return stored?.colors.length ? stored.colors : DEFAULT_BRAND_COLORS;
  });
  const [brandLogos, setBrandLogos] = useState(
    () => readBrandKitSnapshot()?.logos ?? []
  );
  const [newColor, setNewColor] = useState("#6366f1");
  const [logoAiPrompt, setLogoAiPrompt] = useState("");
  const [logoUploadPending, setLogoUploadPending] = useState(false);
  const recoveredLegacyLogosRef = useRef(false);
  const generateLogoMut = trpc.ai.generateImage.useMutation();

  useEffect(() => {
    if (recoveredLegacyLogosRef.current || brandLogos.length > 0) {
      return;
    }

    const stored = readBrandKitSnapshot();
    if (!stored || stored.logoCount <= 0 || stored.logos.length > 0) {
      return;
    }

    const imageUrls = editor
      .getObjects()
      .filter(object => object.type === "image")
      .map(object => {
        const imageObject = object as { getSrc?: () => string; src?: string };
        return typeof imageObject.getSrc === "function"
          ? imageObject.getSrc()
          : imageObject.src;
      })
      .filter((url): url is string => typeof url === "string" && !!url);

    if (imageUrls.length === 0) {
      return;
    }

    recoveredLegacyLogosRef.current = true;
    setBrandLogos(
      imageUrls
        .slice(-stored.logoCount)
        .reverse()
        .map((url, index) =>
          createBrandLogoAsset(`Logo ${index + 1}`, url, "upload")
        )
    );
  }, [brandLogos.length, editor]);

  useEffect(() => {
    writeBrandKitSnapshot({
      colors: brandColors,
      fonts: BRAND_FONT_OPTIONS.map(font => font.name),
      logos: brandLogos,
      logoCount: brandLogos.length,
    });
  }, [brandColors, brandLogos]);

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }

    setLogoUploadPending(true);
    try {
      const savedLogos: BrandLogoAsset[] = [];
      for (const file of files) {
        const logoUrl = await createPersistableLogoDataUrl(file);
        await editor.addImage(logoUrl);
        savedLogos.push(createBrandLogoAsset(file.name, logoUrl, "upload"));
      }

      const nextLogos = [...savedLogos, ...brandLogos];
      const didPersist = writeBrandKitSnapshot({
        colors: brandColors,
        fonts: BRAND_FONT_OPTIONS.map(font => font.name),
        logos: nextLogos,
        logoCount: nextLogos.length,
      });

      setBrandLogos(nextLogos);
      if (didPersist) {
        toast.success(
          `${savedLogos.length} logo${savedLogos.length === 1 ? "" : "s"} saved to Brand Kit`
        );
      } else {
        toast.error("Logo added, but the Brand Kit could not save it.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Logo upload failed."
      );
    } finally {
      setLogoUploadPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Brand Colors
        </p>
        <div className="flex flex-wrap gap-2">
          {brandColors.map((c, i) => (
            <div key={i} className="text-center">
              <button
                title={c.name}
                className="w-10 h-10 rounded-lg border border-border hover:scale-110 transition-transform"
                style={{ background: c.hex }}
                onClick={() => editor.updateActiveObject({ fill: c.hex })}
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {c.name}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input
            type="color"
            title="Pick a brand color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer"
          />
          <Input
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="h-7 text-xs bg-secondary flex-1"
            placeholder="#hex"
          />
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setBrandColors(current => [
                ...current,
                { name: `Color ${current.length + 1}`, hex: newColor },
              ]);
              toast.success("Color added to brand kit");
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Brand Fonts
        </p>
        <div className="space-y-1.5">
          {BRAND_FONT_OPTIONS.map(font => (
            <button
              key={font.name}
              className="w-full p-2 rounded-lg bg-secondary hover:bg-accent border border-border text-left transition-colors flex items-center justify-between"
              onClick={() => {
                editor.updateActiveObject({ fontFamily: font.name });
                toast.success(`Applied ${font.name}`);
              }}
            >
              <span
                className="text-sm text-card-foreground"
                style={{ fontFamily: font.name }}
              >
                {font.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {font.style}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Logos {brandLogos.length > 0 ? `(${brandLogos.length})` : ""}
        </p>
        {brandLogos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {brandLogos.map(logo => (
              <div
                key={logo.id}
                className="relative overflow-hidden rounded-lg border border-border bg-secondary group"
              >
                <button
                  type="button"
                  title={`Add ${logo.name} to canvas`}
                  onClick={() => editor.addImage(logo.url)}
                  className="aspect-square w-full overflow-hidden"
                >
                  <img
                    src={logo.url}
                    alt={logo.name}
                    className="h-full w-full object-contain p-1.5"
                  />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/65 px-1.5 py-0.5">
                  <p className="truncate text-[9px] text-white">{logo.name}</p>
                </div>
                <button
                  type="button"
                  title={`Remove ${logo.name}`}
                  onClick={() =>
                    setBrandLogos(current =>
                      current.filter(item => item.id !== logo.id)
                    )
                  }
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-sm bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-colors bg-secondary/50">
          {logoUploadPending ? (
            <Loader2 className="w-4 h-4 text-muted-foreground mb-0.5 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 text-muted-foreground mb-0.5" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {logoUploadPending ? "Saving logo..." : "Upload logo"}
          </span>
          <input
            type="file"
            title="Upload brand logo"
            accept="image/*"
            multiple
            className="hidden"
            disabled={logoUploadPending}
            onChange={handleLogoUpload}
          />
        </label>
      </div>

      <Separator />

      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
        <p className="text-xs font-medium text-primary flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Logo Generator
        </p>
        <p className="text-[10px] text-muted-foreground">
          {aiCreditLabel(AI_CREDIT_ESTIMATES.image)}
        </p>
        <textarea
          value={logoAiPrompt}
          onChange={e => setLogoAiPrompt(e.target.value)}
          placeholder="Use the power of AI to build your LOGO!"
          className="w-full h-16 text-xs bg-secondary rounded-md border border-border p-2 resize-none text-card-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="sm"
          className="w-full h-7 text-xs"
          disabled={!logoAiPrompt.trim() || generateLogoMut.isPending}
          onClick={async () => {
            if (!logoAiPrompt.trim()) return;
            toast.info(
              `Generating AI logo. ${aiCreditLabel(AI_CREDIT_ESTIMATES.image)}.`
            );
            try {
              const result = await generateLogoMut.mutateAsync({
                prompt: logoAiPrompt,
              });
              if (result.url) {
                await editor.addImage(result.url);
                setBrandLogos(current => [
                  createBrandLogoAsset("AI Logo", result.url, "ai"),
                  ...current,
                ]);
                toast.success("AI logo saved to Brand Kit");
                setLogoAiPrompt("");
              }
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Logo generation failed."
              );
            }
          }}
        >
          {generateLogoMut.isPending ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" /> Generate Logo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── AI Tools Panel ──────────────────────────────────────────
function AIPanel({
  editor,
  canvasWidth,
  canvasHeight,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const [aiPrompt, setAiPrompt] = useState("");

  const generateImageMut = trpc.ai.generateImage.useMutation();
  const suggestLayoutMut = trpc.ai.suggestLayout.useMutation();

  const handleGenerateElement = async () => {
    if (!aiPrompt.trim()) return;
    toast.info(
      `Generating with AI. ${aiCreditLabel(AI_CREDIT_ESTIMATES.image)}.`
    );
    try {
      const result = await generateImageMut.mutateAsync({ prompt: aiPrompt });
      if (result.url) {
        await editor.addImage(result.url);
        toast.success("AI element added to canvas!");
        setAiPrompt("");
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Generation failed. Please try again.";
      toast.error(msg);
    }
  };

  const handleSuggestLayout = async (purpose: string) => {
    toast.info("AI is designing a layout...");
    try {
      const result = await suggestLayoutMut.mutateAsync({
        purpose,
        canvasWidth,
        canvasHeight,
        brandContext: buildBrandKitContext(purpose),
      });
      if (applyLayoutSuggestionToCanvas(editor, result)) {
        toast.success(`Layout applied: ${result.description}`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Layout suggestion failed.";
      toast.error(msg);
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
        <p className="mb-1.5 text-[10px] text-muted-foreground">
          {aiCreditLabel(AI_CREDIT_ESTIMATES.image)}
        </p>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
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
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" /> Generate Element
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* AI Layout Suggestions */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          AI Layout Suggestions
        </p>
        <p className="mb-2 text-[10px] text-muted-foreground">
          {aiCreditLabel(AI_CREDIT_ESTIMATES.layout)}
        </p>
        <div className="space-y-1.5">
          {[
            {
              purpose:
                "Business flyer with headline, body text, and call to action",
              label: "Business Flyer",
            },
            {
              purpose:
                "Social media post with bold headline and product showcase",
              label: "Social Post",
            },
            {
              purpose: "Event invitation with date, venue, and RSVP details",
              label: "Event Invite",
            },
            {
              purpose:
                "Professional resume with sections for experience and skills",
              label: "Resume",
            },
          ].map(layout => (
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
                <p className="text-xs font-medium text-card-foreground">
                  {layout.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Auto-generate layout
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Magic Resize */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Magic Resize
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {magicResizePresets.map(preset => (
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
              <p className="text-[10px] font-medium text-card-foreground">
                {preset.label}
              </p>
              <p className="text-[9px] text-muted-foreground">{preset.size}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Image Filters */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Image Adjustments
        </p>
        <p className="text-[10px] text-muted-foreground mb-2">
          Select an image on canvas, then adjust
        </p>
        <div className="space-y-3">
          {[
            {
              icon: Sun,
              label: "Brightness",
              prop: "brightness",
              min: -100,
              max: 100,
            },
            {
              icon: Contrast,
              label: "Contrast",
              prop: "contrast",
              min: -100,
              max: 100,
            },
            {
              icon: Droplets,
              label: "Saturation",
              prop: "saturation",
              min: -100,
              max: 100,
            },
            { icon: Focus, label: "Blur", prop: "blur", min: 0, max: 20 },
          ].map(filter => (
            <div key={filter.prop} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <filter.icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {filter.label}
                  </span>
                </div>
                <span className="text-[10px] text-card-foreground">0</span>
              </div>
              <Slider
                defaultValue={[0]}
                min={filter.min}
                max={filter.max}
                step={1}
                onValueChange={([v]) => {
                  toast.info(
                    `${filter.label}: ${v} (applied to selected image)`
                  );
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
function LayersPanel({
  editor,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
}) {
  const objects = editor.getObjects();

  return (
    <div className="space-y-1">
      {objects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No elements on canvas</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Add elements to see layers
          </p>
        </div>
      )}
      {[...objects].reverse().map((obj, i) => {
        const realIndex = objects.length - 1 - i;
        const typeName =
          obj.type === "textbox"
            ? "Text"
            : obj.type === "image"
              ? "Image"
              : obj.type === "group"
                ? "Group"
                : obj.type || "Element";
        const isSelected = editor.editorState.selectedObjects.includes(obj);
        return (
          <button
            key={i}
            onClick={() => editor.selectObject(realIndex)}
            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
              isSelected
                ? "bg-primary/15 border border-primary/30"
                : "hover:bg-accent border border-transparent"
            }`}
          >
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
              {obj.type === "textbox" ? (
                <Type className="w-3.5 h-3.5 text-muted-foreground" />
              ) : obj.type === "image" ? (
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
              ) : obj.type === "group" ? (
                <Group className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Square className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-card-foreground truncate capitalize">
                {typeName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Layer {realIndex + 1}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {obj.lockMovementX && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Properties Panel ────────────────────────────────────────
function PropertiesPanel({
  editor,
  canvasWidth,
  canvasHeight,
}: {
  editor: ReturnType<typeof useCanvasEditor>;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const selectedObj = editor.editorState.selectedObjects[0];
  if (!selectedObj) return null;

  const isText =
    selectedObj.type === "textbox" || selectedObj.type === "i-text";

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <h3 className="text-xs font-semibold text-card-foreground uppercase tracking-wider">
          Properties
        </h3>

        {/* Position & Size */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">
            Position & Size
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-muted-foreground">X</label>
              <Input
                type="number"
                value={Math.round(selectedObj.left || 0)}
                onChange={e =>
                  editor.updateActiveObject({ left: Number(e.target.value) })
                }
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Y</label>
              <Input
                type="number"
                value={Math.round(selectedObj.top || 0)}
                onChange={e =>
                  editor.updateActiveObject({ top: Number(e.target.value) })
                }
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">W</label>
              <Input
                type="number"
                value={Math.round(
                  (selectedObj.width || 0) * (selectedObj.scaleX || 1)
                )}
                onChange={e => {
                  const w = Number(e.target.value);
                  editor.updateActiveObject({
                    scaleX: w / (selectedObj.width || 1),
                  });
                }}
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">H</label>
              <Input
                type="number"
                value={Math.round(
                  (selectedObj.height || 0) * (selectedObj.scaleY || 1)
                )}
                onChange={e => {
                  const h = Number(e.target.value);
                  editor.updateActiveObject({
                    scaleY: h / (selectedObj.height || 1),
                  });
                }}
                className="h-7 text-xs bg-secondary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-muted-foreground">
                Rotation
              </label>
              <Input
                type="number"
                value={Math.round(selectedObj.angle || 0)}
                onChange={e =>
                  editor.updateActiveObject({ angle: Number(e.target.value) })
                }
                className="h-7 text-xs bg-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">
                Corner Radius
              </label>
              <Input
                type="number"
                value={(selectedObj as any).rx || 0}
                onChange={e => {
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
            <p className="text-[10px] text-muted-foreground font-medium uppercase">
              Opacity
            </p>
            <span className="text-xs text-card-foreground">
              {Math.round((selectedObj.opacity ?? 1) * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round((selectedObj.opacity ?? 1) * 100)]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) =>
              editor.updateActiveObject({ opacity: v / 100 })
            }
          />
        </div>

        <Separator />

        {/* Fill Color */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">
            Fill
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              title="Fill color"
              value={(selectedObj.fill as string) || "#000000"}
              onChange={e =>
                editor.updateActiveObject({ fill: e.target.value })
              }
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <Input
              value={(selectedObj.fill as string) || "#000000"}
              onChange={e =>
                editor.updateActiveObject({ fill: e.target.value })
              }
              className="h-7 text-xs bg-secondary flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              "#000000",
              "#ffffff",
              "#6366f1",
              "#ec4899",
              "#14b8a6",
              "#f59e0b",
              "#ef4444",
              "#22c55e",
            ].map(c => (
              <button
                key={c}
                onClick={() => editor.updateActiveObject({ fill: c })}
                title={c}
                className="w-5 h-5 rounded border border-border hover:scale-125 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Stroke */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">
            Stroke
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              title="Stroke color"
              value={(selectedObj.stroke as string) || "#000000"}
              onChange={e =>
                editor.updateActiveObject({ stroke: e.target.value })
              }
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <Input
              type="number"
              value={selectedObj.strokeWidth || 0}
              onChange={e =>
                editor.updateActiveObject({
                  strokeWidth: Number(e.target.value),
                })
              }
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
              <p className="text-[10px] text-muted-foreground font-medium uppercase">
                Typography
              </p>
              <select
                title="Font family"
                value={(selectedObj as any).fontFamily || "Inter"}
                onChange={e =>
                  editor.updateActiveObject({ fontFamily: e.target.value })
                }
                className="w-full h-7 text-xs bg-secondary border border-border rounded-md px-2 text-card-foreground"
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  value={(selectedObj as any).fontSize || 16}
                  onChange={e =>
                    editor.updateActiveObject({
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs bg-secondary w-16"
                />
                <Button
                  variant={
                    (selectedObj as any).fontWeight === "bold"
                      ? "secondary"
                      : "ghost"
                  }
                  size="icon"
                  className="w-7 h-7"
                  onClick={() =>
                    editor.updateActiveObject({
                      fontWeight:
                        (selectedObj as any).fontWeight === "bold"
                          ? "normal"
                          : "bold",
                    })
                  }
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={
                    (selectedObj as any).fontStyle === "italic"
                      ? "secondary"
                      : "ghost"
                  }
                  size="icon"
                  className="w-7 h-7"
                  onClick={() =>
                    editor.updateActiveObject({
                      fontStyle:
                        (selectedObj as any).fontStyle === "italic"
                          ? "normal"
                          : "italic",
                    })
                  }
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={
                    (selectedObj as any).underline ? "secondary" : "ghost"
                  }
                  size="icon"
                  className="w-7 h-7"
                  onClick={() =>
                    editor.updateActiveObject({
                      underline: !(selectedObj as any).underline,
                    })
                  }
                >
                  <Underline className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex gap-1">
                {["left", "center", "right"].map(align => (
                  <Button
                    key={align}
                    variant={
                      (selectedObj as any).textAlign === align
                        ? "secondary"
                        : "ghost"
                    }
                    size="icon"
                    className="w-7 h-7"
                    onClick={() =>
                      editor.updateActiveObject({ textAlign: align })
                    }
                  >
                    {align === "left" ? (
                      <AlignLeft className="w-3.5 h-3.5" />
                    ) : align === "center" ? (
                      <AlignCenter className="w-3.5 h-3.5" />
                    ) : (
                      <AlignRight className="w-3.5 h-3.5" />
                    )}
                  </Button>
                ))}
              </div>

              {/* Line Height & Letter Spacing */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[10px] text-muted-foreground">
                    Line Height
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={(selectedObj as any).lineHeight || 1.2}
                    onChange={e =>
                      editor.updateActiveObject({
                        lineHeight: Number(e.target.value),
                      })
                    }
                    className="h-7 text-xs bg-secondary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">
                    Spacing
                  </label>
                  <Input
                    type="number"
                    value={(selectedObj as any).charSpacing || 0}
                    onChange={e =>
                      editor.updateActiveObject({
                        charSpacing: Number(e.target.value),
                      })
                    }
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
          <p className="text-[10px] text-muted-foreground font-medium uppercase">
            Align on Canvas
          </p>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-7"
              onClick={() => editor.alignObjects("left")}
            >
              <AlignStartVertical className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-7"
              onClick={() => editor.alignObjects("center")}
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-7"
              onClick={() => editor.alignObjects("right")}
            >
              <AlignEndVertical className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-7"
              onClick={() => editor.alignObjects("top")}
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-7"
              onClick={() => editor.alignObjects("middle")}
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-7"
              onClick={() => editor.alignObjects("bottom")}
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Canvas Background */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">
            Canvas Background
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              title="Canvas background color"
              defaultValue="#ffffff"
              onChange={e => editor.setBackground(e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <div className="flex gap-1">
              {[
                "#ffffff",
                "#f8fafc",
                "#1e293b",
                "#0f172a",
                "#fef3c7",
                "#fce7f3",
              ].map(c => (
                <button
                  key={c}
                  onClick={() => editor.setBackground(c)}
                  title={c}
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
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-7 text-card-foreground"
            onClick={editor.duplicateSelected}
          >
            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-7 text-destructive"
            onClick={editor.deleteSelected}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
