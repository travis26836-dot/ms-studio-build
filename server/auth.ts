import type { Request } from "express";
import { getPrisma } from "./db.js";

export async function getOrCreateUser(req: Request) {
  const prisma = await getPrisma();
  const clerkId = (req as any).auth?.userId;
  if (!clerkId) return null;
  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      email: "", // populate from Clerk webhook on user.created if needed
      customer: { create: { name: "", email: "", plan: "free" } },
    },
  });
}
