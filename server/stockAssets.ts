export type StockAssetMediaType = "image" | "video";

export type StockAssetRecord = {
  id: string;
  mediaType: StockAssetMediaType;
  url: string;
  thumbUrl?: string;
  alt: string;
  category: string;
  tags: string[];
  orientation: "square" | "portrait" | "landscape";
  colorHints: string[];
  source: "Unsplash" | "Pexels";
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  attribution?: string;
  attributionRequired: boolean;
  commercialUse: boolean;
  createdAt: string;
};

const STOCK_ASSETS: StockAssetRecord[] = [
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

type StockAssetFilters = {
  query?: string;
  category?: string;
  mediaType?: string;
  orientation?: string;
  color?: string;
  license?: string;
  recent?: boolean;
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
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

export function listStockAssets(filters: StockAssetFilters = {}) {
  const query = normalize(filters.query);
  const category = normalize(filters.category);
  const mediaType = normalize(filters.mediaType);
  const orientation = normalize(filters.orientation);
  const color = normalize(filters.color);
  const license = normalize(filters.license);

  const assets = STOCK_ASSETS.filter(asset => {
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
    ? [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : assets;
}
