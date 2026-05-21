import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from "@ai-sdk/google";

export const AI_PROVIDER_NAME = "google-gemini";
export const DEFAULT_AI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_AI_IMAGE_MODEL = "gemini-2.5-flash-image";

const GEMINI_API_KEY_ENV_NAMES = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
] as const;

function sanitizeEnvValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted || null;
}

let cachedProvider: GoogleGenerativeAIProvider | null = null;
let cachedApiKey: string | null = null;

export function getGeminiApiKey(): string | null {
  for (const envName of GEMINI_API_KEY_ENV_NAMES) {
    const apiKey = sanitizeEnvValue(process.env[envName]);
    if (apiKey) {
      return apiKey;
    }
  }

  return null;
}

export function getGeminiApiKeySource(): string | null {
  for (const envName of GEMINI_API_KEY_ENV_NAMES) {
    if (sanitizeEnvValue(process.env[envName])) {
      return envName;
    }
  }

  return null;
}

export function getAiTextModelId(): string {
  return sanitizeEnvValue(process.env.AI_TEXT_MODEL) || DEFAULT_AI_TEXT_MODEL;
}

export function getAiImageModelId(): string {
  return sanitizeEnvValue(process.env.AI_IMAGE_MODEL) || DEFAULT_AI_IMAGE_MODEL;
}

export function getGeminiProvider(): GoogleGenerativeAIProvider | null {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    cachedProvider = null;
    cachedApiKey = null;
    return null;
  }

  if (!cachedProvider || cachedApiKey !== apiKey) {
    cachedProvider = createGoogleGenerativeAI({ apiKey });
    cachedApiKey = apiKey;
  }

  return cachedProvider;
}

export function getGeminiTextModel() {
  return getGeminiProvider()?.(getAiTextModelId()) ?? null;
}

export function getGeminiImageModel() {
  return getGeminiProvider()?.image(getAiImageModelId()) ?? null;
}
