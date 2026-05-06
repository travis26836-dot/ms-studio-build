import { Router, type Request, type Response } from "express";
import { streamText, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

type GetOrCreateUser = (req: Request) => Promise<{ id: string } | null>;

// Cache the Groq client at module scope (created once when GROQ_API_KEY is available)
const groqClient = process.env.GROQ_API_KEY
  ? createGroq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const CHAT_MODEL = "llama-3.3-70b-versatile";

// Together AI image generation constants
const TOGETHER_API_URL = "https://api.together.xyz/v1/images/generations";
const IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell-Free";

/**
 * Clamp and round a pixel dimension to a value accepted by FLUX.1:
 * must be a multiple of 64, between 64 and 1440.
 */
function normalizeImageDimension(size: number): number {
  const clamped = Math.min(Math.max(Math.round(size), 64), 1440);
  return Math.round(clamped / 64) * 64;
}

/**
 * Call Together AI's REST API to generate an image and return a base64 data URL.
 */
async function generateImageViaTogetherAI(
  prompt: string,
  width: number,
  height: number,
): Promise<{ url: string }> {
  const apiKey = process.env.TOGETHER_AI_API_KEY;
  if (!apiKey) {
    throw new Error("TOGETHER_AI_API_KEY is not configured");
  }

  const w = normalizeImageDimension(width);
  const h = normalizeImageDimension(height);

  const response = await fetch(TOGETHER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      width: w,
      height: h,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Together AI error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const item = data.data?.[0];
  if (!item) {
    throw new Error("No image data returned by Together AI");
  }

  if (item.b64_json) {
    return { url: `data:image/jpeg;base64,${item.b64_json}` };
  }

  if (item.url) {
    return { url: item.url };
  }

  throw new Error("Unexpected response format from Together AI");
}

export function createAiRouter(getOrCreateUser: GetOrCreateUser): Router {
  const router = Router();

  // POST /api/ai/chat – stream text response via Groq
  router.post("/chat", async (req: Request, res: Response) => {
    const user = await getOrCreateUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!groqClient) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(
        "AI features require a GROQ_API_KEY environment variable. " +
          "Sign up for a free account at console.groq.com and add GROQ_API_KEY to your environment.",
      );
      return;
    }

    const {
      message,
      history = [],
      canvasContext,
    } = req.body as {
      message: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      canvasContext?: string;
    };

    const systemParts = [
      "You are an expert AI design assistant for MS Studio, a web-based graphic design editor.",
      "Help users with layout suggestions, color palettes, copy writing, and design feedback.",
      "Be concise, practical, and use markdown formatting for clarity.",
    ];

    if (canvasContext) {
      systemParts.push(`Current canvas context:\n${canvasContext}`);
    }

    const messages = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const result = streamText({
      model: groqClient(CHAT_MODEL),
      system: systemParts.join("\n\n"),
      messages,
    });

    result.pipeTextStreamToResponse(res);
  });

  // POST /api/ai/suggest-layout – return JSON layout suggestion
  router.post("/suggest-layout", async (req: Request, res: Response) => {
    const user = await getOrCreateUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!groqClient) {
      return res
        .status(503)
        .json({ error: "AI features require GROQ_API_KEY to be configured." });
    }

    const { purpose, canvasWidth, canvasHeight } = req.body as {
      purpose: string;
      canvasWidth: number;
      canvasHeight: number;
    };

    const prompt = `You are a graphic design layout expert. Generate a layout suggestion for:
- Purpose: ${purpose}
- Canvas: ${canvasWidth}px wide by ${canvasHeight}px tall

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
      const { text } = await generateText({
        model: groqClient(CHAT_MODEL),
        prompt,
      });

      // Extract the first complete JSON object from the model response.
      // LLMs sometimes wrap JSON in markdown fences or add explanatory text;
      // this finds the outermost {...} block and parses it.
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        return res
          .status(500)
          .json({ error: "Failed to parse AI layout response" });
      }

      const layout = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as unknown;
      return res.json(layout);
    } catch (err) {
      console.error("Layout suggestion error:", err);
      return res
        .status(500)
        .json({ error: "Failed to generate layout suggestion" });
    }
  });

  /**
   * Shared handler for both generate-image and generate-background routes.
   * Validates the request, calls Together AI, and sends the result.
   */
  function handleImageGeneration(label: "image" | "background") {
    return async (req: Request, res: Response) => {
      const user = await getOrCreateUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!process.env.TOGETHER_AI_API_KEY) {
        return res.status(503).json({
          error:
            `${label === "image" ? "Image" : "Background"} generation requires a TOGETHER_AI_API_KEY environment variable. ` +
            "Sign up at api.together.ai and add TOGETHER_AI_API_KEY to your environment.",
        });
      }

      const { prompt, width = 1024, height = 1024 } = req.body as {
        prompt?: string;
        width?: number;
        height?: number;
      };

      if (!prompt?.trim()) {
        return res.status(400).json({ error: "prompt is required" });
      }

      try {
        const result = await generateImageViaTogetherAI(prompt.trim(), width, height);
        return res.json(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to generate ${label}`;
        console.error(`${label} generation error:`, err);
        return res.status(500).json({ error: message });
      }
    };
  }

  // POST /api/ai/generate-image – generate a design element image via Together AI (FLUX.1)
  router.post("/generate-image", handleImageGeneration("image"));

  // POST /api/ai/generate-background – generate a full-canvas background via Together AI (FLUX.1)
  router.post("/generate-background", handleImageGeneration("background"));

  return router;
}
