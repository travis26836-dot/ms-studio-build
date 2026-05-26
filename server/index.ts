import express from "express";
import { createServer } from "http";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { clerkMiddleware } from "@clerk/express";
import { getPrisma } from "./db.js";
import { createAiRouter } from "./ai.js";
import {
  filterStockAssets,
  getFallbackStockAssets,
  getCustomAssetSource,
  mapDbStockAsset,
  renderGeneratedStockAssetSvg,
} from "./stockAssets.js";

process.on("unhandledRejection", reason => {
  console.error("Unhandled promise rejection", reason);
});

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

type RequestIdentity = {
  id: string;
  email?: string;
};

type MemoryProject = {
  id: string;
  name: string;
  canvasState: ReturnType<typeof buildCanvasState>;
  createdAt: Date;
  updatedAt: Date;
};

const memoryProjectsByUser = new Map<string, Map<string, MemoryProject>>();

const PORTAL_CONTENT_KIND = "customer-portal-content";
const PORTAL_PROJECT_KIND = "customer-portal-project";
const MEMORY_CUSTOMER_PREFIX = "memory:";

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
    ...(typeof input.thumbnailUrl === "string"
      ? { thumbnailUrl: input.thumbnailUrl }
      : {}),
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
      canvasData:
        typeof state.canvasData === "string" ? state.canvasData : undefined,
      canvasWidth:
        typeof state.canvasWidth === "number" ? state.canvasWidth : undefined,
      canvasHeight:
        typeof state.canvasHeight === "number" ? state.canvasHeight : undefined,
      thumbnailUrl:
        typeof state.thumbnailUrl === "string" ? state.thumbnailUrl : undefined,
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
        .map(item => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function buildPortalProjectState(input: { slug?: string }) {
  return {
    kind: PORTAL_PROJECT_KIND,
    ...(typeof input.slug === "string" && input.slug.trim()
      ? { slug: slugify(input.slug) }
      : {}),
  };
}

function buildPortalContentState(input: {
  content: string;
  projectId: string;
  slug?: string;
  tags?: string[];
}) {
  return {
    kind: PORTAL_CONTENT_KIND,
    content: input.content,
    projectId: input.projectId,
    ...(typeof input.slug === "string" && input.slug.trim()
      ? { slug: slugify(input.slug) }
      : {}),
    ...(Array.isArray(input.tags) && input.tags.length > 0
      ? { tags: normalizeTags(input.tags) }
      : {}),
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
    projectId:
      typeof state.projectId === "string" ? state.projectId : undefined,
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
  const parsedCanvas =
    typeof rawCanvasData === "string"
      ? safeParseJson(rawCanvasData)
      : rawCanvasData;

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

async function getPortalCustomer(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  customerId: string
) {
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

function getRequestIdentity(req: express.Request): RequestIdentity | null {
  const clerkIdFromAuth = (
    req as express.Request & { auth?: { userId?: string } }
  ).auth?.userId;
  const clerkHeader = req.header("x-user-clerk-id");
  const emailHeader = req.header("x-user-email");

  const clerkId =
    typeof clerkIdFromAuth === "string" && clerkIdFromAuth.trim()
      ? clerkIdFromAuth.trim()
      : typeof clerkHeader === "string" && clerkHeader.trim()
        ? clerkHeader.trim()
        : null;

  const email =
    typeof emailHeader === "string" && emailHeader.trim()
      ? normalizeEmail(emailHeader)
      : undefined;

  if (!clerkId && !email) {
    return null;
  }

  return {
    id: clerkId ?? `email:${email}`,
    email,
  };
}

function getGuestIdentity(req: express.Request): RequestIdentity {
  const ip = req.ip || "unknown";
  const userAgent = req.header("user-agent") || "unknown";
  const basis = `${ip}:${userAgent.slice(0, 120)}`;

  return {
    id: `guest:${Buffer.from(basis).toString("base64url")}`,
  };
}

function getMemoryProjects(identity: RequestIdentity) {
  const existing = memoryProjectsByUser.get(identity.id);
  if (existing) {
    return existing;
  }

  const created = new Map<string, MemoryProject>();
  memoryProjectsByUser.set(identity.id, created);
  return created;
}

function memoryProjectToClientShape(project: MemoryProject) {
  return {
    id: project.id,
    name: project.name,
    canvasData: project.canvasState.canvasData,
    canvasWidth: project.canvasState.canvasWidth,
    canvasHeight: project.canvasState.canvasHeight,
    thumbnailUrl: project.canvasState.thumbnailUrl,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    canvasState: safeParseJson(project.canvasState.canvasData),
  };
}

function createMemoryProjectId() {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeMemoryCustomerId(identityId: string) {
  return `${MEMORY_CUSTOMER_PREFIX}${encodeURIComponent(identityId)}`;
}

function parseMemoryCustomerId(raw: string) {
  if (!raw.startsWith(MEMORY_CUSTOMER_PREFIX)) {
    return null;
  }

  const encodedIdentity = raw.slice(MEMORY_CUSTOMER_PREFIX.length);
  if (!encodedIdentity) {
    return null;
  }

  try {
    return decodeURIComponent(encodedIdentity);
  } catch {
    return null;
  }
}

function buildMemoryCustomer(input: {
  email?: string;
  name?: string;
  clerkId?: string;
}) {
  const normalizedEmail =
    typeof input.email === "string" && input.email.trim()
      ? normalizeEmail(input.email)
      : null;
  const normalizedClerkId =
    typeof input.clerkId === "string" && input.clerkId.trim()
      ? input.clerkId.trim()
      : null;
  const normalizedName =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim()
      : "";

  const identityId =
    normalizedClerkId ?? (normalizedEmail ? `email:${normalizedEmail}` : null);
  if (!identityId) {
    return null;
  }

  return {
    id: makeMemoryCustomerId(identityId),
    userId: identityId,
    email: normalizedEmail ?? `${identityId}@portal.local`,
    name: normalizedName || "Portal User",
    plan: "free",
  };
}

async function resolvePortalCustomer(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  input: {
    customerId?: string;
    email?: string;
    name?: string;
    clerkId?: string;
  }
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
  const hasClerkId = typeof input.clerkId === "string" && input.clerkId.trim();

  if (hasClerkId) {
    const clerkId = input.clerkId!.trim();
    const preferredName =
      typeof input.name === "string" && input.name.trim()
        ? input.name.trim()
        : "";
    const normalizedEmail = hasEmail
      ? normalizeEmail(input.email as string)
      : null;

    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
      include: { customer: true },
    });

    if (existingUser?.customer) {
      const shouldUpdateUserEmail =
        !!normalizedEmail && existingUser.email !== normalizedEmail;
      const shouldUpdateCustomer =
        (!!normalizedEmail &&
          existingUser.customer.email !== normalizedEmail) ||
        (!!preferredName && existingUser.customer.name !== preferredName);

      if (shouldUpdateUserEmail || shouldUpdateCustomer) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ...(shouldUpdateUserEmail ? { email: normalizedEmail! } : {}),
            ...(shouldUpdateCustomer
              ? {
                  customer: {
                    update: {
                      ...(normalizedEmail ? { email: normalizedEmail } : {}),
                      ...(preferredName ? { name: preferredName } : {}),
                    },
                  },
                }
              : {}),
          },
          include: { customer: true },
        });

        return updatedUser.customer;
      }

      return existingUser.customer;
    }
  }

  if (!hasEmail) {
    return null;
  }

  const email = normalizeEmail(input.email as string);
  const preferredName =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim()
      : "";

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
  let prisma: Awaited<ReturnType<typeof getPrisma>>;

  try {
    prisma = await getPrisma();
  } catch (error) {
    console.error(
      "Failed to initialize Prisma client in getOrCreateUser",
      error
    );
    return null;
  }
  const clerkIdFromAuth = (
    req as express.Request & { auth?: { userId?: string } }
  ).auth?.userId;
  const fallbackClerkIdHeader = req.header("x-user-clerk-id");
  const fallbackClerkId =
    typeof fallbackClerkIdHeader === "string" && fallbackClerkIdHeader.trim()
      ? fallbackClerkIdHeader.trim()
      : null;
  const clerkId = clerkIdFromAuth ?? fallbackClerkId;

  const headerEmailValue = req.header("x-user-email");
  const headerEmail =
    typeof headerEmailValue === "string" && headerEmailValue.trim()
      ? normalizeEmail(headerEmailValue)
      : null;

  try {
    if (clerkId) {
      const existingByClerkId = await prisma.user.findUnique({
        where: { clerkId },
        include: { customer: true },
      });

      if (existingByClerkId) {
        if (headerEmail && existingByClerkId.email !== headerEmail) {
          return prisma.user.update({
            where: { id: existingByClerkId.id },
            data: {
              email: headerEmail,
              customer: existingByClerkId.customer
                ? {
                    update: {
                      email: headerEmail,
                    },
                  }
                : undefined,
            },
            include: { customer: true },
          });
        }

        return existingByClerkId;
      }
    }

    if (headerEmail) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: headerEmail },
        include: { customer: true },
      });

      if (existingByEmail) {
        if (clerkId && existingByEmail.clerkId !== clerkId) {
          return prisma.user.update({
            where: { id: existingByEmail.id },
            data: { clerkId },
            include: { customer: true },
          });
        }

        return existingByEmail;
      }
    }

    if (!clerkId) {
      if (!headerEmail) {
        return null;
      }

      return prisma.user.upsert({
        where: { email: headerEmail },
        update: {},
        create: {
          email: headerEmail,
          clerkId: fallbackClerkId
            ? `fallback:${fallbackClerkId}`
            : `fallback:${headerEmail}`,
          customer: {
            create: {
              name: "",
              email: headerEmail,
              plan: "free",
            },
          },
        },
        include: {
          customer: true,
        },
      });
    }

    return prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        // Placeholder until Clerk webhook profile sync is added.
        email: headerEmail ?? `${clerkId}@placeholder.local`,
        customer: {
          create: {
            name: "",
            email: headerEmail ?? `${clerkId}@placeholder.local`,
            plan: "free",
          },
        },
      },
      include: {
        customer: true,
      },
    });
  } catch (error) {
    console.error("Database unavailable while resolving current user", error);
    return null;
  }
}

function toOrigin(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) {
    return null;
  }

  const value = raw.trim();

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedCorsOrigins(): Set<string> {
  const values = [
    process.env.APP_URL,
    process.env.VITE_MAIN_APP_URL,
    process.env.VITE_PORTAL_URL,
    process.env.CUSTOMER_PORTAL_URL,
    process.env.VITE_CUSTOMER_PORTAL_URL,
    ...(process.env.CORS_ORIGINS ?? "").split(","),
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
  ];

  const origins = new Set<string>();
  for (const value of values) {
    const normalized = toOrigin(value);
    if (normalized) {
      origins.add(normalized);
    }
  }

  return origins;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const allowedOrigins = getAllowedCorsOrigins();

  // Express 4 does not reliably forward async route errors.
  // Wrap async handlers so failed promises hit the error middleware.
  const appAny = app as any;
  for (const method of ["get", "post", "put", "delete", "patch"] as const) {
    const original = appAny[method].bind(app);
    appAny[method] = (path: any, ...handlers: any[]) => {
      const wrappedHandlers = handlers.map(handler => {
        if (typeof handler !== "function") {
          return handler;
        }

        if (handler.constructor.name !== "AsyncFunction") {
          return handler;
        }

        return (
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          Promise.resolve(
            (
              handler as (
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
              ) => Promise<unknown>
            )(req, res, next)
          ).catch(next);
        };
      });

      return original(path, ...(wrappedHandlers as []));
    };
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isAllowedOrigin =
      typeof origin === "string" && allowedOrigins.has(origin);

    if (isAllowedOrigin && typeof origin === "string") {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-user-email, x-user-clerk-id, x-ms-studio-client-id"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
      );

      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
    }

    if (req.method === "OPTIONS" && typeof origin === "string") {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }

    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use((req, res, next) => {
    if (!process.env.CLERK_SECRET_KEY) {
      next();
      return;
    }

    clerkMiddleware()(req, res, err => {
      if (err) {
        // In local/dev flows, allow header-based user fallback instead of hard-failing.
        console.warn("Clerk middleware warning", err);
      }
      next();
    });
  });

  app.get("/api/health", (_req, res) => {
    return res.json({ status: "ok" });
  });

  app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const prisma = await getPrisma();
    await prisma.contactSubmission.create({
      data: {
        name: name.trim().slice(0, 200),
        email: normalizeEmail(email).slice(0, 320),
        message: message.trim().slice(0, 5000),
      },
    });

    return res.status(201).json({ ok: true });
  });

  // Customer portal API
  app.post("/api/customer/resolve", async (req, res) => {
    const { customerId, email, name, clerkId } = req.body ?? {};

    const payload = {
      customerId: typeof customerId === "string" ? customerId : undefined,
      email: typeof email === "string" ? email : undefined,
      name: typeof name === "string" ? name : undefined,
      clerkId: typeof clerkId === "string" ? clerkId : undefined,
    };

    try {
      const prisma = await getPrisma();
      const customer = await resolvePortalCustomer(prisma, payload);

      if (customer) {
        return res.json(customer);
      }
    } catch (error) {
      console.warn(
        "Falling back to in-memory portal customer resolution",
        error
      );
    }

    const memoryCustomer = buildMemoryCustomer(payload);
    if (!memoryCustomer) {
      return res.status(400).json({ error: "Email is required" });
    }

    return res.json(memoryCustomer);
  });

  app.get("/api/customer/:id", async (_req, res) => {
    const prisma = await getPrisma();
    const customer = await getPortalCustomer(prisma, _req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(customer);
  });

  app.get("/api/customer/:id/designs", async (req, res) => {
    const memoryIdentityId = parseMemoryCustomerId(req.params.id);

    if (memoryIdentityId) {
      const memoryProjects = getMemoryProjects({ id: memoryIdentityId });
      const projects = Array.from(memoryProjects.values())
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .filter(project => !isPortalRecord(project.canvasState))
        .map(memoryProjectToClientShape);

      return res.json(projects);
    }

    try {
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
          .filter(
            (project: { canvasState: unknown }) =>
              !isPortalRecord(project.canvasState)
          )
          .map(projectToClientShape)
      );
    } catch (error) {
      console.error("Failed to load portal designs", error);
      return res.status(503).json({ error: "Unable to load designs" });
    }
  });

  app.delete("/api/customer/:id/designs/:designId", async (req, res) => {
    const memoryIdentityId = parseMemoryCustomerId(req.params.id);

    if (memoryIdentityId) {
      const memoryProjects = getMemoryProjects({ id: memoryIdentityId });
      const project = memoryProjects.get(req.params.designId);

      if (!project || isPortalRecord(project.canvasState)) {
        return res.status(404).json({ error: "Not found" });
      }

      memoryProjects.delete(project.id);
      return res.status(204).end();
    }

    try {
      const prisma = await getPrisma();
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id },
      });

      if (!customer) {
        return res.status(404).json({ error: "Not found" });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: req.params.designId,
          userId: customer.userId,
        },
        select: { id: true, canvasState: true },
      });

      if (!project || isPortalRecord(project.canvasState)) {
        return res.status(404).json({ error: "Not found" });
      }

      await prisma.project.delete({ where: { id: project.id } });
      return res.status(204).end();
    } catch (error) {
      console.error("Failed to delete portal design", error);
      return res.status(503).json({ error: "Unable to delete design" });
    }
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

    const projectId =
      typeof req.query.projectId === "string" ? req.query.projectId : undefined;

    return res.json(
      projects
        .filter((project: { canvasState: unknown }) =>
          isPortalContentState(project.canvasState)
        )
        .map(portalContentToClientShape)
        .filter((item: { projectId?: string }) =>
          projectId ? item.projectId === projectId : true
        )
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
        .filter((project: { canvasState: unknown }) =>
          isPortalProjectState(project.canvasState)
        )
        .map(portalProjectToClientShape)
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
        canvasState: buildPortalProjectState({
          slug: typeof slug === "string" ? slug : name,
        }),
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
        name:
          typeof name === "string" && name.trim() ? name.trim() : existing.name,
        canvasState: buildPortalProjectState({
          slug:
            typeof slug === "string"
              ? slug
              : (currentState.slug ?? existing.name),
        }),
      },
    });

    return res.json(portalProjectToClientShape(updated));
  });

  app.delete(
    "/api/customer/:id/portal/projects/:projectId",
    async (req, res) => {
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
          project.id === req.params.projectId &&
          isPortalProjectState(project.canvasState)
      );

      if (!portalProject) {
        return res.status(404).json({ error: "Not found" });
      }

      const linkedContentIds = allProjects
        .filter((project: { canvasState: unknown }) =>
          isPortalContentState(project.canvasState)
        )
        .filter((project: { canvasState: unknown }) => {
          const state = normalizePortalContentState(project.canvasState);
          return state.projectId === portalProject.id;
        })
        .map((project: { id: string }) => project.id);

      if (linkedContentIds.length > 0) {
        await prisma.project.deleteMany({
          where: { id: { in: linkedContentIds } },
        });
      }

      await prisma.project.delete({ where: { id: portalProject.id } });
      return res.status(204).end();
    }
  );

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
        project.id === projectId && isPortalProjectState(project.canvasState)
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
    const nextContent =
      typeof content === "string" ? content : currentState.content;

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
          project.id === projectId && isPortalProjectState(project.canvasState)
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
        name:
          typeof name === "string" && name.trim() ? name.trim() : existing.name,
        canvasState: buildPortalContentState({
          content: nextContent,
          projectId: nextProjectId,
          slug:
            typeof slug === "string"
              ? slug
              : (currentState.slug ??
                (typeof name === "string" && name.trim()
                  ? name
                  : existing.name)),
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
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.json({ plan: "free", subscription: null });
    }

    const prisma = await getPrisma();
    const sub = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    return res.json({ plan: user.customer?.plan ?? "free", subscription: sub });
  });

  app.get("/api/generated-stock-assets/:assetId.svg", (req, res) => {
    const assetId =
      typeof req.params.assetId === "string" ? req.params.assetId : "";
    const variant = req.query.variant === "thumb" ? "thumb" : "full";
    const svg = renderGeneratedStockAssetSvg(assetId, variant);

    if (!svg) {
      return res.status(404).json({ error: "Generated asset not found." });
    }

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(svg);
  });

  app.get("/api/stock-assets", async (req, res) => {
    const query =
      typeof req.query.query === "string" ? req.query.query : undefined;
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const mediaType =
      typeof req.query.mediaType === "string" ? req.query.mediaType : undefined;
    const orientation =
      typeof req.query.orientation === "string"
        ? req.query.orientation
        : undefined;
    const color =
      typeof req.query.color === "string" ? req.query.color : undefined;
    const license =
      typeof req.query.license === "string" ? req.query.license : undefined;
    const recent = req.query.recent === "true";
    const forwardedProto = req.header("x-forwarded-proto");
    const protocol =
      typeof forwardedProto === "string" && forwardedProto.trim()
        ? forwardedProto.split(",")[0].trim()
        : req.protocol;
    const host = req.get("host");
    const baseUrl = host ? `${protocol}://${host}` : undefined;

    try {
      const prisma = await getPrisma();
      const dbAssets = await prisma.stockAsset.findMany({
        orderBy: { createdAt: "desc" },
      });
      const mappedDbAssets = dbAssets.map(
        (asset: Parameters<typeof mapDbStockAsset>[0]) =>
          mapDbStockAsset(asset, baseUrl)
      );
      const mappedAssets =
        dbAssets.length > 0
          ? [
              ...mappedDbAssets,
              ...getFallbackStockAssets(baseUrl).filter(
                asset => asset.source !== getCustomAssetSource()
              ),
            ]
          : getFallbackStockAssets(baseUrl);

      return res.json(
        filterStockAssets(mappedAssets, {
          query,
          category,
          mediaType,
          orientation,
          color,
          license,
          recent,
        })
      );
    } catch (error) {
      console.error("Failed to load stock assets from the database", error);
      return res.json(
        filterStockAssets(getFallbackStockAssets(baseUrl), {
          query,
          category,
          mediaType,
          orientation,
          color,
          license,
          recent,
        })
      );
    }
  });

  // ── Unsplash API proxy ──────────────────────────────────────────────────────
  // Proxies requests to api.unsplash.com so the access key stays server-side.
  // Unsplash requires attribution: we forward photographer info to the client.
  app.get("/api/unsplash/search", async (req, res) => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.status(503).json({
        error:
          "Unsplash not configured. Set UNSPLASH_ACCESS_KEY in your environment.",
      });
    }

    const query =
      typeof req.query.query === "string" && req.query.query.trim()
        ? req.query.query.trim()
        : "nature";
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) || 1 : 1;
    const perPage = 20;
    const orientation =
      typeof req.query.orientation === "string" && req.query.orientation
        ? req.query.orientation
        : undefined;
    const color =
      typeof req.query.color === "string" && req.query.color
        ? req.query.color
        : undefined;

    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(perPage),
    });
    if (orientation && ["landscape", "portrait", "squarish"].includes(orientation)) {
      params.set("orientation", orientation === "square" ? "squarish" : orientation);
    }
    if (color) {
      params.set("color", color);
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?${params.toString()}`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            "Accept-Version": "v1",
          },
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error("Unsplash API error:", response.status, body);
        return res.status(response.status).json({ error: "Unsplash API error" });
      }

      const data = (await response.json()) as {
        total: number;
        total_pages: number;
        results: Array<{
          id: string;
          description?: string;
          alt_description?: string;
          urls: { regular: string; small: string; thumb: string };
          links: { html: string; download_location: string };
          user: {
            name: string;
            username: string;
            links: { html: string };
          };
          width: number;
          height: number;
        }>;
      };

      const photos = data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.small,
        alt: photo.alt_description || photo.description || "Unsplash photo",
        source: "Unsplash" as const,
        sourceUrl: photo.links.html,
        downloadLocation: photo.links.download_location,
        photographer: photo.user.name,
        photographerUsername: photo.user.username,
        photographerUrl: `${photo.user.links.html}?utm_source=ms_studio&utm_medium=referral`,
        unsplashUrl: `${photo.links.html}?utm_source=ms_studio&utm_medium=referral`,
        license: "Unsplash License",
        licenseUrl: "https://unsplash.com/license",
        attributionRequired: false,
        commercialUse: true,
        orientation:
          photo.width > photo.height
            ? ("landscape" as const)
            : photo.width < photo.height
              ? ("portrait" as const)
              : ("square" as const),
      }));

      return res.json({
        photos,
        total: data.total,
        totalPages: data.total_pages,
        page,
        perPage,
      });
    } catch (err) {
      console.error("Unsplash fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch from Unsplash" });
    }
  });

  // Unsplash requires apps to trigger the download endpoint when a user
  // "downloads" (uses) a photo. This endpoint proxies that trigger.
  app.post("/api/unsplash/download-trigger", async (req, res) => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return res.json({ ok: false });

    const { downloadLocation } = req.body as { downloadLocation?: string };
    if (!downloadLocation) return res.json({ ok: false });

    try {
      // Validate URL to prevent SSRF attacks - only allow Unsplash domains
      const url = new URL(downloadLocation);
      const allowedHosts = ["api.unsplash.com"];
      if (!allowedHosts.includes(url.hostname)) {
        return res.json({ ok: false });
      }

      await fetch(downloadLocation, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      });
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: false });
    }
  });

  app.get("/api/projects", async (req, res) => {
    const identity = getRequestIdentity(req) ?? getGuestIdentity(req);
    const user = await getOrCreateUser(req);

    if (!user) {
      const memoryProjects = getMemoryProjects(identity);
      const projects = Array.from(memoryProjects.values()).sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      return res.json(projects.map(memoryProjectToClientShape));
    }

    const prisma = await getPrisma();

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(
      projects
        .filter(
          (project: { canvasState: unknown }) =>
            !isPortalRecord(project.canvasState)
        )
        .map(projectToClientShape)
    );
  });

  app.get("/api/projects/:id", async (req, res) => {
    const identity = getRequestIdentity(req) ?? getGuestIdentity(req);
    const user = await getOrCreateUser(req);

    if (!user) {
      const memoryProjects = getMemoryProjects(identity);
      const project = memoryProjects.get(req.params.id);

      if (!project) {
        return res.status(404).json({ error: "Not found" });
      }

      return res.json(memoryProjectToClientShape(project));
    }

    const prisma = await getPrisma();

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
    const identity = getRequestIdentity(req) ?? getGuestIdentity(req);
    const user = await getOrCreateUser(req);

    const { name, canvasData, canvasWidth, canvasHeight, thumbnailUrl } =
      req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!canvasData || typeof canvasData !== "string") {
      return res.status(400).json({ error: "canvasData is required" });
    }

    if (!user) {
      const now = new Date();
      const project: MemoryProject = {
        id: createMemoryProjectId(),
        name,
        canvasState: buildCanvasState({
          canvasData,
          canvasWidth: typeof canvasWidth === "number" ? canvasWidth : 1080,
          canvasHeight: typeof canvasHeight === "number" ? canvasHeight : 1080,
          thumbnailUrl,
        }),
        createdAt: now,
        updatedAt: now,
      };

      getMemoryProjects(identity).set(project.id, project);
      return res.status(201).json(memoryProjectToClientShape(project));
    }

    const prisma = await getPrisma();

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
    const identity = getRequestIdentity(req) ?? getGuestIdentity(req);
    const user = await getOrCreateUser(req);

    if (!user) {
      const memoryProjects = getMemoryProjects(identity);
      const existing = memoryProjects.get(req.params.id);

      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }

      const { canvasData, thumbnailUrl, name } = req.body;
      const nextCanvasData =
        typeof canvasData === "string"
          ? canvasData
          : existing.canvasState.canvasData;

      if (!nextCanvasData) {
        return res.status(400).json({ error: "canvasData is required" });
      }

      const updated: MemoryProject = {
        ...existing,
        name: typeof name === "string" && name.trim() ? name : existing.name,
        canvasState: buildCanvasState({
          canvasData: nextCanvasData,
          canvasWidth: existing.canvasState.canvasWidth,
          canvasHeight: existing.canvasState.canvasHeight,
          thumbnailUrl:
            typeof thumbnailUrl === "string"
              ? thumbnailUrl
              : existing.canvasState.thumbnailUrl,
        }),
        updatedAt: new Date(),
      };

      memoryProjects.set(existing.id, updated);
      return res.json(memoryProjectToClientShape(updated));
    }

    const prisma = await getPrisma();

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
    const nextCanvasData =
      typeof canvasData === "string" ? canvasData : prev.canvasData;

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
          thumbnailUrl:
            typeof thumbnailUrl === "string" ? thumbnailUrl : prev.thumbnailUrl,
        }),
      },
    });

    return res.json(projectToClientShape(updated));
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const identity = getRequestIdentity(req) ?? getGuestIdentity(req);
    const user = await getOrCreateUser(req);

    if (!user) {
      const memoryProjects = getMemoryProjects(identity);
      if (!memoryProjects.has(req.params.id)) {
        return res.status(404).json({ error: "Not found" });
      }

      memoryProjects.delete(req.params.id);
      return res.status(204).end();
    }

    const prisma = await getPrisma();

    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      select: { id: true, canvasState: true },
    });

    if (!existing || isPortalRecord(existing.canvasState)) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.project.delete({ where: { id: existing.id } });
    return res.status(204).end();
  });

  // AI routes
  app.use("/api/ai", createAiRouter({ resolveUser: getOrCreateUser }));

  app.use("/api", (_req, res) => {
    return res.status(404).json({ error: "Not found" });
  });

  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("API route error", error);

      if (res.headersSent) {
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Internal server error";
      const isApiRoute = req.path.startsWith("/api/");

      if (isApiRoute) {
        res.status(500).json({ error: message });
        return;
      }

      res.status(500).send("Internal Server Error");
    }
  );

  // Serve SPA assets when they exist. In API-only dev mode these files may not be built.
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");
  const indexHtmlPath = path.join(staticPath, "index.html");
  const canServeSpa = existsSync(indexHtmlPath);

  if (canServeSpa) {
    app.use(express.static(staticPath));
  }

  // Handle client-side routing - serve index.html for all non-API routes.
  // Explicitly reject unmatched /api/* paths so they never receive SPA HTML.
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (canServeSpa) {
      res.sendFile(indexHtmlPath);
      return;
    }

    if (req.path === "/") {
      res
        .status(200)
        .type("text/plain")
        .send(
          "API server is running. Frontend build not found (dist/public/index.html). Run `pnpm dev` for Vite or `pnpm build` to generate static assets."
        );
      return;
    }

    res.status(404).type("text/plain").send("Not found");
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
