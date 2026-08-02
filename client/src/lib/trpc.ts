import { useCallback, useEffect, useMemo, useState } from "react";
import { useSafeClerkAuth, useSafeClerkUser } from "@/lib/safeClerk";
import * as aiClient from "./aiClient";

type QueryOptions = {
  enabled?: boolean;
};

type ProjectRecord = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasData: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type UserSettingsRecord = {
  brandKit: unknown | null;
  updatedAt: string | null;
};

type TemplateRecord = {
  id: number;
  name: string;
  description?: string;
  category: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasData: string;
  thumbnailUrl?: string;
  tags?: string[];
};

type PhotoRecord = {
  url: string;
  thumb: string;
  alt: string;
  tags: string[];
  mediaType?: "image" | "video";
  category?: string;
  orientation?: string;
  colorHints?: string[];
  source?: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
  attribution?: string;
  attributionRequired?: boolean;
  commercialUse?: boolean;
};

type StockAssetRecord = {
  id: string;
  mediaType: "image" | "video";
  url: string;
  thumbUrl?: string;
  alt: string;
  category: string;
  tags: string[];
  orientation: string;
  colorHints: string[];
  source: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  attribution?: string;
  attributionRequired: boolean;
  commercialUse: boolean;
};

type StockAssetSearchInput = {
  query?: string;
  mediaType?: "image" | "video";
  category?: string;
  orientation?: string;
  color?: string;
  license?: string;
  recent?: boolean;
};

export type UnsplashPhoto = {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  source: "Unsplash";
  sourceUrl: string;
  downloadLocation: string;
  photographer: string;
  photographerUsername: string;
  photographerUrl: string;
  unsplashUrl: string;
  license: string;
  licenseUrl: string;
  attributionRequired: boolean;
  commercialUse: boolean;
  orientation: "landscape" | "portrait" | "square";
};

type UnsplashSearchInput = {
  query: string;
  page?: number;
  orientation?: string;
  color?: string;
};

type UnsplashSearchResult = {
  photos: UnsplashPhoto[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
};

type LayoutSuggestion = {
  elements: Array<{
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
  description: string;
};

const TEMPLATES_KEY = "veronica-ai.templates.v1";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:3010" : "");
const DEV_API_FAILOVER_URL =
  import.meta.env.VITE_API_FAILOVER_URL ||
  (import.meta.env.DEV
    ? "https://veronica-ai-studio-production.up.railway.app"
    : "");

let activeApiBaseUrl = API_BASE_URL;

function resolveApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${activeApiBaseUrl}${path}`;
}

function shouldTryDevFailover(path: string) {
  return (
    import.meta.env.DEV &&
    !!DEV_API_FAILOVER_URL &&
    !/^https?:\/\//.test(path) &&
    activeApiBaseUrl !== DEV_API_FAILOVER_URL
  );
}

function useLocalQuery<T>(
  fetcher: () => Promise<T> | T,
  deps: unknown[],
  options?: QueryOptions
) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);

  const load = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    try {
      const result = await Promise.resolve(fetcher());
      setData(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    refetch: load,
  };
}

function useLocalMutation<TInput, TOutput>(
  mutator: (input: TInput) => Promise<TOutput> | TOutput
) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (input: TInput) => {
      setIsPending(true);
      try {
        return await Promise.resolve(mutator(input));
      } finally {
        setIsPending(false);
      }
    },
    [mutator]
  );

  return {
    mutateAsync,
    isPending,
  };
}

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      writeStore(key, fallback);
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage`, error);
    return fallback;
  }
}

function writeStore<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  return value;
}

function nextId(items: Array<{ id: number }>) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createTemplateCanvas(config: {
  heading: string;
  subheading: string;
  background: string;
  accent: string;
  width: number;
  height: number;
}) {
  const titleWidth = Math.min(config.width - 160, 720);

  return JSON.stringify({
    version: "5.3.0",
    background: config.background,
    objects: [
      {
        type: "rect",
        version: "5.3.0",
        left: 40,
        top: 40,
        width: config.width - 80,
        height: config.height - 80,
        fill: config.background,
        rx: 28,
        ry: 28,
      },
      {
        type: "rect",
        version: "5.3.0",
        left: 40,
        top: 40,
        width: config.width - 80,
        height: 28,
        fill: config.accent,
      },
      {
        type: "textbox",
        version: "5.3.0",
        left: 88,
        top: 110,
        width: titleWidth,
        fill: "#111827",
        fontSize: Math.max(34, Math.round(config.width / 18)),
        fontWeight: "700",
        fontFamily: "Montserrat",
        text: config.heading,
      },
      {
        type: "textbox",
        version: "5.3.0",
        left: 92,
        top: Math.min(config.height - 220, 260),
        width: Math.min(config.width - 180, 560),
        fill: "#334155",
        fontSize: Math.max(18, Math.round(config.width / 44)),
        fontFamily: "Inter",
        text: config.subheading,
      },
      {
        type: "rect",
        version: "5.3.0",
        left: config.width - 300,
        top: Math.max(120, config.height * 0.2),
        width: 180,
        height: 180,
        fill: config.accent,
        rx: 30,
        ry: 30,
        angle: 8,
        opacity: 0.9,
      },
      {
        type: "circle",
        version: "5.3.0",
        left: config.width - 200,
        top: Math.max(280, config.height * 0.45),
        radius: 62,
        fill: "#ffffff",
        stroke: config.accent,
        strokeWidth: 14,
        opacity: 0.9,
      },
    ],
  });
}

function seedTemplates(): TemplateRecord[] {
  return [
    {
      id: 1,
      name: "Launch Promo",
      description: "Square promo layout for product drops and offers.",
      category: "social-media",
      canvasWidth: 1080,
      canvasHeight: 1080,
      canvasData: createTemplateCanvas({
        heading: "Launch Day",
        subheading:
          "Turn your next drop into a social campaign that looks polished fast.",
        background: "#fff7ed",
        accent: "#f97316",
        width: 1080,
        height: 1080,
      }),
      tags: ["promo", "launch", "social"],
    },
    {
      id: 2,
      name: "Event Invitation",
      description: "Elegant invite design for online or print.",
      category: "invitation",
      canvasWidth: 1080,
      canvasHeight: 1350,
      canvasData: createTemplateCanvas({
        heading: "You're Invited",
        subheading:
          "A clean invitation layout with room for date, venue, and RSVP details.",
        background: "#fdf2f8",
        accent: "#ec4899",
        width: 1080,
        height: 1350,
      }),
      tags: ["invite", "event", "party"],
    },
    {
      id: 3,
      name: "Certificate Classic",
      description:
        "Formal certificate composition with room for names and signatures.",
      category: "certificate",
      canvasWidth: 1600,
      canvasHeight: 1200,
      canvasData: createTemplateCanvas({
        heading: "Certificate of Achievement",
        subheading:
          "Built for recognitions, graduations, completions, and awards.",
        background: "#eff6ff",
        accent: "#2563eb",
        width: 1600,
        height: 1200,
      }),
      tags: ["certificate", "award", "formal"],
    },
    {
      id: 4,
      name: "Menu Spotlight",
      description: "Restaurant feature card with strong hierarchy.",
      category: "menu",
      canvasWidth: 1080,
      canvasHeight: 1920,
      canvasData: createTemplateCanvas({
        heading: "Chef's Special",
        subheading:
          "Highlight a hero dish, the ingredients, and your best price point.",
        background: "#fefce8",
        accent: "#eab308",
        width: 1080,
        height: 1920,
      }),
      tags: ["menu", "food", "restaurant"],
    },
    {
      id: 5,
      name: "Business Flyer",
      description: "High-contrast flyer for offers and services.",
      category: "flyer",
      canvasWidth: 2550,
      canvasHeight: 3300,
      canvasData: createTemplateCanvas({
        heading: "Grow Faster",
        subheading:
          "Use this as a flexible print layout for services, promotions, and events.",
        background: "#ecfeff",
        accent: "#06b6d4",
        width: 2550,
        height: 3300,
      }),
      tags: ["flyer", "print", "business"],
    },
    {
      id: 6,
      name: "Pitch Deck Cover",
      description: "Presentation opening slide for startups and teams.",
      category: "presentation",
      canvasWidth: 1920,
      canvasHeight: 1080,
      canvasData: createTemplateCanvas({
        heading: "Vision 2026",
        subheading:
          "A slide cover with bold contrast and breathing room for a short message.",
        background: "#f5f3ff",
        accent: "#8b5cf6",
        width: 1920,
        height: 1080,
      }),
      tags: ["presentation", "pitch", "deck"],
    },
    {
      id: 7,
      name: "Promo Poster",
      description: "Poster-sized layout with bold focal area.",
      category: "promotional",
      canvasWidth: 1800,
      canvasHeight: 2400,
      canvasData: createTemplateCanvas({
        heading: "Weekend Sale",
        subheading:
          "A promotional poster template tuned for offers, launches, and campaigns.",
        background: "#ecfdf5",
        accent: "#22c55e",
        width: 1800,
        height: 2400,
      }),
      tags: ["poster", "promo", "sale"],
    },
    {
      id: 8,
      name: "Document Cover",
      description: "Clean modern first page for reports and proposals.",
      category: "document",
      canvasWidth: 2550,
      canvasHeight: 3300,
      canvasData: createTemplateCanvas({
        heading: "Quarterly Report",
        subheading:
          "Start a polished business document with clear type hierarchy and balance.",
        background: "#f8fafc",
        accent: "#0f172a",
        width: 2550,
        height: 3300,
      }),
      tags: ["report", "proposal", "document"],
    },
  ];
}

function getTemplatesStore() {
  const existing = readStore<TemplateRecord[]>(TEMPLATES_KEY, []);
  if (existing.length > 0) {
    return existing;
  }

  return writeStore(TEMPLATES_KEY, seedTemplates());
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
  userEmail?: string | null,
  clerkUserId?: string | null
): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (typeof userEmail === "string" && userEmail.trim()) {
    headers.set("x-user-email", userEmail.trim().toLowerCase());
  }

  if (typeof clerkUserId === "string" && clerkUserId.trim()) {
    headers.set("x-user-clerk-id", clerkUserId.trim());
  }

  let response: Response;
  try {
    response = await fetch(resolveApiUrl(path), {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (error) {
    if (shouldTryDevFailover(path)) {
      activeApiBaseUrl = DEV_API_FAILOVER_URL;
      response = await fetch(resolveApiUrl(path), {
        ...init,
        headers,
        credentials: "include",
      });
    } else {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Network request failed";
      throw new Error(`Network error: ${message}`);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && shouldTryDevFailover(path)) {
      activeApiBaseUrl = DEV_API_FAILOVER_URL;
      const retry = await fetch(resolveApiUrl(path), {
        ...init,
        headers,
        credentials: "include",
      });

      if (retry.ok) {
        if (retry.status === 204) {
          return undefined as T;
        }

        return retry.json() as Promise<T>;
      }
    }

    let message = `Request failed (${response.status})`;
    try {
      const err = await response.json();
      if (err?.error && typeof err.error === "string") {
        message = err.error;
      }
    } catch {
      try {
        const raw = await response.text();
        const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 160);
        if (snippet) {
          message = `${message}: ${snippet}`;
        }
      } catch {
        // Ignore text parse failures.
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function listTemplates(input?: { category?: string }) {
  const templates = getTemplatesStore();
  if (!input?.category) {
    return templates;
  }

  return templates.filter(template => template.category === input.category);
}

function getTemplate(input: { id: number }) {
  return getTemplatesStore().find(template => template.id === input.id);
}

function fallbackPhotos(input?: StockAssetSearchInput): PhotoRecord[] {
  const query = input?.query;
  const allPhotos: PhotoRecord[] = [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
      thumb:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      alt: "Mountain landscape",
      tags: ["nature", "mountains", "travel"],
    },
    {
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
      thumb:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      alt: "Modern office",
      tags: ["business", "office", "startup"],
    },
    {
      url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200",
      thumb:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
      alt: "Coding laptop",
      tags: ["technology", "coding", "laptop"],
    },
    {
      url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
      thumb:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
      alt: "Food plating",
      tags: ["food", "restaurant", "menu"],
    },
    {
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200",
      thumb:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      alt: "Portrait woman",
      tags: ["people", "portrait", "professional"],
    },
    {
      url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200",
      thumb: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
      alt: "Gradient abstract",
      tags: ["abstract", "gradient", "background"],
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200",
      thumb:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400",
      alt: "Forest path",
      tags: ["nature", "forest", "green"],
    },
    {
      url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200",
      thumb: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400",
      alt: "Business meeting",
      tags: ["business", "team", "meeting"],
    },
  ];

  if (!query) {
    return allPhotos;
  }

  const lowered = query.toLowerCase();
  return allPhotos.filter(
    photo =>
      photo.alt.toLowerCase().includes(lowered) ||
      photo.tags.some(tag => tag.includes(lowered))
  );
}

async function getPhotos(
  input?: StockAssetSearchInput
): Promise<PhotoRecord[]> {
  const params = new URLSearchParams();
  params.set("mediaType", input?.mediaType ?? "image");
  if (input?.query?.trim()) {
    params.set("query", input.query.trim());
  }
  if (input?.category?.trim()) {
    params.set("category", input.category.trim());
  }
  if (input?.orientation?.trim()) {
    params.set("orientation", input.orientation.trim());
  }
  if (input?.color?.trim()) {
    params.set("color", input.color.trim());
  }
  if (input?.license?.trim()) {
    params.set("license", input.license.trim());
  }
  if (input?.recent) {
    params.set("recent", "true");
  }

  try {
    const assets = await apiRequest<StockAssetRecord[]>(
      `/api/stock-assets?${params.toString()}`
    );

    return assets.map(asset => ({
      url: asset.url,
      thumb: asset.thumbUrl ?? asset.url,
      alt: asset.alt,
      tags: asset.tags,
      mediaType: asset.mediaType,
      category: asset.category,
      orientation: asset.orientation,
      colorHints: asset.colorHints,
      source: asset.source,
      sourceUrl: asset.sourceUrl,
      license: asset.license,
      licenseUrl: asset.licenseUrl,
      attribution: asset.attribution,
      attributionRequired: asset.attributionRequired,
      commercialUse: asset.commercialUse,
    }));
  } catch (error) {
    console.warn("Falling back to bundled stock photos", error);
    return input?.mediaType === "video" ? [] : fallbackPhotos(input);
  }
}

async function searchUnsplash(
  input: UnsplashSearchInput
): Promise<UnsplashSearchResult> {
  const params = new URLSearchParams({ query: input.query || "nature" });
  if (input.page) params.set("page", String(input.page));
  if (input.orientation) params.set("orientation", input.orientation);
  if (input.color) params.set("color", input.color);

  const data = await apiRequest<UnsplashSearchResult>(
    `/api/unsplash/search?${params.toString()}`
  );
  return data;
}

async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>("/api/unsplash/download-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadLocation }),
    });
  } catch {
    // Non-fatal — attribution still shown, just the tracking ping failed
  }
}

function createAiImage(prompt: string, width = 1024, height = 1024) {
  const label = escapeXml(prompt.trim().slice(0, 48) || "AI Graphic");
  const backgroundA = "#0f172a";
  const backgroundB = "#2563eb";
  const accent = "#f97316";

  return createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${backgroundA}" />
          <stop offset="100%" stop-color="${backgroundB}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="32" fill="url(#bg)" />
      <circle cx="${width * 0.74}" cy="${height * 0.24}" r="${Math.min(width, height) * 0.13}" fill="${accent}" opacity="0.75" />
      <rect x="${width * 0.12}" y="${height * 0.18}" width="${width * 0.42}" height="${height * 0.42}" rx="28" fill="white" opacity="0.08" />
      <rect x="${width * 0.18}" y="${height * 0.62}" width="${width * 0.64}" height="${height * 0.12}" rx="24" fill="white" opacity="0.14" />
      <text x="${width * 0.08}" y="${height * 0.84}" fill="white" font-family="Inter, Arial, sans-serif" font-size="${Math.max(28, width / 18)}" font-weight="700">${label}</text>
      <text x="${width * 0.08}" y="${height * 0.92}" fill="white" font-family="Inter, Arial, sans-serif" font-size="${Math.max(16, width / 36)}" opacity="0.78">Generated graphic placeholder</text>
    </svg>
  `);
}

function createAiBackground(prompt: string, width: number, height: number) {
  const label = escapeXml(prompt.trim().slice(0, 60) || "AI Background");
  return createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="50%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <circle cx="${width * 0.18}" cy="${height * 0.18}" r="${Math.min(width, height) * 0.16}" fill="#ffffff" opacity="0.08" />
      <circle cx="${width * 0.82}" cy="${height * 0.28}" r="${Math.min(width, height) * 0.22}" fill="#f97316" opacity="0.18" />
      <rect x="${width * 0.08}" y="${height * 0.68}" width="${width * 0.4}" height="${height * 0.12}" rx="32" fill="#ffffff" opacity="0.08" />
      <text x="${width * 0.08}" y="${height * 0.92}" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="${Math.max(18, width / 40)}" opacity="0.75">${label}</text>
    </svg>
  `);
}

function createLayoutSuggestion(input: {
  purpose: string;
  canvasWidth: number;
  canvasHeight: number;
}): LayoutSuggestion {
  const lower = input.purpose.toLowerCase();
  const wide = input.canvasWidth > input.canvasHeight;
  const headline = lower.includes("resume")
    ? "Your Name Here"
    : lower.includes("invite")
      ? "Save the Date"
      : lower.includes("business")
        ? "Grow Your Brand"
        : "Make It Memorable";

  return {
    description:
      "A starter layout with headline, support block, and callout area.",
    elements: [
      {
        type: "shape",
        left: input.canvasWidth * 0.08,
        top: input.canvasHeight * 0.08,
        width: input.canvasWidth * (wide ? 0.42 : 0.84),
        height: input.canvasHeight * 0.18,
        fill: "#111827",
      },
      {
        type: "text",
        left: input.canvasWidth * 0.1,
        top: input.canvasHeight * 0.11,
        width: input.canvasWidth * (wide ? 0.36 : 0.72),
        height: 120,
        fill: "#ffffff",
        text: headline,
        fontSize: Math.max(30, Math.round(input.canvasWidth / 18)),
        fontFamily: "Montserrat",
      },
      {
        type: "shape",
        left: input.canvasWidth * (wide ? 0.58 : 0.1),
        top: input.canvasHeight * (wide ? 0.12 : 0.34),
        width: input.canvasWidth * (wide ? 0.28 : 0.8),
        height: input.canvasHeight * 0.26,
        fill: "#f97316",
      },
      {
        type: "shape",
        left: input.canvasWidth * 0.1,
        top: input.canvasHeight * (wide ? 0.56 : 0.68),
        width: input.canvasWidth * 0.8,
        height: input.canvasHeight * 0.16,
        fill: "#e2e8f0",
      },
    ],
  };
}

function buildChatResponse(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("color")) {
    return [
      "Try this palette:",
      "- `#0f172a` for structure",
      "- `#2563eb` for the primary accent",
      "- `#f97316` for calls to action",
      "- `#f8fafc` for breathing room",
    ].join("\n");
  }

  if (lower.includes("headline") || lower.includes("copy")) {
    return [
      "Here are three headline directions:",
      "- Bold: **Launch smarter, not louder.**",
      "- Premium: **A polished brand presence starts here.**",
      "- Direct-response: **Design content that actually converts.**",
    ].join("\n");
  }

  if (lower.includes("layout")) {
    return [
      "A strong social layout usually has:",
      "- one dominant focal point",
      "- one short headline block",
      "- one CTA zone with contrast",
      "- generous padding around the edges",
    ].join("\n");
  }

  return [
    "I can help with layout, palette, copy, and visual polish.",
    "If you want fast momentum, tell me:",
    "- the platform",
    "- the goal",
    "- the style",
    "- the audience",
  ].join("\n");
}

export const trpc = {
  projects: {
    list: {
      useQuery: () => {
        const { getToken, isSignedIn, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();
        return useLocalQuery(async () => {
          if (!isSignedIn) {
            return [] as ProjectRecord[];
          }
          const token = await getToken();
          const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
          const clerkUserId = user?.id ?? userId ?? null;
          return apiRequest<ProjectRecord[]>(
            "/api/projects",
            { method: "GET" },
            token,
            userEmail,
            clerkUserId
          );
        }, [isSignedIn, getToken, user?.id, userId]);
      },
    },
    get: {
      useQuery: (input?: { id: string }, options?: QueryOptions) => {
        const { getToken, isSignedIn, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();
        const key = useMemo(() => JSON.stringify(input ?? null), [input]);
        return useLocalQuery(
          async () => {
            if (!input || !isSignedIn) {
              return undefined;
            }
            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            return apiRequest<ProjectRecord>(
              `/api/projects/${input.id}`,
              { method: "GET" },
              token,
              userEmail,
              clerkUserId
            );
          },
          [key, isSignedIn, getToken, user?.id, userId],
          options
        );
      },
    },
    create: {
      useMutation: () => {
        const { getToken, isSignedIn, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();
        return useLocalMutation(
          async (input: {
            name: string;
            canvasWidth: number;
            canvasHeight: number;
            canvasData: string;
            category?: string;
            thumbnailUrl?: string;
          }) => {
            if (!isSignedIn) {
              throw new Error("Please sign in to save projects.");
            }

            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            if (!token && !clerkUserId && !userEmail) {
              throw new Error("Please sign in to save projects.");
            }
            const created = await apiRequest<ProjectRecord>(
              "/api/projects",
              {
                method: "POST",
                body: JSON.stringify(input),
              },
              token,
              userEmail,
              clerkUserId
            );

            return { id: created.id };
          }
        );
      },
    },
    save: {
      useMutation: () => {
        const { getToken, isSignedIn, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();
        return useLocalMutation(
          async (input: {
            id: string;
            canvasData: string;
            thumbnailUrl?: string;
            name?: string;
          }) => {
            if (!isSignedIn) {
              throw new Error("Please sign in to save projects.");
            }

            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            if (!token && !clerkUserId && !userEmail) {
              throw new Error("Please sign in to save projects.");
            }
            await apiRequest<ProjectRecord>(
              `/api/projects/${input.id}`,
              {
                method: "PUT",
                body: JSON.stringify({
                  canvasData: input.canvasData,
                  thumbnailUrl: input.thumbnailUrl,
                  name: input.name,
                }),
              },
              token,
              userEmail,
              clerkUserId
            );

            return { success: true };
          }
        );
      },
    },
    delete: {
      useMutation: () => {
        const { getToken, isSignedIn, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();
        return useLocalMutation(async (input: { id: string }) => {
          if (!isSignedIn) {
            throw new Error("Please sign in to delete projects.");
          }

          const token = await getToken();
          const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
          const clerkUserId = user?.id ?? userId ?? null;
          if (!token && !clerkUserId && !userEmail) {
            throw new Error("Please sign in to delete projects.");
          }
          await apiRequest<void>(
            `/api/projects/${input.id}`,
            { method: "DELETE" },
            token,
            userEmail,
            clerkUserId
          );
          return { success: true };
        });
      },
    },
  },
  userSettings: {
    get: {
      useQuery: () => {
        const { getToken, isSignedIn } = useSafeClerkAuth();
        return useLocalQuery(async () => {
          if (!isSignedIn) {
            return { brandKit: null, updatedAt: null } as UserSettingsRecord;
          }

          const token = await getToken();
          return apiRequest<UserSettingsRecord>(
            "/api/user-settings",
            { method: "GET" },
            token
          );
        }, [isSignedIn, getToken]);
      },
    },
    save: {
      useMutation: () => {
        const { getToken, isSignedIn } = useSafeClerkAuth();
        return useLocalMutation(async (input: { brandKit: unknown }) => {
          if (!isSignedIn) {
            throw new Error("Please sign in to save your Brand Kit.");
          }

          const token = await getToken();
          return apiRequest<UserSettingsRecord>(
            "/api/user-settings",
            {
              method: "PUT",
              body: JSON.stringify(input),
            },
            token
          );
        });
      },
    },
  },
  templates: {
    list: {
      useQuery: (input?: { category?: string }) => {
        const key = useMemo(() => JSON.stringify(input ?? null), [input]);
        return useLocalQuery(() => listTemplates(input), [key]);
      },
    },
    get: {
      useQuery: (input?: { id: number }, options?: QueryOptions) => {
        const key = useMemo(() => JSON.stringify(input ?? null), [input]);
        return useLocalQuery(
          () => (input ? getTemplate(input) : undefined),
          [key],
          options
        );
      },
    },
  },
  assets: {
    searchPhotos: {
      useQuery: (input?: StockAssetSearchInput, options?: QueryOptions) => {
        const key = useMemo(() => JSON.stringify(input ?? null), [input]);
        return useLocalQuery(() => getPhotos(input), [key], options);
      },
    },
    searchUnsplash: {
      useQuery: (input: UnsplashSearchInput, options?: QueryOptions) => {
        const key = useMemo(() => JSON.stringify(input), [input]);
        return useLocalQuery(() => searchUnsplash(input), [key], options);
      },
    },
    triggerUnsplashDownload: {
      useMutation: () =>
        useLocalMutation((downloadLocation: string) =>
          triggerUnsplashDownload(downloadLocation)
        ),
    },
  },
  ai: {
    chat: {
      useMutation: () => {
        const { getToken, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();

        return useLocalMutation(
          async (input: {
            message: string;
            history?: Array<{ role: "user" | "assistant"; content: string }>;
          }) => {
            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            let response = "";
            await aiClient.chatStream(
              input.message,
              input.history ?? [],
              token => {
                response += token;
              },
              undefined,
              { token, userEmail, clerkUserId }
            );
            return { response };
          }
        );
      },
    },
    generateImage: {
      useMutation: () => {
        const { getToken, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();

        return useLocalMutation(async (input: { prompt: string }) => {
          const token = await getToken();
          const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
          const clerkUserId = user?.id ?? userId ?? null;
          return aiClient.generateImage(input.prompt, 1024, 1024, {
            token,
            userEmail,
            clerkUserId,
          });
        });
      },
    },
    generateBackground: {
      useMutation: () => {
        const { getToken, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();

        return useLocalMutation(
          async (input: { prompt: string; width: number; height: number }) => {
            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            return aiClient.generateBackground(
              input.prompt,
              input.width,
              input.height,
              { token, userEmail, clerkUserId }
            );
          }
        );
      },
    },
    suggestLayout: {
      useMutation: () => {
        const { getToken, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();

        return useLocalMutation(
          async (input: {
            purpose: string;
            canvasWidth: number;
            canvasHeight: number;
            brandContext?: string;
          }) => {
            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            return aiClient.suggestLayout(
              input.purpose,
              input.canvasWidth,
              input.canvasHeight,
              { token, userEmail, clerkUserId },
              input.brandContext
            );
          }
        );
      },
    },
    generateSvg: {
      useMutation: () => {
        const { getToken, userId } = useSafeClerkAuth();
        const { user } = useSafeClerkUser();

        return useLocalMutation(
          async (input: { prompt: string; width?: number; height?: number }) => {
            const token = await getToken();
            const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
            const clerkUserId = user?.id ?? userId ?? null;
            return aiClient.generateSvg(
              input.prompt,
              input.width ?? 1024,
              input.height ?? 1024,
              { token, userEmail, clerkUserId }
            );
          }
        );
      },
    },
    creditConfig: {
      useQuery: () => {
        return useLocalQuery(() => aiClient.getAiCreditConfig(), []);
      },
    },
  },
};
