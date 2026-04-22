type ChatMessage = { role: "user" | "assistant"; content: string };

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

/**
 * Stream chat tokens from the server AI route.
 * Calls `onToken` for each text chunk as it arrives.
 */
export async function chatStream(
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  canvasContext?: string,
): Promise<void> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, canvasContext }),
  });

  if (!response.ok) {
    // Use a safe generic message to avoid leaking server implementation details
    throw new Error(`Chat request failed (${response.status})`);
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
): Promise<LayoutSuggestion> {
  const response = await fetch("/api/ai/suggest-layout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose, canvasWidth, canvasHeight }),
  });

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      (err as { error?: string }).error ||
        `Layout suggestion failed: ${response.status}`,
    );
  }

  return response.json() as Promise<LayoutSuggestion>;
}

/**
 * Generate an AI image for the given prompt.
 * Currently returns an SVG placeholder until image generation is implemented.
 */
export function generateImage(
  prompt: string,
  width = 1024,
  height = 1024,
): Promise<{ url: string }> {
  return Promise.resolve({ url: createAiImagePlaceholder(prompt, width, height) });
}

/**
 * Generate an AI background for the given prompt.
 * Currently returns an SVG placeholder until image generation is implemented.
 */
export function generateBackground(
  prompt: string,
  width: number,
  height: number,
): Promise<{ url: string }> {
  return Promise.resolve({
    url: createAiBackgroundPlaceholder(prompt, width, height),
  });
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
  height: number,
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
  height: number,
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
