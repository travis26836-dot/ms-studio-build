export const AI_PROVIDER_NAME = "veronica-ai";
export const DEFAULT_AI_TEXT_MODEL = "veronica-text";
export const DEFAULT_AI_IMAGE_MODEL = "veronica-image";

const VERONICA_API_KEY_ENV_NAME = "VERONICA_AI_API_KEY";
const VERONICA_BASE_URL_ENV_NAME = "VERONICA_AI_BASE_URL";

function sanitizeEnvValue(value: string | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted || null;
}

export function getVeronicaApiKey(): string | null {
  return sanitizeEnvValue(process.env[VERONICA_API_KEY_ENV_NAME]);
}

export function getVeronicaApiKeySource(): string | null {
  return getVeronicaApiKey() ? VERONICA_API_KEY_ENV_NAME : null;
}

export function getVeronicaBaseUrl(): string | null {
  return sanitizeEnvValue(process.env[VERONICA_BASE_URL_ENV_NAME])?.replace(/\/+$/, "") ?? null;
}

export function isVeronicaConfigured(): boolean {
  return Boolean(getVeronicaApiKey() && getVeronicaBaseUrl());
}

export function getAiTextModelId(): string {
  return sanitizeEnvValue(process.env.AI_TEXT_MODEL) || DEFAULT_AI_TEXT_MODEL;
}

export function getAiImageModelId(): string {
  return sanitizeEnvValue(process.env.AI_IMAGE_MODEL) || DEFAULT_AI_IMAGE_MODEL;
}

export class VeronicaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody = ""
  ) {
    super(message);
    this.name = "VeronicaApiError";
  }
}

type VeronicaMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function getRequiredConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = getVeronicaApiKey();
  const baseUrl = getVeronicaBaseUrl();
  if (!apiKey || !baseUrl) {
    throw new VeronicaApiError(
      "Veronica AI is not configured.",
      503
    );
  }

  return { apiKey, baseUrl };
}

async function requestVeronica<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const { apiKey, baseUrl } = getRequiredConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.text();

  if (!response.ok) {
    throw new VeronicaApiError(
      `Veronica AI request failed with status ${response.status}.`,
      response.status,
      responseBody
    );
  }

  try {
    return JSON.parse(responseBody) as T;
  } catch {
    throw new VeronicaApiError(
      "Veronica AI returned an invalid JSON response.",
      502,
      responseBody
    );
  }
}

export async function generateVeronicaText(input: {
  system?: string;
  messages?: VeronicaMessage[];
  prompt?: string;
}): Promise<{ text: string }> {
  const messages: VeronicaMessage[] = [
    ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
    ...(input.messages ?? []),
    ...(input.prompt ? [{ role: "user" as const, content: input.prompt }] : []),
  ];
  const response = await requestVeronica<{
    choices?: Array<{ message?: { content?: string } }>;
  }>("/chat/completions", {
    model: getAiTextModelId(),
    messages,
  });
  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new VeronicaApiError("Veronica AI did not return text.", 502);
  }

  return { text };
}

export async function generateVeronicaImage(input: {
  prompt: string;
  width: number;
  height: number;
}): Promise<{ url: string }> {
  const response = await requestVeronica<{
    data?: Array<{ b64_json?: string; url?: string }>;
  }>("/images/generations", {
    model: getAiImageModelId(),
    prompt: input.prompt,
    n: 1,
    size: `${input.width}x${input.height}`,
    response_format: "b64_json",
  });
  const image = response.data?.[0];
  if (image?.b64_json) return { url: `data:image/png;base64,${image.b64_json}` };
  if (image?.url) return { url: image.url };

  throw new VeronicaApiError("Veronica AI did not return an image.", 502);
}
