import "dotenv/config";
import { hostname } from "node:os";
import { PrismaClient } from "@prisma/client";
import { createDatabaseAdapter } from "../lib/db-config";

export async function createVerifiedLocalClient() {
  const config = createDatabaseAdapter();
  if (
    !["127.0.0.1", "localhost", "::1"].includes(config.host) ||
    config.database !== "Studify" ||
    config.sslEnabled
  ) {
    throw new Error("Target bukan database lokal Studify yang diizinkan; tidak ada perubahan dijalankan.");
  }

  const client = new PrismaClient({ adapter: config.adapter, log: ["error"] });
  try {
    const identity = await client.$queryRaw<
      Array<{ databaseName: string | null; serverHost: string; serverPort: number }>
    >`SELECT DATABASE() AS databaseName, @@hostname AS serverHost, @@port AS serverPort`;
    const activeDatabase = identity[0];
    const machineName = hostname().toLowerCase();
    const serverName = activeDatabase?.serverHost?.toLowerCase();
    const localServer =
      serverName === "localhost" ||
      serverName === "127.0.0.1" ||
      serverName === machineName;
    if (activeDatabase) {
      console.log(
        `Non-secret target identity: configured ${config.host}/${config.database}; active ${activeDatabase.databaseName ?? "(none)"} on ${activeDatabase.serverHost}:${activeDatabase.serverPort}.`,
      );
    }
    if (
      !activeDatabase ||
      activeDatabase.databaseName?.toLowerCase() !== "studify" ||
      !localServer ||
      Number(activeDatabase.serverPort) !== Number(process.env.DB_PORT ?? 3306)
    ) {
      throw new Error("Identitas server lokal tidak cocok; tidak ada perubahan dijalankan.");
    }

    console.log(
      `Database lokal terverifikasi: ${activeDatabase.databaseName} (${activeDatabase.serverHost}:${activeDatabase.serverPort}).`,
    );
    return client;
  } catch (error) {
    await client.$disconnect();
    throw error;
  }
}
