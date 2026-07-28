export type ReflowMode = "balanced" | "fit" | "fill";

export type CanvasPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  channel: "social" | "marketplace" | "web";
};

export type BrandProfile = {
  colors: Array<{ name: string; hex: string }>;
  fonts: string[];
  logoCount?: number;
};

export type BrandRuleOptions = {
  preserveColors: boolean;
  preserveFonts: boolean;
  preserveTextHierarchy: boolean;
};

export type ReflowOptions = {
  mode: ReflowMode;
  brandProfile?: BrandProfile | null;
  brandRules: BrandRuleOptions;
  sourceCanvas: {
    width: number;
    height: number;
  };
};

export type ReflowWarning = {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  layerIndex?: number;
};

export type DesignDiff = {
  summary: string[];
  canvas: {
    from: { width: number; height: number };
    to: { width: number; height: number };
  };
  layers: {
    total: number;
    backgrounds: number;
    content: number;
    text: number;
  };
};

export type FabricJsonObject = Record<string, unknown> & {
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  fill?: unknown;
  stroke?: unknown;
  fontFamily?: string;
  fontSize?: number;
  objects?: FabricJsonObject[];
};

export type FabricJsonDesign = Record<string, unknown> & {
  version?: string;
  width?: number;
  height?: number;
  background?: unknown;
  backgroundColor?: unknown;
  backgroundImage?: FabricJsonObject;
  objects?: FabricJsonObject[];
};

export type ReflowResult = {
  id: string;
  preset: CanvasPreset;
  design: FabricJsonDesign;
  warnings: ReflowWarning[];
  diff: DesignDiff;
  createdAt: string;
};

export type AcceptedReflowAction = {
  type: "ACCEPT_REFLOW_PREVIEW";
  previewId: string;
  preset: CanvasPreset;
  projectId: string;
  projectName: string;
  canvasData: string;
};
