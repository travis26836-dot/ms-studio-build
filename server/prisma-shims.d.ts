declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: unknown);
    [key: string]: any;
  }
}

declare module "@prisma/adapter-pg" {
  export class PrismaPg {
    constructor(options: { connectionString: string });
  }
}

declare module "dotenv/config" {}