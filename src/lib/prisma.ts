import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma ORM 7 requires an explicit driver adapter at runtime (the schema.prisma
// datasource block no longer carries a connection string). We use the POOLED
// Vercel Postgres connection string here (POSTGRES_PRISMA_URL) since this is the
// client used to serve normal application requests; `prisma.config.ts` uses the
// direct (non-pooled) connection separately for CLI commands like `db push`.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_PRISMA_URL が設定されていません。Vercel の環境変数、または .env.local を確認してください。"
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
