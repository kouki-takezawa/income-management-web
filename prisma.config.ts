// Prisma ORM 7 configuration file.
// Used by the Prisma CLI (generate / db push / studio, etc). The connection here
// uses the DIRECT (non-pooled) connection string, since DDL operations like
// `db push` don't work reliably through a transaction-mode pooler.
// The app itself connects separately at runtime via a driver adapter using the
// POOLED connection string — see src/lib/prisma.ts.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("POSTGRES_URL_NON_POOLING"),
  },
});
