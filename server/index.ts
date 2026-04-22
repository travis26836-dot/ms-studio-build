import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { getPrisma } from "./db.js";
import { createAiRouter } from "./ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    return res.json(projects);
  });

  app.post("/api/projects", async (req, res) => {
    const prisma = await getPrisma();
    const user = await getOrCreateUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, canvasState } = req.body;
    const project = await prisma.project.create({
      data: { userId: user.id, name, canvasState },
    });

    return res.status(201).json(project);
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
