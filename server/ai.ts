import { Router, type Request, type Response } from "express";
import { streamText, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

type GetOrCreateUser = (req: Request) => Promise<{ id: string } | null>;

// Cache the Groq client at module scope (created once when GROQ_API_KEY is available)
const groqClient = process.env.GROQ_API_KEY
  ? createGroq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const CHAT_MODEL = "llama-3.3-70b-versatile";

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

  // POST /api/ai/generate-image – placeholder (image generation deferred)
  router.post("/generate-image", (_req: Request, res: Response) => {
    return res.status(501).json({
      error:
        "Image generation is not yet implemented. It requires Together AI or a self-hosted image generation service.",
    });
  });

  // POST /api/ai/generate-background – placeholder (image generation deferred)
  router.post("/generate-background", (_req: Request, res: Response) => {
    return res.status(501).json({
      error:
        "Background generation is not yet implemented. It requires Together AI or a self-hosted image generation service.",
    });
  });

  return router;
}
