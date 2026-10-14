import { PrismaClient } from "@prisma/client";
import { createDatabaseAdapter } from "@/lib/db-config";

const databaseConfig = createDatabaseAdapter();

// biar gak bikin instance baru tiap hot-reload pas dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const client =
    process.env.NODE_ENV === "development"
      ? new PrismaClient({
          adapter: databaseConfig.adapter,
          log: [
            { emit: "event", level: "error" },
            { emit: "stdout", level: "warn" },
          ],
        })
      : new PrismaClient({
          adapter: databaseConfig.adapter,
          log: [{ emit: "event", level: "error" }],
        });

  client.$on("error", (event) => {
    console.error("[db] Prisma error", {
      message: event.message,
      host: databaseConfig.host,
      database: databaseConfig.database,
      sslEnabled: databaseConfig.sslEnabled,
    });
  });

  return client;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;