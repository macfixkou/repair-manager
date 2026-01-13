import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function withPgbouncerSafeUrl(rawUrl?: string) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (url.host.includes("pooler.supabase.com")) {
      url.searchParams.set("pgbouncer", "true");
      url.searchParams.set("statement_cache_size", "0");
      url.searchParams.set("sslmode", url.searchParams.get("sslmode") ?? "require");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const datasourceUrl = withPgbouncerSafeUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
