// Prisma ORM 7 configuration file.
// Used by the Prisma CLI (generate / db push / studio, etc). The connection here
// uses the DIRECT (non-pooled) connection string, since DDL operations like
// `db push` don't work reliably through a transaction-mode pooler.
// The app itself connects separately at runtime via a driver adapter using the
// POOLED connection string — see src/lib/prisma.ts.
//
// The direct connection string's env var name is not fixed: different Postgres
// provisioning integrations on Vercel set different names (POSTGRES_URL_NON_POOLING,
// POSTGRES_URL, or DATABASE_URL). resolveDirectDatabaseUrl() in src/lib/env.ts
// tries them in that order so this config keeps working regardless of which
// integration provisioned the database.
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDirectDatabaseUrl } from "./src/lib/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDirectDatabaseUrl().url,
  },
});
