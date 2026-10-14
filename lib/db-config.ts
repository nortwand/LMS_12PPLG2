import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export function createDatabaseAdapter() {
  const host = process.env.DB_HOST ?? "127.0.0.1";
  const database = process.env.DB_NAME ?? "Studify";
  const sslEnabled = process.env.DB_SSL === "true";
  const sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, "\n").trim();

  if (sslEnabled && !sslCa) {
    throw new Error("DB_SSL_CA is required when DB_SSL=true");
  }

  const adapter = new PrismaMariaDb(
    {
      host,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database,
      connectionLimit: 5,
      connectTimeout: 15000,
      acquireTimeout: 20000,
      ssl: sslEnabled
        ? { ca: sslCa, rejectUnauthorized: true }
        : undefined,
    },
    {
      onConnectionError: (error) => {
        console.error("[db] MariaDB connection error", {
          message: error.message,
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
          host,
          database,
          sslEnabled,
        });
      },
    },
  );

  return { adapter, host, database, sslEnabled };
}
