import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolvePooledDatabaseUrl } from "./env";

// Prisma ORM 7 requires an explicit driver adapter at runtime (the schema.prisma
// datasource block no longer carries a connection string). We use the POOLED
// connection string here since this is the client used to serve normal
// application requests; `prisma.config.ts` uses the direct (non-pooled)
// connection separately for CLI commands like `db push`.
//
// The pooled connection string's env var name is not fixed: different Postgres
// provisioning integrations on Vercel set different names (DATABASE_URL,
// POSTGRES_URL, or POSTGRES_PRISMA_URL). resolvePooledDatabaseUrl() in
// src/lib/env.ts tries them in that order (see that file for the full
// fallback chain, including how it guards against Accelerate proxy URLs).

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const { url: connectionString } = resolvePooledDatabaseUrl();
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// findFirst による事前の重複チェックは、同時に2件送信された場合の競合を防げない
// （両方がチェックを通過してから書き込むレースがある）。@@unique 制約に実際に
// ぶつかった場合の最終防衛として、サーバーアクション側でこれを使い P2002 を
// ユーザー向けのエラーメッセージに変換する。
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
