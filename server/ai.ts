import { createHash } from "node:crypto";
import { Router, type Request, type Response } from "express";
import {
  type ImageModelUsage,
  type LanguageModelUsage,
  type ProviderMetadata,
} from "ai";
import { z } from "zod";
import {
  AI_PROVIDER_NAME,
  generateVeronicaImage,
  generateVeronicaText,
  getAiImageModelId,
  getAiTextModelId,
  getVeronicaApiKeySource,
  isVeronicaConfigured,
} from "./aiProvider.js";
import { getPrisma } from "./db.js";

type AiFeature =
  | "chat"
  | "layout"
  | "image"
  | "background"
  | "svg"
  | "code"
  | "chart"
  | "form"
  | "video"
  | "audio";
type AiStatus = "success" | "failed" | "blocked";
type AiRouteUser = {
  id: string;
  customer?: { plan?: string | null } | null;
} | null;

type CreateAiRouterOptions = {
  resolveUser?: (req: Request) => Promise<AiRouteUser>;
};

type AiAccess = {
  user: AiRouteUser;
  anonymousKey: string | null;
  plan: string;
  monthlyUsedUnits: number;
  monthlyCapUnits: number;
};

type AiUsageInput = {
  access: AiAccess;
  feature: AiFeature;
  model: string;
  prompt: string;
  status: AiStatus;
  costUnits: number;
  usage?: LanguageModelUsage | ImageModelUsage;
  providerMetadata?: ProviderMetadata | Record<string, unknown>;
  errorCode?: string;
  generatedAssetUrl?: string;
};

const FEATURE_COST_UNITS: Record<AiFeature, number> = {
  chat: 1,
  layout: 2,
  image: 10,
  background: 10,
  svg: 2,
  code: 2,
  chart: 2,
  form: 2,
  video: 0,
  audio: 0,
};

const FREE_MONTHLY_AI_UNITS = 50;
const PREMIUM_MONTHLY_AI_UNITS = 500;
const CREDIT_PACK_FEATURE_ENABLED =
  process.env.AI_CREDIT_PACKS_ENABLED === "true";
const AI_CREDIT_PACK_STRIPE_PRICE_ID =
  process.env.STRIPE_PRICE_AI_CREDIT_PACK ?? null;

const anonymousUsage = new Map<
  string,
  { monthKey: string; usedUnits: number }
>();

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(8000),
  history: z.array(chatMessageSchema).max(30).default([]),
  canvasContext: z.string().trim().max(12000).optional(),
});

const layoutRequestSchema = z.object({
  purpose: z.string().trim().min(1, "purpose is required").max(1200),
  canvasWidth: z.coerce.number().int().min(64).max(8192),
  canvasHeight: z.coerce.number().int().min(64).max(8192),
  brandContext: z.string().trim().max(2000).optional(),
});

const imageRequestSchema = z.object({
  prompt: z.string().trim().min(1, "prompt is required").max(2000),
  width: z.coerce.number().int().min(64).max(4096).default(1024),
  height: z.coerce.number().int().min(64).max(4096).default(1024),
});

const svgRequestSchema = z.object({
  prompt: z.string().trim().min(1, "prompt is required").max(1600),
  width: z.coerce.number().int().min(64).max(4096).default(1024),
  height: z.coerce.number().int().min(64).max(4096).default(1024),
});

const layoutElementSchema = z.object({
  type: z.enum(["text", "shape", "image"]),
  left: z.number().finite(),
  top: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
  fill: z.string().max(120).optional(),
  text: z.string().max(500).optional(),
  fontSize: z.number().finite().positive().max(300).optional(),
  fontFamily: z.string().max(120).optional(),
});

const layoutSuggestionSchema = z.object({
  description: z.string().max(500),
  elements: z.array(layoutElementSchema).min(1).max(8),
});

function getMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

function getPlanCap(plan: string): number {
  return plan === "pro" || plan === "team" || plan === "premium"
    ? PREMIUM_MONTHLY_AI_UNITS
    : FREE_MONTHLY_AI_UNITS;
}

function getAnonymousUsageKey(req: Request): string {
  const clientId = req.header("x-veronica-ai-client-id")?.trim();
  if (clientId) {
    return `client:${clientId.slice(0, 120)}`;
  }

  const ip = req.ip || "unknown";
  const userAgent = req.header("user-agent") || "unknown";
  return `guest:${Buffer.from(`${ip}:${userAgent.slice(0, 120)}`).toString("base64url")}`;
}

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map(issue => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

function parseRequest<T>(
  schema: z.ZodType<T>,
  body: unknown,
  res: Response
): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid AI request",
      details: formatValidationError(parsed.error),
    });
    return null;
  }

  return parsed.data;
}

function sendMissingVeronicaConfig(res: Response) {
  return res.status(503).json({
    error:
      "AI features require VERONICA_AI_API_KEY and VERONICA_AI_BASE_URL to be configured.",
  });
}

function normalizeProviderError(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const responseBody =
    typeof error === "object" && error && "responseBody" in error
      ? String((error as { responseBody?: unknown }).responseBody ?? "")
      : "";
  const combined = `${raw}\n${responseBody}`;
  const lower = combined.toLowerCase();

  if (lower.includes("api_key_invalid") || lower.includes("api key not valid")) {
    return {
      status: 503,
      code: "provider_api_key_invalid",
      message:
        "Veronica AI authentication failed. Check VERONICA_AI_API_KEY.",
    };
  }

  if (
    lower.includes("api key") ||
    lower.includes("permission") ||
    lower.includes("unauthorized")
  ) {
    return {
      status: 503,
      code: "provider_auth",
      message: "Veronica AI authentication failed. Check VERONICA_AI_API_KEY.",
    };
  }

  if (
    lower.includes("safety") ||
    lower.includes("blocked") ||
    lower.includes("policy")
  ) {
    return {
      status: 400,
      code: "provider_blocked",
      message:
        "Veronica AI blocked this generation request. Try a different prompt.",
    };
  }

  if (lower.includes("no image")) {
    return {
      status: 502,
      code: "provider_no_image",
      message:
        "Veronica AI did not return an image for this request. Try a more explicit visual prompt.",
    };
  }

  return {
    status: 502,
    code: "provider_error",
    message: "Veronica AI request failed. Try again in a moment.",
  };
}

async function resolveAiUser(
  req: Request,
  options: CreateAiRouterOptions
): Promise<AiRouteUser> {
  if (!options.resolveUser) {
    return null;
  }

  try {
    return await options.resolveUser(req);
  } catch (error) {
    console.warn("AI user resolution failed", error);
    return null;
  }
}

async function getMonthlyUsedUnits(userId: string): Promise<number> {
  const prisma = await getPrisma();
  const result = await prisma.aiUsageSummary.aggregate({
    where: {
      userId,
      monthKey: getMonthKey(),
    },
    _sum: {
      costUnits: true,
    },
  });

  return result._sum.costUnits ?? 0;
}

async function prepareAiAccess(
  req: Request,
  options: CreateAiRouterOptions,
  feature: AiFeature
): Promise<
  | { ok: true; access: AiAccess }
  | { ok: false; status: number; error: string }
> {
  const user = await resolveAiUser(req, options);
  const plan = user?.customer?.plan ?? "free";
  const monthlyCapUnits = getPlanCap(plan);
  const costUnits = FEATURE_COST_UNITS[feature];

  if (user) {
    try {
      const monthlyUsedUnits = await getMonthlyUsedUnits(user.id);
      if (monthlyUsedUnits + costUnits > monthlyCapUnits) {
        return {
          ok: false,
          status: 429,
          error:
            "AI credits exhausted for this month. Upgrade your plan or wait for the monthly reset.",
        };
      }

      return {
        ok: true,
        access: {
          user,
          anonymousKey: null,
          plan,
          monthlyUsedUnits,
          monthlyCapUnits,
        },
      };
    } catch (error) {
      console.warn("AI usage lookup failed; falling back to anonymous metering", error);
    }
  }

  const anonymousKey = getAnonymousUsageKey(req);
  const monthKey = getMonthKey();
  const record = anonymousUsage.get(anonymousKey);
  const monthlyUsedUnits = record?.monthKey === monthKey ? record.usedUnits : 0;
  if (monthlyUsedUnits + costUnits > FREE_MONTHLY_AI_UNITS) {
    return {
      ok: false,
      status: 429,
      error:
        "AI credits exhausted for this month. Sign in or upgrade your plan to continue.",
    };
  }

  return {
    ok: true,
    access: {
      user: null,
      anonymousKey,
      plan: "free",
      monthlyUsedUnits,
      monthlyCapUnits: FREE_MONTHLY_AI_UNITS,
    },
  };
}

async function recordAiUsage(input: AiUsageInput): Promise<void> {
  const monthKey = getMonthKey();
  const promptHash = hashPrompt(input.prompt);
  const usage = input.usage;
  const inputTokens =
    usage && "inputTokens" in usage ? usage.inputTokens : undefined;
  const outputTokens =
    usage && "outputTokens" in usage ? usage.outputTokens : undefined;
  const totalTokens =
    usage && "totalTokens" in usage ? usage.totalTokens : undefined;

  if (input.access.anonymousKey && input.status === "success") {
    const current = anonymousUsage.get(input.access.anonymousKey);
    anonymousUsage.set(input.access.anonymousKey, {
      monthKey,
      usedUnits:
        current?.monthKey === monthKey
          ? current.usedUnits + input.costUnits
          : input.costUnits,
    });
  }

  const userId = input.access.user?.id;
  if (!userId) {
    return;
  }

  try {
    const prisma = await getPrisma();
    if (input.status === "success") {
      await prisma.aiUsageSummary.upsert({
        where: {
          userId_monthKey_feature: {
            userId,
            monthKey,
            feature: input.feature,
          },
        },
        update: {
          requestCount: { increment: 1 },
          costUnits: { increment: input.costUnits },
        },
        create: {
          userId,
          monthKey,
          feature: input.feature,
          requestCount: 1,
          costUnits: input.costUnits,
        },
      });
    }

    await prisma.aiRequest.create({
      data: {
        userId,
        feature: input.feature,
        provider: AI_PROVIDER_NAME,
        model: input.model,
        promptHash,
        status: input.status,
        costUnits: input.status === "success" ? input.costUnits : 0,
        inputTokens,
        outputTokens,
        totalTokens,
        providerMetadata: input.providerMetadata as never,
        errorCode: input.errorCode,
      },
    });

    if (input.generatedAssetUrl && input.status === "success") {
      await prisma.generatedAsset.create({
        data: {
          userId,
          feature: input.feature,
          url: input.generatedAssetUrl,
          provider: AI_PROVIDER_NAME,
          model: input.model,
          promptHash,
          metadata: {
            costUnits: input.costUnits,
            usage,
          } as never,
        },
      });
    }
  } catch (error) {
    console.warn("Failed to record AI usage", error);
  }
}

function logAiRequest(feature: AiFeature, access: AiAccess, model: string) {
  console.info("AI request", {
    provider: AI_PROVIDER_NAME,
    feature,
    model,
    plan: access.plan,
    usedUnits: access.monthlyUsedUnits,
    capUnits: access.monthlyCapUnits,
    userScope: access.user ? "user" : "anonymous",
  });
}

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error("No JSON object found in layout response");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }

  throw new Error("Incomplete JSON object in layout response");
}

function extractSvg(text: string): string {
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) {
    throw new Error("No SVG found in provider response");
  }

  return match[0];
}

function sanitizeSvg(svg: string, width: number, height: number): string {
  let clean = svg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!doctype[\s\S]*?>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(?:href|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, "");

  if (!/^<svg[\s>]/i.test(clean.trim())) {
    throw new Error("Provider response did not contain a valid SVG root");
  }

  clean = clean.replace(/<svg\b/i, `<svg`);

  if (!/\sxmlns=/.test(clean.slice(0, clean.indexOf(">") + 1))) {
    clean = clean.replace(
      /<svg\b/i,
      `<svg xmlns="http://www.w3.org/2000/svg"`
    );
  }

  const rootEnd = clean.indexOf(">");
  const rootTag = clean.slice(0, rootEnd + 1);
  let nextRootTag = rootTag;

  if (!/\sviewBox=/.test(rootTag)) {
    nextRootTag = nextRootTag.replace(
      />$/,
      ` viewBox="0 0 ${width} ${height}">`
    );
  }

  if (!/\swidth=/.test(rootTag)) {
    nextRootTag = nextRootTag.replace(/>$/, ` width="${width}">`);
  }

  if (!/\sheight=/.test(rootTag)) {
    nextRootTag = nextRootTag.replace(/>$/, ` height="${height}">`);
  }

  return `${nextRootTag}${clean.slice(rootEnd + 1)}`;
}

function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export function createAiRouter(options: CreateAiRouterOptions = {}): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    const keyConfigured = isVeronicaConfigured();
    return res.json({
      provider: AI_PROVIDER_NAME,
      keyConfigured,
      keySource: getVeronicaApiKeySource(),
      textModel: getAiTextModelId(),
      imageModel: getAiImageModelId(),
    });
  });

  router.get("/credits/config", (_req: Request, res: Response) => {
    return res.json({
      currency: "credit-units",
      monthlyCaps: {
        free: FREE_MONTHLY_AI_UNITS,
        premium: PREMIUM_MONTHLY_AI_UNITS,
      },
      featureCosts: FEATURE_COST_UNITS,
      paidUsage: {
        enabled: CREDIT_PACK_FEATURE_ENABLED,
        stripePriceId: AI_CREDIT_PACK_STRIPE_PRICE_ID,
      },
    });
  });

  router.post("/chat", async (req: Request, res: Response) => {
    const request = parseRequest(chatRequestSchema, req.body, res);
    if (!request) return;

    if (!isVeronicaConfigured()) {
      return sendMissingVeronicaConfig(res);
    }

    const access = await prepareAiAccess(req, options, "chat");
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const modelId = getAiTextModelId();
    logAiRequest("chat", access.access, modelId);

    const systemParts = [
      "You are Veronica AI, an expert assistant for a web-based graphic design editor.",
      "Help users with layout suggestions, color palettes, copy writing, and design feedback.",
      "Be concise, practical, and use markdown formatting for clarity.",
    ];

    if (request.canvasContext) {
      systemParts.push(`Current canvas context:\n${request.canvasContext}`);
    }

    const messages = [
      ...request.history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: request.message },
    ];

    try {
      const result = await generateVeronicaText({
        system: systemParts.join("\n\n"),
        messages,
      });

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(result.text);

      await recordAiUsage({
        access: access.access,
        feature: "chat",
        model: modelId,
        prompt: request.message,
        status: "success",
        costUnits: FEATURE_COST_UNITS.chat,
      });
    } catch (error) {
      const normalized = normalizeProviderError(error);
      await recordAiUsage({
        access: access.access,
        feature: "chat",
        model: modelId,
        prompt: request.message,
        status: "failed",
        costUnits: FEATURE_COST_UNITS.chat,
        errorCode: normalized.code,
      });

      if (res.headersSent) {
        res.end();
        return;
      }

      return res.status(normalized.status).json({ error: normalized.message });
    }
  });

  router.post("/suggest-layout", async (req: Request, res: Response) => {
    const request = parseRequest(layoutRequestSchema, req.body, res);
    if (!request) return;

    if (!isVeronicaConfigured()) {
      return sendMissingVeronicaConfig(res);
    }

    const access = await prepareAiAccess(req, options, "layout");
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const modelId = getAiTextModelId();
    logAiRequest("layout", access.access, modelId);

    const brandContext = request.brandContext?.trim();
    const brandInstructions = brandContext
      ? [
          "Brand kit context was supplied by the current request.",
          "Use only these supplied colors/fonts/logo notes; never assume or reuse another user's brand data.",
          brandContext,
        ].join("\n")
      : "No brand kit was supplied. Infer a temporary visual style from the purpose and canvas size only.";

    const prompt = `You are a graphic design layout expert. Generate a layout suggestion for:
- Purpose: ${request.purpose}
- Canvas: ${request.canvasWidth}px wide by ${request.canvasHeight}px tall
- Brand/style context: ${brandInstructions}

Return ONLY a valid JSON object with this exact structure, no extra text or markdown:
{
  "description": "one-sentence description of the layout",
  "elements": [
    {
      "type": "text",
      "left": 100,
      "top": 80,
      "width": 400,
      "height": 60,
      "fill": "#111827",
      "text": "Headline text here",
      "fontSize": 48,
      "fontFamily": "Inter"
    },
    {
      "type": "shape",
      "left": 50,
      "top": 50,
      "width": 500,
      "height": 200,
      "fill": "#2563eb"
    }
  ]
}

Include 3-5 elements. Use pixel values that fit within the canvas dimensions. Return ONLY JSON.`;

    try {
      const result = await generateVeronicaText({
        prompt,
      });

      const parsedJson = extractJsonObject(result.text);
      const layout = layoutSuggestionSchema.parse(parsedJson);

      await recordAiUsage({
        access: access.access,
        feature: "layout",
        model: modelId,
        prompt: request.purpose,
        status: "success",
        costUnits: FEATURE_COST_UNITS.layout,
      });

      return res.json(layout);
    } catch (error) {
      const isParseFailure = error instanceof SyntaxError || error instanceof z.ZodError;
      const normalized = isParseFailure
        ? {
            status: 502,
            code: "layout_json_parse",
            message: "Veronica AI returned a layout that did not match the required JSON schema.",
          }
        : normalizeProviderError(error);

      await recordAiUsage({
        access: access.access,
        feature: "layout",
        model: modelId,
        prompt: request.purpose,
        status: "failed",
        costUnits: FEATURE_COST_UNITS.layout,
        errorCode: normalized.code,
      });

      console.error("Layout suggestion error:", error);
      return res.status(normalized.status).json({ error: normalized.message });
    }
  });

  function handleImageGeneration(feature: "image" | "background") {
    return async (req: Request, res: Response) => {
      const request = parseRequest(imageRequestSchema, req.body, res);
      if (!request) return;

      if (!isVeronicaConfigured()) {
        return sendMissingVeronicaConfig(res);
      }

      const access = await prepareAiAccess(req, options, feature);
      if (!access.ok) {
        return res.status(access.status).json({ error: access.error });
      }

      const modelId = getAiImageModelId();
      logAiRequest(feature, access.access, modelId);

      const prompt =
        feature === "background"
          ? `Generate a full-canvas background image for a graphic design project. Avoid text unless explicitly requested. Prompt: ${request.prompt}`
          : `Generate a transparent-friendly design asset or image element. Avoid embedded text unless explicitly requested. Prompt: ${request.prompt}`;

      try {
        const result = await generateVeronicaImage({
          prompt,
          width: request.width,
          height: request.height,
        });

        await recordAiUsage({
          access: access.access,
          feature,
          model: modelId,
          prompt: request.prompt,
          status: "success",
          costUnits: FEATURE_COST_UNITS[feature],
          generatedAssetUrl: result.url,
        });

        return res.json({ url: result.url });
      } catch (error) {
        const normalized = normalizeProviderError(error);
        await recordAiUsage({
          access: access.access,
          feature,
          model: modelId,
          prompt: request.prompt,
          status: normalized.code === "provider_blocked" ? "blocked" : "failed",
          costUnits: FEATURE_COST_UNITS[feature],
          errorCode: normalized.code,
        });

        console.error(`${feature} generation error:`, error);
        return res.status(normalized.status).json({ error: normalized.message });
      }
    };
  }

  router.post("/generate-image", handleImageGeneration("image"));
  router.post("/generate-background", handleImageGeneration("background"));

  router.post("/generate-svg", async (req: Request, res: Response) => {
    const request = parseRequest(svgRequestSchema, req.body, res);
    if (!request) return;

    if (!isVeronicaConfigured()) {
      return sendMissingVeronicaConfig(res);
    }

    const access = await prepareAiAccess(req, options, "svg");
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const modelId = getAiTextModelId();
    logAiRequest("svg", access.access, modelId);

    const prompt = [
      "Create one editable SVG asset for a graphic design canvas.",
      `Canvas target: ${request.width}px by ${request.height}px.`,
      `Asset request: ${request.prompt}`,
      "Return only the <svg> markup. Do not use markdown fences.",
      "Use simple vector primitives, paths, gradients, and text only when explicitly requested.",
      "Do not include scripts, foreignObject, external image links, tracking pixels, or remote resources.",
    ].join("\n");

    try {
      const result = await generateVeronicaText({
        prompt,
      });
      const svg = sanitizeSvg(extractSvg(result.text), request.width, request.height);
      const url = createSvgDataUrl(svg);

      await recordAiUsage({
        access: access.access,
        feature: "svg",
        model: modelId,
        prompt: request.prompt,
        status: "success",
        costUnits: FEATURE_COST_UNITS.svg,
        generatedAssetUrl: url,
      });

      return res.json({
        svg,
        url,
        costUnits: FEATURE_COST_UNITS.svg,
      });
    } catch (error) {
      const normalized = normalizeProviderError(error);
      await recordAiUsage({
        access: access.access,
        feature: "svg",
        model: modelId,
        prompt: request.prompt,
        status: normalized.code === "provider_blocked" ? "blocked" : "failed",
        costUnits: FEATURE_COST_UNITS.svg,
        errorCode: normalized.code,
      });

      console.error("SVG generation error:", error);
      return res.status(normalized.status).json({ error: normalized.message });
    }
  });

  return router;
}
