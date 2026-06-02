export type StockAssetMediaType = "image" | "video";
export type StockAssetOrientation = "square" | "portrait" | "landscape";

export type StockAssetRecord = {
  id: string;
  mediaType: StockAssetMediaType;
  url: string;
  thumbUrl?: string;
  alt: string;
  category: string;
  tags: string[];
  orientation: StockAssetOrientation;
  colorHints: string[];
  source: string;
  sourceUrl?: string;
  license: string;
  licenseUrl: string;
  attribution?: string;
  attributionRequired: boolean;
  commercialUse: boolean;
  createdAt: string;
};

export type StockAssetFilters = {
  query?: string;
  category?: string;
  mediaType?: string;
  orientation?: string;
  color?: string;
  license?: string;
  recent?: boolean;
};

type GeneratedAssetCategory = {
  id: string;
  label: string;
  tags: string[];
  colorHints: string[];
  orientation: StockAssetOrientation;
  palette: string[];
};

type GeneratedAssetDescriptor = {
  id: string;
  alt: string;
  category: string;
  tags: string[];
  colorHints: string[];
  orientation: StockAssetOrientation;
  createdAt: string;
};

const CUSTOM_ASSET_SOURCE = "ManuScript Generated";
const CUSTOM_ASSET_LICENSE = "MIT";
const CUSTOM_ASSET_LICENSE_URL =
  "https://github.com/travis26836-dot/ms-studio-build";
const GENERATED_ASSETS_PER_CATEGORY = 25;
const GENERATED_ASSET_BASE_DATE = Date.UTC(2026, 4, 18, 0, 0, 0);
const THUMB_SIZE = 320;
const FULL_SIZE = 1200;

const GENERATED_CATEGORIES: GeneratedAssetCategory[] = [
  {
    id: "abstract-blobs",
    label: "Abstract Blobs",
    tags: ["blob", "organic", "accent", "abstract"],
    colorHints: ["purple", "pink", "blue"],
    orientation: "square",
    palette: ["#7c3aed", "#ec4899", "#22d3ee", "#fde047"],
  },
  {
    id: "arrows",
    label: "Arrows",
    tags: ["arrow", "direction", "pointer", "flow"],
    colorHints: ["blue", "green", "orange"],
    orientation: "landscape",
    palette: ["#2563eb", "#14b8a6", "#f97316", "#111827"],
  },
  {
    id: "badges",
    label: "Badges",
    tags: ["badge", "award", "seal", "promotion"],
    colorHints: ["gold", "red", "navy"],
    orientation: "square",
    palette: ["#f59e0b", "#ef4444", "#1d4ed8", "#f8fafc"],
  },
  {
    id: "banners",
    label: "Banners",
    tags: ["banner", "headline", "sale", "promo"],
    colorHints: ["red", "yellow", "black"],
    orientation: "landscape",
    palette: ["#ef4444", "#facc15", "#0f172a", "#ffffff"],
  },
  {
    id: "borders",
    label: "Borders",
    tags: ["border", "frame", "outline", "decorative"],
    colorHints: ["neutral", "blue", "rose"],
    orientation: "portrait",
    palette: ["#e2e8f0", "#38bdf8", "#fb7185", "#0f172a"],
  },
  {
    id: "brush-strokes",
    label: "Brush Strokes",
    tags: ["brush", "paint", "texture", "highlight"],
    colorHints: ["orange", "pink", "teal"],
    orientation: "landscape",
    palette: ["#fb7185", "#f97316", "#14b8a6", "#f8fafc"],
  },
  {
    id: "charts",
    label: "Charts",
    tags: ["chart", "data", "analytics", "graph"],
    colorHints: ["blue", "green", "purple"],
    orientation: "square",
    palette: ["#2563eb", "#10b981", "#8b5cf6", "#e5e7eb"],
  },
  {
    id: "checklists",
    label: "Checklists",
    tags: ["checklist", "task", "list", "todo"],
    colorHints: ["green", "white", "slate"],
    orientation: "portrait",
    palette: ["#10b981", "#ffffff", "#334155", "#cbd5e1"],
  },
  {
    id: "dividers",
    label: "Dividers",
    tags: ["divider", "separator", "line", "section"],
    colorHints: ["neutral", "gold", "blue"],
    orientation: "landscape",
    palette: ["#cbd5e1", "#f59e0b", "#60a5fa", "#1f2937"],
  },
  {
    id: "frames",
    label: "Frames",
    tags: ["frame", "photo", "mask", "placeholder"],
    colorHints: ["stone", "violet", "sky"],
    orientation: "portrait",
    palette: ["#e7e5e4", "#8b5cf6", "#0ea5e9", "#111827"],
  },
  {
    id: "gradients",
    label: "Gradients",
    tags: ["gradient", "background", "mesh", "blend"],
    colorHints: ["cyan", "violet", "rose"],
    orientation: "landscape",
    palette: ["#22d3ee", "#8b5cf6", "#f43f5e", "#f8fafc"],
  },
  {
    id: "grids",
    label: "Grids",
    tags: ["grid", "layout", "wireframe", "structure"],
    colorHints: ["slate", "blue", "teal"],
    orientation: "landscape",
    palette: ["#1e293b", "#60a5fa", "#2dd4bf", "#f8fafc"],
  },
  {
    id: "icons",
    label: "Icons",
    tags: ["icon", "ui", "symbol", "interface"],
    colorHints: ["blue", "amber", "slate"],
    orientation: "square",
    palette: ["#2563eb", "#f59e0b", "#475569", "#ffffff"],
  },
  {
    id: "labels",
    label: "Labels",
    tags: ["label", "tag", "pricing", "sticker"],
    colorHints: ["green", "yellow", "navy"],
    orientation: "landscape",
    palette: ["#16a34a", "#fde047", "#1e3a8a", "#ffffff"],
  },
  {
    id: "mockup-backdrops",
    label: "Mockup Backdrops",
    tags: ["mockup", "scene", "backdrop", "product"],
    colorHints: ["neutral", "beige", "charcoal"],
    orientation: "landscape",
    palette: ["#fafaf9", "#d6d3d1", "#78716c", "#292524"],
  },
  {
    id: "patterns",
    label: "Patterns",
    tags: ["pattern", "tile", "texture", "repeat"],
    colorHints: ["indigo", "mint", "pink"],
    orientation: "square",
    palette: ["#4338ca", "#6ee7b7", "#f9a8d4", "#ffffff"],
  },
  {
    id: "ribbons",
    label: "Ribbons",
    tags: ["ribbon", "award", "label", "banner"],
    colorHints: ["red", "gold", "navy"],
    orientation: "landscape",
    palette: ["#dc2626", "#f59e0b", "#1d4ed8", "#ffffff"],
  },
  {
    id: "shapes",
    label: "Shapes",
    tags: ["shape", "geometry", "block", "element"],
    colorHints: ["orange", "blue", "pink"],
    orientation: "square",
    palette: ["#fb923c", "#3b82f6", "#f472b6", "#111827"],
  },
  {
    id: "stickers",
    label: "Stickers",
    tags: ["sticker", "fun", "emoji", "callout"],
    colorHints: ["yellow", "pink", "sky"],
    orientation: "square",
    palette: ["#fde047", "#f472b6", "#38bdf8", "#111827"],
  },
  {
    id: "text-highlights",
    label: "Text Highlights",
    tags: ["text", "highlight", "marker", "emphasis"],
    colorHints: ["yellow", "lime", "cyan"],
    orientation: "landscape",
    palette: ["#fef08a", "#bef264", "#67e8f9", "#0f172a"],
  },
];

const LEGACY_STOCK_ASSETS: StockAssetRecord[] = [
  {
    id: "unsplash-mountain-landscape",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
    thumbUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
    alt: "Mountain landscape",
    category: "nature",
    tags: ["nature", "mountains", "travel", "landscape"],
    orientation: "landscape",
    colorHints: ["blue", "green", "neutral"],
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/21bda4d32df4",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    attribution: "Unsplash photographer",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "unsplash-modern-office",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600",
    thumbUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500",
    alt: "Modern office workspace",
    category: "business",
    tags: ["business", "office", "startup", "workspace"],
    orientation: "landscape",
    colorHints: ["white", "gray", "blue"],
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/37526070297c",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    attribution: "Unsplash photographer",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "unsplash-coding-laptop",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600",
    thumbUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    alt: "Coding laptop on desk",
    category: "technology",
    tags: ["technology", "coding", "laptop", "developer"],
    orientation: "landscape",
    colorHints: ["black", "silver", "blue"],
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/c5249f4df085",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    attribution: "Unsplash photographer",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "unsplash-food-plating",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600",
    thumbUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
    alt: "Food plating",
    category: "food",
    tags: ["food", "restaurant", "menu", "dining"],
    orientation: "landscape",
    colorHints: ["orange", "white", "green"],
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/0877df9cc836",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    attribution: "Unsplash photographer",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "unsplash-abstract-gradient",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600",
    thumbUrl:
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=500",
    alt: "Abstract gradient",
    category: "abstract",
    tags: ["abstract", "gradient", "background", "color"],
    orientation: "landscape",
    colorHints: ["purple", "blue", "pink"],
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/973673baf926",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    attribution: "Unsplash photographer",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "pexels-business-meeting-video",
    mediaType: "video",
    url: "https://www.pexels.com/search/videos/business%20meeting/",
    thumbUrl:
      "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=500",
    alt: "Business meeting stock video search",
    category: "business",
    tags: ["business", "team", "meeting", "office", "video"],
    orientation: "landscape",
    colorHints: ["gray", "blue", "white"],
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/search/videos/business%20meeting/",
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    attribution: "Pexels creator",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "pexels-product-background-video",
    mediaType: "video",
    url: "https://www.pexels.com/search/videos/product%20background/",
    thumbUrl:
      "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=500",
    alt: "Product background stock video search",
    category: "product",
    tags: ["product", "background", "commercial", "video"],
    orientation: "landscape",
    colorHints: ["neutral", "white", "warm"],
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/search/videos/product%20background/",
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    attribution: "Pexels creator",
    attributionRequired: false,
    commercialUse: true,
    createdAt: "2026-05-17T00:00:00.000Z",
  },
];

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function createSlug(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function createGeneratedAssetId(categoryId: string, index: number) {
  return `manuscript-${categoryId}-${String(index + 1).padStart(3, "0")}`;
}

function createGeneratedAssetDate(index: number) {
  return new Date(GENERATED_ASSET_BASE_DATE + index * 60_000).toISOString();
}

function createGeneratedAssetUrl(
  assetId: string,
  baseUrl?: string,
  variant: "full" | "thumb" = "full"
) {
  const path = `/api/generated-stock-assets/${encodeURIComponent(assetId)}.svg?variant=${variant}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function deterministicValue(seed: string, salt: number) {
  let total = 0;
  const input = `${seed}:${salt}`;
  for (let index = 0; index < input.length; index += 1) {
    total = (total * 31 + input.charCodeAt(index) + salt) % 2147483647;
  }
  return total / 2147483647;
}

function deterministicInt(seed: string, salt: number, min: number, max: number) {
  return Math.floor(deterministicValue(seed, salt) * (max - min + 1)) + min;
}

function pickColor(seed: string, palette: string[], offset: number) {
  return palette[deterministicInt(seed, offset, 0, palette.length - 1)];
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createGeneratedAssetDescriptor(
  category: GeneratedAssetCategory,
  index: number
): GeneratedAssetDescriptor {
  const number = index + 1;
  return {
    id: createGeneratedAssetId(category.id, index),
    alt: `${category.label} ${number}`,
    category: category.id,
    tags: [...category.tags, category.id, createSlug(category.label), `set-${Math.ceil(number / 5)}`],
    colorHints: category.colorHints,
    orientation: category.orientation,
    createdAt: createGeneratedAssetDate(
      GENERATED_CATEGORIES.findIndex(item => item.id === category.id) *
        GENERATED_ASSETS_PER_CATEGORY +
        index
    ),
  };
}

const GENERATED_ASSET_DESCRIPTORS = GENERATED_CATEGORIES.flatMap(category =>
  Array.from({ length: GENERATED_ASSETS_PER_CATEGORY }, (_, index) =>
    createGeneratedAssetDescriptor(category, index)
  )
);

const GENERATED_ASSET_LOOKUP = new Map(
  GENERATED_ASSET_DESCRIPTORS.map(asset => [asset.id, asset])
);

function createGeneratedAssetRecord(
  descriptor: GeneratedAssetDescriptor,
  baseUrl?: string
): StockAssetRecord {
  return {
    id: descriptor.id,
    mediaType: "image",
    url: createGeneratedAssetUrl(descriptor.id, baseUrl, "full"),
    thumbUrl: createGeneratedAssetUrl(descriptor.id, baseUrl, "thumb"),
    alt: descriptor.alt,
    category: descriptor.category,
    tags: descriptor.tags,
    orientation: descriptor.orientation,
    colorHints: descriptor.colorHints,
    source: CUSTOM_ASSET_SOURCE,
    license: CUSTOM_ASSET_LICENSE,
    licenseUrl: CUSTOM_ASSET_LICENSE_URL,
    attributionRequired: false,
    commercialUse: true,
    createdAt: descriptor.createdAt,
  };
}

function renderAbstractBlobs(seed: string, palette: string[], width: number, height: number) {
  return Array.from({ length: 3 }, (_, index) => {
    const x = deterministicInt(seed, index + 10, 90, width - 240);
    const y = deterministicInt(seed, index + 20, 90, height - 240);
    const rx = deterministicInt(seed, index + 30, 120, 260);
    const ry = deterministicInt(seed, index + 40, 70, 190);
    const rotate = deterministicInt(seed, index + 50, -35, 35);
    return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${pickColor(seed, palette, index + 60)}" fill-opacity="0.78" transform="rotate(${rotate} ${x} ${y})" />`;
  }).join("");
}

function renderArrows(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  const startX = deterministicInt(seed, 3, 110, 230);
  const endX = width - deterministicInt(seed, 4, 120, 220);
  const y = height / 2;
  const midY = y - deterministicInt(seed, 5, 40, 90);
  return `
    <path d="M${startX} ${y} C ${width * 0.35} ${midY}, ${width * 0.65} ${y + 80}, ${endX} ${y}" stroke="${main}" stroke-width="40" stroke-linecap="round" fill="none" />
    <path d="M${endX - 120} ${y - 110} L${endX} ${y} L${endX - 120} ${y + 110}" fill="none" stroke="${accent}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
  `;
}

function renderBadges(seed: string, palette: string[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2 - 30;
  const outer = pickColor(seed, palette, 1);
  const inner = pickColor(seed, palette, 2);
  return `
    <polygon points="${cx},${cy - 220} ${cx + 180},${cy - 80} ${cx + 150},${cy + 150} ${cx},${cy + 240} ${cx - 150},${cy + 150} ${cx - 180},${cy - 80}" fill="${outer}" />
    <circle cx="${cx}" cy="${cy}" r="120" fill="${inner}" />
    <text x="${cx}" y="${cy + 20}" font-size="88" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">+</text>
  `;
}

function renderBanners(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <path d="M120 210 H${width - 120} L${width - 220} ${height - 190} H220 Z" fill="${main}" />
    <path d="M220 ${height - 190} L130 ${height - 80} L145 ${height - 220} Z" fill="${accent}" />
    <path d="M${width - 220} ${height - 190} L${width - 130} ${height - 80} L${width - 145} ${height - 220} Z" fill="${accent}" />
  `;
}

function renderBorders(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <rect x="100" y="80" width="${width - 200}" height="${height - 160}" rx="32" fill="none" stroke="${main}" stroke-width="26" />
    <rect x="150" y="130" width="${width - 300}" height="${height - 260}" rx="24" fill="none" stroke="${accent}" stroke-width="10" stroke-dasharray="24 18" />
    <circle cx="150" cy="130" r="24" fill="${accent}" />
    <circle cx="${width - 150}" cy="130" r="24" fill="${accent}" />
    <circle cx="150" cy="${height - 130}" r="24" fill="${accent}" />
    <circle cx="${width - 150}" cy="${height - 130}" r="24" fill="${accent}" />
  `;
}

function renderBrushStrokes(seed: string, palette: string[], width: number, height: number) {
  return Array.from({ length: 3 }, (_, index) => {
    const y = 160 + index * 150;
    const amplitude = deterministicInt(seed, index + 1, 25, 60);
    const color = pickColor(seed, palette, index + 10);
    return `<path d="M120 ${y} C 260 ${y - amplitude}, 420 ${y + amplitude}, 560 ${y} S 860 ${y - amplitude}, ${width - 120} ${y}" stroke="${color}" stroke-width="${50 - index * 8}" stroke-linecap="round" fill="none" opacity="0.9" />`;
  }).join("");
}

function renderCharts(seed: string, palette: string[], width: number, height: number) {
  const barWidth = 120;
  const gap = 55;
  const baseY = height - 120;
  return Array.from({ length: 4 }, (_, index) => {
    const barHeight = deterministicInt(seed, index + 1, 170, 420);
    const x = 170 + index * (barWidth + gap);
    return `<rect x="${x}" y="${baseY - barHeight}" width="${barWidth}" height="${barHeight}" rx="18" fill="${pickColor(seed, palette, index + 10)}" />`;
  }).join("");
}

function renderChecklists(seed: string, palette: string[], width: number, height: number) {
  return Array.from({ length: 4 }, (_, index) => {
    const y = 180 + index * 140;
    const boxColor = pickColor(seed, palette, index + 1);
    const lineColor = pickColor(seed, palette, index + 11);
    const lineWidth = deterministicInt(seed, index + 21, 420, width - 360);
    return `
      <rect x="120" y="${y - 34}" width="68" height="68" rx="14" fill="none" stroke="${boxColor}" stroke-width="14" />
      <path d="M138 ${y} L156 ${y + 18} L186 ${y - 14}" stroke="${boxColor}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <rect x="240" y="${y - 18}" width="${lineWidth}" height="22" rx="11" fill="${lineColor}" opacity="0.9" />
    `;
  }).join("");
}

function renderDividers(seed: string, palette: string[], width: number, height: number) {
  const midY = height / 2;
  const lineColor = pickColor(seed, palette, 1);
  const centerColor = pickColor(seed, palette, 2);
  return `
    <path d="M100 ${midY} H${width - 100}" stroke="${lineColor}" stroke-width="20" stroke-linecap="round" />
    <circle cx="${width / 2}" cy="${midY}" r="56" fill="${centerColor}" />
    <path d="M${width / 2 - 22} ${midY} L${width / 2} ${midY - 22} L${width / 2 + 22} ${midY} L${width / 2} ${midY + 22} Z" fill="#ffffff" />
  `;
}

function renderFrames(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <rect x="120" y="90" width="${width - 240}" height="${height - 180}" rx="40" fill="none" stroke="${main}" stroke-width="34" />
    <rect x="180" y="150" width="${width - 360}" height="${height - 300}" rx="24" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="8" stroke-dasharray="20 20" />
    <circle cx="${width / 2}" cy="${height / 2 - 30}" r="82" fill="${accent}" fill-opacity="0.18" />
    <path d="M280 ${height - 280} L480 ${height - 420} L680 ${height - 240} L920 ${height - 450} L${width - 180} ${height - 210}" fill="none" stroke="${main}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
  `;
}

function renderGradients(seed: string, palette: string[], width: number, height: number) {
  return `
    <defs>
      <linearGradient id="grad-${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${pickColor(seed, palette, 1)}" />
        <stop offset="50%" stop-color="${pickColor(seed, palette, 2)}" />
        <stop offset="100%" stop-color="${pickColor(seed, palette, 3)}" />
      </linearGradient>
      <radialGradient id="glow-${seed}" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="48" fill="url(#grad-${seed})" />
    <circle cx="${width * 0.68}" cy="${height * 0.34}" r="${Math.min(width, height) * 0.26}" fill="url(#glow-${seed})" />
  `;
}

function renderGrids(seed: string, palette: string[], width: number, height: number) {
  const cols = 4;
  const rows = 3;
  const gap = 28;
  const cellWidth = (width - 240 - gap * (cols - 1)) / cols;
  const cellHeight = (height - 220 - gap * (rows - 1)) / rows;
  return Array.from({ length: cols * rows }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = 120 + col * (cellWidth + gap);
    const y = 110 + row * (cellHeight + gap);
    return `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="18" fill="${pickColor(seed, palette, index + 1)}" fill-opacity="${0.18 + (index % 3) * 0.12}" stroke="${pickColor(seed, palette, index + 11)}" stroke-width="8" />`;
  }).join("");
}

function renderIcons(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <circle cx="${width / 2}" cy="${height / 2}" r="220" fill="${main}" fill-opacity="0.14" />
    <rect x="${width / 2 - 160}" y="${height / 2 - 160}" width="320" height="320" rx="80" fill="${main}" />
    <path d="M${width / 2 - 90} ${height / 2} H${width / 2 + 90}" stroke="#ffffff" stroke-width="34" stroke-linecap="round" />
    <path d="M${width / 2} ${height / 2 - 90} V${height / 2 + 90}" stroke="${accent}" stroke-width="34" stroke-linecap="round" />
  `;
}

function renderLabels(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <path d="M130 190 H${width - 270} L${width - 140} ${height / 2} L${width - 270} ${height - 190} H130 Z" fill="${main}" />
    <circle cx="210" cy="${height / 2}" r="34" fill="${accent}" />
    <rect x="290" y="${height / 2 - 34}" width="${width - 520}" height="68" rx="34" fill="#ffffff" fill-opacity="0.82" />
  `;
}

function renderMockupBackdrops(seed: string, palette: string[], width: number, height: number) {
  const base = pickColor(seed, palette, 1);
  const shadow = pickColor(seed, palette, 2);
  const accent = pickColor(seed, palette, 3);
  return `
    <rect x="0" y="0" width="${width}" height="${height}" fill="${base}" />
    <ellipse cx="${width / 2}" cy="${height - 120}" rx="${width * 0.34}" ry="90" fill="${shadow}" fill-opacity="0.32" />
    <rect x="${width * 0.24}" y="${height * 0.22}" width="${width * 0.52}" height="${height * 0.44}" rx="26" fill="#ffffff" />
    <rect x="${width * 0.3}" y="${height * 0.3}" width="${width * 0.4}" height="${height * 0.28}" rx="18" fill="${accent}" fill-opacity="0.16" />
  `;
}

function renderPatterns(seed: string, palette: string[], width: number, height: number) {
  const circles: string[] = [];
  for (let y = 110; y < height - 60; y += 140) {
    for (let x = 110; x < width - 60; x += 140) {
      circles.push(
        `<circle cx="${x}" cy="${y}" r="${deterministicInt(seed, x + y, 18, 42)}" fill="${pickColor(seed, palette, x + y)}" fill-opacity="0.82" />`
      );
    }
  }
  return circles.join("");
}

function renderRibbons(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <path d="M150 220 H${width - 150} L${width - 250} ${height / 2} L${width - 150} ${height - 220} H150 L250 ${height / 2} Z" fill="${main}" />
    <path d="M250 ${height / 2} L150 ${height - 140} V${height - 60} L300 ${height - 180} Z" fill="${accent}" />
    <path d="M${width - 250} ${height / 2} L${width - 150} ${height - 140} V${height - 60} L${width - 300} ${height - 180} Z" fill="${accent}" />
  `;
}

function renderShapes(seed: string, palette: string[], width: number, height: number) {
  return `
    <rect x="160" y="160" width="240" height="240" rx="48" fill="${pickColor(seed, palette, 1)}" />
    <circle cx="${width - 280}" cy="300" r="130" fill="${pickColor(seed, palette, 2)}" />
    <polygon points="${width / 2},${height - 170} ${width / 2 - 170},${height - 420} ${width / 2 + 170},${height - 420}" fill="${pickColor(seed, palette, 3)}" />
  `;
}

function renderStickers(seed: string, palette: string[], width: number, height: number) {
  const main = pickColor(seed, palette, 1);
  const accent = pickColor(seed, palette, 2);
  return `
    <path d="M${width / 2} 130 C ${width - 120} 130, ${width - 90} ${height - 140}, ${width / 2} ${height - 120} C 150 ${height - 140}, 120 150, ${width / 2} 130 Z" fill="${main}" />
    <path d="M${width / 2} 180 C ${width - 180} 180, ${width - 160} ${height - 210}, ${width / 2} ${height - 190} C 210 ${height - 210}, 190 200, ${width / 2} 180 Z" fill="#ffffff" fill-opacity="0.9" />
    <circle cx="${width / 2 - 100}" cy="${height / 2 - 20}" r="20" fill="${accent}" />
    <circle cx="${width / 2 + 100}" cy="${height / 2 - 20}" r="20" fill="${accent}" />
    <path d="M${width / 2 - 110} ${height / 2 + 80} Q${width / 2} ${height / 2 + 180} ${width / 2 + 110} ${height / 2 + 80}" stroke="${accent}" stroke-width="18" fill="none" stroke-linecap="round" />
  `;
}

function renderTextHighlights(seed: string, palette: string[], width: number, height: number) {
  return Array.from({ length: 3 }, (_, index) => {
    const y = 180 + index * 150;
    const color = pickColor(seed, palette, index + 1);
    const left = deterministicInt(seed, index + 10, 120, 200);
    const rectWidth = deterministicInt(seed, index + 20, width - 420, width - 250);
    return `<rect x="${left}" y="${y}" width="${rectWidth}" height="74" rx="24" fill="${color}" fill-opacity="0.88" />`;
  }).join("");
}

function renderGeneratedAssetShape(category: string, seed: string, palette: string[], width: number, height: number) {
  switch (category) {
    case "abstract-blobs":
      return renderAbstractBlobs(seed, palette, width, height);
    case "arrows":
      return renderArrows(seed, palette, width, height);
    case "badges":
      return renderBadges(seed, palette, width, height);
    case "banners":
      return renderBanners(seed, palette, width, height);
    case "borders":
      return renderBorders(seed, palette, width, height);
    case "brush-strokes":
      return renderBrushStrokes(seed, palette, width, height);
    case "charts":
      return renderCharts(seed, palette, width, height);
    case "checklists":
      return renderChecklists(seed, palette, width, height);
    case "dividers":
      return renderDividers(seed, palette, width, height);
    case "frames":
      return renderFrames(seed, palette, width, height);
    case "gradients":
      return renderGradients(seed, palette, width, height);
    case "grids":
      return renderGrids(seed, palette, width, height);
    case "icons":
      return renderIcons(seed, palette, width, height);
    case "labels":
      return renderLabels(seed, palette, width, height);
    case "mockup-backdrops":
      return renderMockupBackdrops(seed, palette, width, height);
    case "patterns":
      return renderPatterns(seed, palette, width, height);
    case "ribbons":
      return renderRibbons(seed, palette, width, height);
    case "shapes":
      return renderShapes(seed, palette, width, height);
    case "stickers":
      return renderStickers(seed, palette, width, height);
    case "text-highlights":
      return renderTextHighlights(seed, palette, width, height);
    default:
      return renderAbstractBlobs(seed, palette, width, height);
  }
}

export function renderGeneratedStockAssetSvg(
  assetId: string,
  variant: "full" | "thumb" = "full"
) {
  const descriptor = GENERATED_ASSET_LOOKUP.get(assetId);
  if (!descriptor) {
    return null;
  }

  const category =
    GENERATED_CATEGORIES.find(item => item.id === descriptor.category) ??
    GENERATED_CATEGORIES[0];
  const width =
    descriptor.orientation === "portrait"
      ? variant === "thumb"
        ? 420
        : 900
      : descriptor.orientation === "landscape"
        ? variant === "thumb"
          ? THUMB_SIZE
          : FULL_SIZE
        : variant === "thumb"
          ? THUMB_SIZE
          : 960;
  const height =
    descriptor.orientation === "portrait"
      ? variant === "thumb"
        ? THUMB_SIZE
        : FULL_SIZE
      : descriptor.orientation === "landscape"
        ? variant === "thumb"
          ? 220
          : 720
        : variant === "thumb"
          ? THUMB_SIZE
          : 960;

  const background =
    descriptor.category === "mockup-backdrops" || descriptor.category === "gradients"
      ? "transparent"
      : "#ffffff";
  const seed = `${assetId}:${variant}`;
  const body = renderGeneratedAssetShape(
    descriptor.category,
    seed,
    category.palette,
    width,
    height
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <title>${escapeXml(descriptor.alt)}</title>
  <rect x="0" y="0" width="${width}" height="${height}" rx="48" fill="${background}" />
  ${body}
</svg>`;
}

export function getGeneratedStockAssetSeedData() {
  return GENERATED_ASSET_DESCRIPTORS.map(descriptor =>
    createGeneratedAssetRecord(descriptor)
  );
}

function matchesSearch(asset: StockAssetRecord, query: string) {
  if (!query) return true;

  const haystack = [
    asset.alt,
    asset.category,
    asset.source,
    asset.license,
    asset.orientation,
    ...asset.tags,
    ...asset.colorHints,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function filterStockAssets(
  assets: StockAssetRecord[],
  filters: StockAssetFilters = {}
) {
  const query = normalize(filters.query);
  const category = normalize(filters.category);
  const mediaType = normalize(filters.mediaType);
  const orientation = normalize(filters.orientation);
  const color = normalize(filters.color);
  const license = normalize(filters.license);

  const filtered = assets.filter(asset => {
    if (mediaType && asset.mediaType !== mediaType) return false;
    if (category && asset.category !== category) return false;
    if (orientation && asset.orientation !== orientation) return false;
    if (
      color &&
      !asset.colorHints.some(hint => hint.toLowerCase().includes(color))
    ) {
      return false;
    }
    if (license && !asset.license.toLowerCase().includes(license)) {
      return false;
    }

    return matchesSearch(asset, query);
  });

  return filters.recent
    ? [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : filtered;
}

export function getFallbackStockAssets(baseUrl?: string) {
  return [
    ...GENERATED_ASSET_DESCRIPTORS.map(descriptor =>
      createGeneratedAssetRecord(descriptor, baseUrl)
    ),
    ...LEGACY_STOCK_ASSETS,
  ];
}

export function mapDbStockAsset(
  asset: {
    id: string;
    mediaType: string;
    url: string;
    thumbUrl: string | null;
    alt: string | null;
    category: string;
    tags: string[];
    orientation: string;
    colorHints: string[];
    source: string;
    sourceUrl: string | null;
    license: string;
    licenseUrl: string;
    attribution: string | null;
    attributionRequired: boolean;
    commercialUse: boolean;
    createdAt: Date;
  },
  baseUrl?: string
): StockAssetRecord {
  const toAbsoluteUrl = (value?: string | null) => {
    if (!value) return undefined;
    if (/^https?:\/\//.test(value)) return value;
    return baseUrl ? `${baseUrl}${value}` : value;
  };

  const resolvedUrl = toAbsoluteUrl(asset.url) ?? asset.url;
  return {
    id: asset.id,
    mediaType: asset.mediaType === "video" ? "video" : "image",
    url: resolvedUrl,
    thumbUrl: toAbsoluteUrl(asset.thumbUrl) ?? resolvedUrl,
    alt: asset.alt ?? asset.id,
    category: asset.category,
    tags: asset.tags,
    orientation:
      asset.orientation === "portrait"
        ? "portrait"
        : asset.orientation === "landscape"
          ? "landscape"
          : "square",
    colorHints: asset.colorHints,
    source: asset.source,
    sourceUrl: asset.sourceUrl ?? undefined,
    license: asset.license,
    licenseUrl: asset.licenseUrl,
    attribution: asset.attribution ?? undefined,
    attributionRequired: asset.attributionRequired,
    commercialUse: asset.commercialUse,
    createdAt: asset.createdAt.toISOString(),
  };
}

export function getCustomAssetSource() {
  return CUSTOM_ASSET_SOURCE;
}
