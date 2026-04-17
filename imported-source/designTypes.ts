/** Canvas element types */
export type ElementType = "text" | "image" | "shape" | "icon" | "group";

export interface CanvasElement {
  id: string;
  type: ElementType;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  name: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  underline?: boolean;
  linethrough?: boolean;
  charSpacing?: number;
  lineHeight?: number;
  src?: string;
  shapeType?: string;
  rx?: number;
  ry?: number;
  filters?: ImageFilter[];
}

export interface ImageFilter {
  type: string;
  value: number;
}

export interface CanvasState {
  version: string;
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

export const TEMPLATE_CATEGORIES = [
  "social-media",
  "flyer",
  "document",
  "presentation",
  "promotional",
  "poster",
  "business-card",
  "invitation",
  "resume",
  "infographic",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const CANVAS_PRESETS: Record<string, { width: number; height: number; label: string }> = {
  "instagram-post": { width: 1080, height: 1080, label: "Instagram Post" },
  "instagram-story": { width: 1080, height: 1920, label: "Instagram Story" },
  "facebook-post": { width: 1200, height: 630, label: "Facebook Post" },
  "twitter-post": { width: 1200, height: 675, label: "Twitter/X Post" },
  "youtube-thumbnail": { width: 1280, height: 720, label: "YouTube Thumbnail" },
  "linkedin-post": { width: 1200, height: 627, label: "LinkedIn Post" },
  "flyer-letter": { width: 2550, height: 3300, label: "Flyer (Letter)" },
  "flyer-a4": { width: 2480, height: 3508, label: "Flyer (A4)" },
  "poster-18x24": { width: 5400, height: 7200, label: "Poster (18x24)" },
  "business-card": { width: 1050, height: 600, label: "Business Card" },
  "presentation-16-9": { width: 1920, height: 1080, label: "Presentation (16:9)" },
  "document-letter": { width: 2550, height: 3300, label: "Document (Letter)" },
  "custom": { width: 1080, height: 1080, label: "Custom Size" },
};

export type CanvasPreset = keyof typeof CANVAS_PRESETS;

export const ASSET_TYPES = ["photo", "icon", "shape", "element", "background", "pattern"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const EXPORT_FORMATS = ["png", "jpg", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandFont {
  name: string;
  family: string;
  variants: string[];
}

export interface BrandLogo {
  name: string;
  url: string;
  type: "primary" | "secondary" | "icon";
}
