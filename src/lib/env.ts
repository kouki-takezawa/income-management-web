// src/lib/env.ts
//
// Centralized resolution of Postgres connection strings.
//
// Different ways of provisioning a Postgres database on Vercel set different
// env var names for the same thing:
//  - The classic "Vercel Postgres" (Neon) integration set POSTGRES_PRISMA_URL
//    (pooled) and POSTGRES_URL_NON_POOLING (direct/non-pooled).
//  - The Vercel Storage marketplace integration used to provision the current
//    database instead sets DATABASE_URL, POSTGRES_URL, and PRISMA_DATABASE_URL.
//    Neither POSTGRES_PRISMA_URL nor POSTGRES_URL_NON_POOLING is guaranteed to
//    exist in that setup.
//  - PRISMA_DATABASE_URL in particular is not guaranteed to be a plain
//    postgres connection string — it can be a `prisma+postgres://` Accelerate
//    proxy URL. That scheme is NOT usable with @prisma/adapter-pg (a plain
//    `pg`-driver adapter); it requires the @prisma/extension-accelerate
//    package and a different client setup entirely. We only ever use
//    PRISMA_DATABASE_URL as a last-resort fallback, and only after confirming
//    it actually starts with `postgres://` or `postgresql://`.
//
// Both prisma.config.ts (Prisma CLI — `prisma db push` during the Vercel
// build) and src/lib/prisma.ts (runtime PrismaClient via adapter-pg) resolve
// their connection string through the helpers below instead of reading a
// single hardcoded env var name, so a database provisioned through either
// integration style works without code changes.

const ACCELERATE_SCHEME = "prisma+postgres://";
const PLAIN_POSTGRES_SCHEMES = ["postgres://", "postgresql://"];

/** True if `value` is a plain postgres/postgresql connection string usable by a `pg`-based driver adapter. */
function isPlainPostgresUrl(value: string): boolean {
  return PLAIN_POSTGRES_SCHEMES.some((scheme) => value.startsWith(scheme));
}

/** True if `value` is a Prisma Accelerate proxy URL (`prisma+postgres://...`), unusable by @prisma/adapter-pg. */
function isAccelerateUrl(value: string): boolean {
  return value.startsWith(ACCELERATE_SCHEME);
}

interface Candidate {
  /** Env var name to read. */
  name: string;
  /**
   * Only accept this candidate's value if it passes this check. Defaults to
   * "not an Accelerate URL" (i.e. accept anything that looks like a normal
   * connection string). Used to require PRISMA_DATABASE_URL to positively
   * look like a plain postgres URL before it's ever used.
   */
  accept?: (value: string) => boolean;
}

interface ResolvedDatabaseUrl {
  url: string;
  /** Name of the env var the url was read from, for logging/debugging. */
  source: string;
}

function resolveFromCandidates(candidates: Candidate[]): ResolvedDatabaseUrl | undefined {
  for (const candidate of candidates) {
    const value = process.env[candidate.name];
    if (!value) continue;

    // Defensive net: no matter which var it came from, never hand back an
    // Accelerate proxy URL to a plain pg-driver connection.
    if (isAccelerateUrl(value)) continue;

    const accept = candidate.accept ?? (() => true);
    if (!accept(value)) continue;

    return { url: value, source: candidate.name };
  }
  return undefined;
}

function formatCheckedList(candidates: Candidate[]): string {
  return candidates
    .map((c) => (c.accept ? `${c.name} (only if it's a plain postgres:// URL)` : c.name))
    .join(", ");
}

/**
 * Resolves the connection string for the primary/pooled connection used by
 * the app at runtime via @prisma/adapter-pg.
 *
 * Fallback order: DATABASE_URL -> POSTGRES_URL -> POSTGRES_PRISMA_URL ->
 * PRISMA_DATABASE_URL (last resort, only if it's a plain postgres:// URL and
 * not a `prisma+postgres://` Accelerate proxy URL).
 */
export function resolvePooledDatabaseUrl(): ResolvedDatabaseUrl {
  const candidates: Candidate[] = [
    { name: "DATABASE_URL" },
    { name: "POSTGRES_URL" },
    { name: "POSTGRES_PRISMA_URL" },
    { name: "PRISMA_DATABASE_URL", accept: isPlainPostgresUrl },
  ];

  const resolved = resolveFromCandidates(candidates);
  if (!resolved) {
    throw new Error(
      "データベース接続文字列(プール接続用)が見つかりません。" +
        ` 次の環境変数を確認しましたが、いずれも未設定か使用できない形式でした: ${formatCheckedList(candidates)}.` +
        " Vercel の Project Settings > Environment Variables で Postgres インテグレーションが接続されているか、" +
        " ローカルでは .env.local に接続文字列が設定されているか確認してください。"
    );
  }
  return resolved;
}

/**
 * Resolves the connection string for the direct/non-pooled connection needed
 * by `prisma db push` during the Vercel build (DDL doesn't work reliably
 * through a transaction-mode pooler).
 *
 * Fallback order: POSTGRES_URL_NON_POOLING -> POSTGRES_URL -> DATABASE_URL.
 */
export function resolveDirectDatabaseUrl(): ResolvedDatabaseUrl {
  const candidates: Candidate[] = [
    { name: "POSTGRES_URL_NON_POOLING" },
    { name: "POSTGRES_URL" },
    { name: "DATABASE_URL" },
  ];

  const resolved = resolveFromCandidates(candidates);
  if (!resolved) {
    throw new Error(
      "データベース接続文字列(直接接続用)が見つかりません。" +
        ` 次の環境変数を確認しましたが、いずれも未設定か使用できない形式でした: ${formatCheckedList(candidates)}.` +
        " Vercel の Project Settings > Environment Variables で Postgres インテグレーションが接続されているか、" +
        " ローカルでは .env.local に接続文字列が設定されているか確認してください。"
    );
  }
  return resolved;
}
