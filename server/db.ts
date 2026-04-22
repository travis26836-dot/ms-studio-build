type PrismaClientModule = typeof import("@prisma/client");
type PrismaAdapterModule = typeof import("@prisma/adapter-pg");
type PrismaClientInstance = InstanceType<PrismaClientModule["PrismaClient"]>;

const globalForPrisma = globalThis as unknown as {
  prismaPromise: Promise<PrismaClientInstance> | undefined;
};

async function createPrismaClient(): Promise<PrismaClientInstance> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg") as Promise<PrismaAdapterModule>,
    import("@prisma/client") as Promise<PrismaClientModule>,
  ]);

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export function getPrisma(): Promise<PrismaClientInstance> {
  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createPrismaClient();
  }

  return globalForPrisma.prismaPromise;
}