import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from "@ai-sdk/google";

export const AI_PROVIDER_NAME = "google-gemini";
export const DEFAULT_AI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_AI_IMAGE_MODEL = "gemini-2.5-flash-image";

let cachedProvider: GoogleGenerativeAIProvider | null = null;
let cachedApiKey: string | null = null;

export function getGeminiApiKey(): string | null {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return apiKey || null;
}

export function getAiTextModelId(): string {
  return process.env.AI_TEXT_MODEL?.trim() || DEFAULT_AI_TEXT_MODEL;
}

export function getAiImageModelId(): string {
  return process.env.AI_IMAGE_MODEL?.trim() || DEFAULT_AI_IMAGE_MODEL;
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
