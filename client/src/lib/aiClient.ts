type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiRequestAuth = {
  token?: string | null;
  userEmail?: string | null;
  clerkUserId?: string | null;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type LayoutElement = {
  type: "text" | "shape" | "image";
  left: number;
  top: number;
  width: number;
  height: number;
  fill?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
};

export type LayoutSuggestion = {
  elements: LayoutElement[];
  description: string;
};

export type AiCreditConfig = {
  currency: string;
  monthlyCaps: {
    free: number;
    premium: number;
  };
  featureCosts: Record<string, number>;
  paidUsage: {
    enabled: boolean;
    stripePriceId: string | null;
  };
};

const AI_CLIENT_ID_KEY = "ms-studio.aiClientId.v1";

function getClientId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = window.localStorage.getItem(AI_CLIENT_ID_KEY);
    if (existing) return existing;

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(AI_CLIENT_ID_KEY, next);
    return next;
  } catch {
    return "local-client";
  }
}

function createAiHeaders(auth?: AiRequestAuth): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-MS-Studio-Client-Id": getClientId(),
  });

  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  if (auth?.userEmail?.trim()) {
    headers.set("x-user-email", auth.userEmail.trim().toLowerCase());
  }

  if (auth?.clerkUserId?.trim()) {
    headers.set("x-user-clerk-id", auth.clerkUserId.trim());
  }

  return headers;
}

async function readApiError(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => null);
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  }

  const detail = await response.text().catch(() => "");
  return detail || fallback;
}

/**
 * Stream chat tokens from the server AI route.
 * Calls `onToken` for each text chunk as it arrives.
 */
export async function chatStream(
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  canvasContext?: string,
  auth?: AiRequestAuth
): Promise<void> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: createAiHeaders(auth),
    credentials: "include",
    body: JSON.stringify({ message, history, canvasContext }),
  });

  if (!response.ok) {
    const detail = await readApiError(
      response,
      `Chat request failed (${response.status})`
    );
    const fallback = `Chat request failed (${response.status})`;
    throw new ApiRequestError(detail || fallback, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onToken(chunk);
    }
    // Flush any remaining bytes
    const remaining = decoder.decode();
    if (remaining) onToken(remaining);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Request a structured layout suggestion from the server.
 */
export async function suggestLayout(
  purpose: string,
  canvasWidth: number,
  canvasHeight: number,
  auth?: AiRequestAuth,
  brandContext?: string
): Promise<LayoutSuggestion> {
  const response = await fetch("/api/ai/suggest-layout", {
    method: "POST",
    headers: createAiHeaders(auth),
    credentials: "include",
    body: JSON.stringify({ purpose, canvasWidth, canvasHeight, brandContext }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Layout suggestion failed: ${response.status}`)
    );
  }

  return response.json() as Promise<LayoutSuggestion>;
}

export async function getAiCreditConfig(): Promise<AiCreditConfig> {
  const response = await fetch("/api/ai/credits/config", {
    method: "GET",
    headers: createAiHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `AI credit config failed (${response.status})`)
    );
  }

  return response.json() as Promise<AiCreditConfig>;
}

/**
 * Generate an AI image for the given prompt by calling the server.
 * Falls back to an SVG placeholder only if the server is unreachable.
 */
export async function generateImage(
  prompt: string,
  width = 1024,
  height = 1024,
  auth?: AiRequestAuth
): Promise<{ url: string }> {
  const response = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: createAiHeaders(auth),
    credentials: "include",
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `Image generation failed (${response.status})`)
    );
  }

  return response.json() as Promise<{ url: string }>;
}

/**
 * Generate an AI background for the given prompt by calling the server.
 * Falls back to an SVG placeholder only if the server is unreachable.
 */
export async function generateBackground(
  prompt: string,
  width: number,
  height: number,
  auth?: AiRequestAuth
): Promise<{ url: string }> {
  const response = await fetch("/api/ai/generate-background", {
    method: "POST",
    headers: createAiHeaders(auth),
    credentials: "include",
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        `Background generation failed (${response.status})`
      )
    );
  }

  return response.json() as Promise<{ url: string }>;
}

export async function generateSvg(
  prompt: string,
  width = 1024,
  height = 1024,
  auth?: AiRequestAuth
): Promise<{ svg: string; url: string; costUnits: number }> {
  const response = await fetch("/api/ai/generate-svg", {
    method: "POST",
    headers: createAiHeaders(auth),
    credentials: "include",
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(response, `SVG generation failed (${response.status})`)
    );
  }

  return response.json() as Promise<{
    svg: string;
    url: string;
    costUnits: number;
  }>;
}

// ── SVG placeholder helpers ──────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createAiImagePlaceholder(
  prompt: string,
  width: number,
  height: number
): string {
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

function createAiBackgroundPlaceholder(
  prompt: string,
  width: number,
  height: number
): string {
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
