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

type PortalContentStateRecord = {
  kind?: string;
  content?: string;
  projectId?: string;
  slug?: string;
  tags?: string[];
};

type PortalProjectStateRecord = {
  kind?: string;
  slug?: string;
};

const PORTAL_CONTENT_KIND = "customer-portal-content";
const PORTAL_PROJECT_KIND = "customer-portal-project";

function buildCanvasState(input: {
  canvasData: string;
  canvasWidth: number;
  canvasHeight: number;
  thumbnailUrl?: string;
}) {
  return {
    canvasData: input.canvasData,
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    ...(typeof input.thumbnailUrl === "string" ? { thumbnailUrl: input.thumbnailUrl } : {}),
  };
}

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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeTags(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      raw
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

function buildPortalProjectState(input: { slug?: string }) {
  return {
    kind: PORTAL_PROJECT_KIND,
    ...(typeof input.slug === "string" && input.slug.trim() ? { slug: slugify(input.slug) } : {}),
  };
}

function buildPortalContentState(input: { content: string; projectId: string; slug?: string; tags?: string[] }) {
  return {
    kind: PORTAL_CONTENT_KIND,
    content: input.content,
    projectId: input.projectId,
    ...(typeof input.slug === "string" && input.slug.trim() ? { slug: slugify(input.slug) } : {}),
    ...(Array.isArray(input.tags) && input.tags.length > 0 ? { tags: normalizeTags(input.tags) } : {}),
  };
}

function normalizePortalContentState(raw: unknown): PortalContentStateRecord {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const state = raw as PortalContentStateRecord;
  return {
    kind: typeof state.kind === "string" ? state.kind : undefined,
    content: typeof state.content === "string" ? state.content : undefined,
    projectId: typeof state.projectId === "string" ? state.projectId : undefined,
    slug: typeof state.slug === "string" ? state.slug : undefined,
    tags: normalizeTags(state.tags),
  };
}

function normalizePortalProjectState(raw: unknown): PortalProjectStateRecord {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const state = raw as PortalProjectStateRecord;
  return {
    kind: typeof state.kind === "string" ? state.kind : undefined,
    slug: typeof state.slug === "string" ? state.slug : undefined,
  };
}

function isPortalContentState(raw: unknown) {
  return normalizePortalContentState(raw).kind === PORTAL_CONTENT_KIND;
}

function isPortalProjectState(raw: unknown) {
  return normalizePortalProjectState(raw).kind === PORTAL_PROJECT_KIND;
}

function isPortalRecord(raw: unknown) {
  return isPortalProjectState(raw) || isPortalContentState(raw);
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

function portalContentToClientShape(project: {
  id: string;
  name: string;
  canvasState: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  const normalized = normalizePortalContentState(project.canvasState);

  return {
    id: project.id,
    name: project.name,
    content: normalized.content ?? "",
    projectId: normalized.projectId,
    slug: normalized.slug,
    tags: normalized.tags ?? [],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function portalProjectToClientShape(project: {
  id: string;
  name: string;
  canvasState: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  const normalized = normalizePortalProjectState(project.canvasState);

  return {
    id: project.id,
    name: project.name,
    slug: normalized.slug,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

async function getPortalCustomer(prisma: Awaited<ReturnType<typeof getPrisma>>, customerId: string) {
  const matchedCustomer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (matchedCustomer) {
    return matchedCustomer;
  }

  return prisma.customer.findFirst({
    orderBy: { id: "asc" },
  });
}

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

async function resolvePortalCustomer(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  input: { customerId?: string; email?: string; name?: string },
) {
  if (typeof input.customerId === "string" && input.customerId.trim()) {
    const existing = await prisma.customer.findUnique({
      where: { id: input.customerId.trim() },
    });

    if (existing) {
      return existing;
    }
  }

  const hasEmail = typeof input.email === "string" && input.email.trim();
  if (!hasEmail) {
    return null;
  }

  const email = normalizeEmail(input.email as string);
  const preferredName = typeof input.name === "string" && input.name.trim() ? input.name.trim() : "";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      clerkId: `portal:${email}`,
    },
  });

  const existingCustomer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  if (existingCustomer) {
    if (preferredName && existingCustomer.name !== preferredName) {
      return prisma.customer.update({
        where: { id: existingCustomer.id },
        data: { name: preferredName },
      });
    }

    return existingCustomer;
  }

  return prisma.customer.create({
    data: {
      userId: user.id,
      email,
      name: preferredName,
      plan: "free",
    },
  });
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
  app.post("/api/customer/resolve", async (req, res) => {
    const prisma = await getPrisma();
    const { customerId, email, name } = req.body ?? {};

    const customer = await resolvePortalCustomer(prisma, {
      customerId: typeof customerId === "string" ? customerId : undefined,
      email: typeof email === "string" ? email : undefined,
      name: typeof name === "string" ? name : undefined,
    });

    if (!customer) {
      return res.status(400).json({ error: "Email is required" });
    }

    return res.json(customer);
  });

  app.get("/api/customer/:id", async (_req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, _req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(customer);
  });

  app.get("/api/customer/:id/content", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const projects = await prisma.project.findMany({
      where: { userId: customer.userId },
      orderBy: { updatedAt: "desc" },
    });

    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;

    return res.json(
      projects
        .filter((project: { canvasState: unknown }) => isPortalContentState(project.canvasState))
        .map(portalContentToClientShape)
        .filter((item: { projectId?: string }) => (projectId ? item.projectId === projectId : true)),
    );
  });

  app.get("/api/customer/:id/portal/projects", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const projects = await prisma.project.findMany({
      where: { userId: customer.userId },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(
      projects
        .filter((project: { canvasState: unknown }) => isPortalProjectState(project.canvasState))
        .map(portalProjectToClientShape),
    );
  });

  app.post("/api/customer/:id/portal/projects", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const { name, slug } = req.body ?? {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = await prisma.project.create({
      data: {
        userId: customer.userId,
        name: name.trim(),
        canvasState: buildPortalProjectState({ slug: typeof slug === "string" ? slug : name }),
      },
    });

    return res.status(201).json(portalProjectToClientShape(project));
  });

  app.put("/api/customer/:id/portal/projects/:projectId", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.projectId,
        userId: customer.userId,
      },
    });

    if (!existing || !isPortalProjectState(existing.canvasState)) {
      return res.status(404).json({ error: "Not found" });
    }

    const currentState = normalizePortalProjectState(existing.canvasState);
    const { name, slug } = req.body ?? {};

    const updated = await prisma.project.update({
      where: { id: existing.id },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : existing.name,
        canvasState: buildPortalProjectState({
          slug: typeof slug === "string" ? slug : currentState.slug ?? existing.name,
        }),
      },
    });

    return res.json(portalProjectToClientShape(updated));
  });

  app.delete("/api/customer/:id/portal/projects/:projectId", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const allProjects = await prisma.project.findMany({
      where: { userId: customer.userId },
      orderBy: { updatedAt: "desc" },
    });

    const portalProject = allProjects.find(
      (project: { id: string; canvasState: unknown }) =>
        project.id === req.params.projectId && isPortalProjectState(project.canvasState),
    );

    if (!portalProject) {
      return res.status(404).json({ error: "Not found" });
    }

    const linkedContentIds = allProjects
      .filter((project: { canvasState: unknown }) => isPortalContentState(project.canvasState))
      .filter((project: { canvasState: unknown }) => {
        const state = normalizePortalContentState(project.canvasState);
        return state.projectId === portalProject.id;
      })
      .map((project: { id: string }) => project.id);

    if (linkedContentIds.length > 0) {
      await prisma.project.deleteMany({ where: { id: { in: linkedContentIds } } });
    }

    await prisma.project.delete({ where: { id: portalProject.id } });
    return res.status(204).end();
  });

  app.post("/api/customer/:id/content", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const { name, content, projectId, slug, tags } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ error: "projectId is required" });
    }

    const userProjects = await prisma.project.findMany({
      where: { userId: customer.userId },
      orderBy: { updatedAt: "desc" },
    });

    const container = userProjects.find(
      (project: { id: string; canvasState: unknown }) =>
        project.id === projectId && isPortalProjectState(project.canvasState),
    );

    if (!container) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await prisma.project.create({
      data: {
        userId: customer.userId,
        name: name.trim() || "Untitled Content",
        canvasState: buildPortalContentState({
          content,
          projectId: container.id,
          slug: typeof slug === "string" ? slug : name,
          tags: normalizeTags(tags),
        }),
      },
    });

    return res.status(201).json(portalContentToClientShape(project));
  });

  app.put("/api/customer/:id/content/:contentId", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.contentId,
        userId: customer.userId,
      },
    });

    if (!existing || !isPortalContentState(existing.canvasState)) {
      return res.status(404).json({ error: "Not found" });
    }

    const currentState = normalizePortalContentState(existing.canvasState);
    const { name, content, projectId, slug, tags } = req.body;
    const nextContent = typeof content === "string" ? content : currentState.content;

    if (typeof nextContent !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    let nextProjectId = currentState.projectId;
    if (typeof projectId === "string" && projectId.trim()) {
      const userProjects = await prisma.project.findMany({
        where: { userId: customer.userId },
        orderBy: { updatedAt: "desc" },
      });
      const container = userProjects.find(
        (project: { id: string; canvasState: unknown }) =>
          project.id === projectId && isPortalProjectState(project.canvasState),
      );
      if (!container) {
        return res.status(404).json({ error: "Project not found" });
      }
      nextProjectId = container.id;
    }

    if (!nextProjectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const updated = await prisma.project.update({
      where: { id: existing.id },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : existing.name,
        canvasState: buildPortalContentState({
          content: nextContent,
          projectId: nextProjectId,
          slug:
            typeof slug === "string"
              ? slug
              : currentState.slug ?? (typeof name === "string" && name.trim() ? name : existing.name),
          tags: Array.isArray(tags) ? normalizeTags(tags) : currentState.tags,
        }),
      },
    });

    return res.json(portalContentToClientShape(updated));
  });

  app.delete("/api/customer/:id/content/:contentId", async (req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.contentId,
        userId: customer.userId,
      },
      select: { id: true, canvasState: true },
    });

    if (!existing || !isPortalContentState(existing.canvasState)) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.project.delete({ where: { id: existing.id } });
    return res.status(204).end();
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

    return res.json(
      projects
        .filter((project: { canvasState: unknown }) => !isPortalRecord(project.canvasState))
        .map(projectToClientShape),
    );
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

    if (!project || isPortalRecord(project.canvasState)) {
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
        canvasState: buildCanvasState({
          canvasData,
          canvasWidth: typeof canvasWidth === "number" ? canvasWidth : 1080,
          canvasHeight: typeof canvasHeight === "number" ? canvasHeight : 1080,
          thumbnailUrl,
        }),
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

    if (!existing || isPortalRecord(existing.canvasState)) {
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
        canvasState: buildCanvasState({
          canvasData: nextCanvasData,
          canvasWidth: prev.canvasWidth ?? 1080,
          canvasHeight: prev.canvasHeight ?? 1080,
          thumbnailUrl: typeof thumbnailUrl === "string" ? thumbnailUrl : prev.thumbnailUrl,
        }),
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

    if (!existing || isPortalRecord(existing.canvasState)) {
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
