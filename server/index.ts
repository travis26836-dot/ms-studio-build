import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { getPrisma } from "./db.js";
import { createAiRouter } from "./ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type CanvasStateRecord = {
  canvasData?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  thumbnailUrl?: string;
};

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function normalizeCanvasState(raw: unknown): CanvasStateRecord {
  if (typeof raw === "string") {
    return { canvasData: raw };
  }

  if (raw && typeof raw === "object") {
    const state = raw as CanvasStateRecord;
    return {
      canvasData: typeof state.canvasData === "string" ? state.canvasData : undefined,
      canvasWidth: typeof state.canvasWidth === "number" ? state.canvasWidth : undefined,
      canvasHeight: typeof state.canvasHeight === "number" ? state.canvasHeight : undefined,
      thumbnailUrl: typeof state.thumbnailUrl === "string" ? state.thumbnailUrl : undefined,
    };
  }

  return {};
}

function projectToClientShape(project: {
  id: string;
  name: string;
  canvasState: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  const normalized = normalizeCanvasState(project.canvasState);
  const rawCanvasData = normalized.canvasData;
  const parsedCanvas = typeof rawCanvasData === "string" ? safeParseJson(rawCanvasData) : rawCanvasData;

  return {
    id: project.id,
    name: project.name,
    canvasData: rawCanvasData ?? "",
    canvasWidth: normalized.canvasWidth ?? 1080,
    canvasHeight: normalized.canvasHeight ?? 1080,
    thumbnailUrl: normalized.thumbnailUrl,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    canvasState: parsedCanvas,
  };
}

async function getOrCreateUser(req: express.Request) {
  const prisma = await getPrisma();
  const clerkId = (req as express.Request & { auth?: { userId?: string } }).auth?.userId;

  if (!clerkId) return null;

  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      // Placeholder until Clerk webhook profile sync is added.
      email: `${clerkId}@placeholder.local`,
      customer: {
        create: {
          name: "",
          email: `${clerkId}@placeholder.local`,
          plan: "free",
        },
      },
    },
    include: {
      customer: true,
    },
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());
  app.use(ClerkExpressWithAuth());

  // Customer portal API
  app.get("/api/customer/:id", async (_req, res) => {
    const prisma = await getPrisma();
    const customer = await prisma.customer.findFirst({
      orderBy: { id: "asc" },
    });

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(customer);
  });

  app.get("/api/subscription/status", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    return res.json({ plan: user.customer?.plan ?? "free", subscription: sub });
  });

  app.get("/api/projects", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(projects.map(projectToClientShape));
  });

  app.get("/api/projects/:id", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(projectToClientShape(project));
  });

  app.post("/api/projects", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, canvasData, canvasWidth, canvasHeight, thumbnailUrl } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!canvasData || typeof canvasData !== "string") {
      return res.status(400).json({ error: "canvasData is required" });
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        canvasState: {
          canvasData,
          canvasWidth: typeof canvasWidth === "number" ? canvasWidth : 1080,
          canvasHeight: typeof canvasHeight === "number" ? canvasHeight : 1080,
          thumbnailUrl: typeof thumbnailUrl === "string" ? thumbnailUrl : undefined,
        },
      },
    });

    return res.status(201).json(projectToClientShape(project));
  });

  app.put("/api/projects/:id", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const prev = normalizeCanvasState(existing.canvasState);
    const { canvasData, thumbnailUrl, name } = req.body;
    const nextCanvasData = typeof canvasData === "string" ? canvasData : prev.canvasData;

    if (!nextCanvasData) {
      return res.status(400).json({ error: "canvasData is required" });
    }

    const updated = await prisma.project.update({
      where: { id: existing.id },
      data: {
        name: typeof name === "string" && name.trim() ? name : existing.name,
        canvasState: {
          canvasData: nextCanvasData,
          canvasWidth: prev.canvasWidth ?? 1080,
          canvasHeight: prev.canvasHeight ?? 1080,
          thumbnailUrl: typeof thumbnailUrl === "string" ? thumbnailUrl : prev.thumbnailUrl,
        },
      },
    });

    return res.json(projectToClientShape(updated));
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.project.delete({ where: { id: existing.id } });
    return res.status(204).end();
  });

  // AI routes
  app.use("/api/ai", createAiRouter(getOrCreateUser));

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
