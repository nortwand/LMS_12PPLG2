import { readFile } from "node:fs/promises";
import { createVerifiedLocalClient } from "./local-db";

type Column = {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: unknown;
};

const MIGRATION_PATH = new URL(
  "./migrations/20260612090000_super_admin_submission_scope/migration.sql",
  import.meta.url,
);

async function main() {
  const db = await createVerifiedLocalClient();
  try {
    const columns = await db.$queryRaw<Column[]>`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (
          (LOWER(TABLE_NAME) = 'user' AND COLUMN_NAME = 'role')
          OR (LOWER(TABLE_NAME) = 'submission' AND COLUMN_NAME = 'isSuperAdmin')
          OR (LOWER(TABLE_NAME) = 'tugassubmission' AND COLUMN_NAME = 'isSuperAdmin')
        )
    `;
    const roleColumn = columns.find((column) => column.TABLE_NAME.toLowerCase() === "user" && column.COLUMN_NAME === "role");
    if (!roleColumn || roleColumn.IS_NULLABLE !== "NO" || !roleColumn.COLUMN_TYPE.startsWith("enum(")) {
      const observedType = roleColumn?.COLUMN_TYPE ?? "tidak ditemukan";
      throw new Error(`Kolom User.role bertipe ${observedType}; migrasi dibatalkan agar nilai role tetap aman.`);
    }

    const currentRoles = [...roleColumn.COLUMN_TYPE.matchAll(/'((?:\\.|[^'])*)'/g)].map((match) =>
      match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\"),
    );
    const expectedRoles = ["SUPER_ADMIN", "ADMIN", "KEPSEK", "KURIKULUM", "GURU", "SISWA"];
    if (currentRoles.some((role) => !expectedRoles.includes(role))) {
      throw new Error("Enum User.role memiliki nilai tak dikenal; migrasi dibatalkan agar nilai tidak hilang.");
    }

    const migration = await readFile(MIGRATION_PATH, "utf8");
    const statements = migration.split(";").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) {
      if (statement.includes("MODIFY COLUMN `role`") && currentRoles.includes("SUPER_ADMIN")) continue;
      if (statement.includes("TABLE `Submission`") && columns.some(
        (column) => column.TABLE_NAME.toLowerCase() === "submission" && column.COLUMN_NAME === "isSuperAdmin",
      )) continue;
      if (statement.includes("TABLE `TugasSubmission`") && columns.some(
        (column) => column.TABLE_NAME.toLowerCase() === "tugassubmission" && column.COLUMN_NAME === "isSuperAdmin",
      )) continue;
      await db.$executeRawUnsafe(statement);
    }

    const updatedColumns = await db.$queryRaw<Column[]>`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (
          (LOWER(TABLE_NAME) = 'user' AND COLUMN_NAME = 'role')
          OR (LOWER(TABLE_NAME) = 'submission' AND COLUMN_NAME = 'isSuperAdmin')
          OR (LOWER(TABLE_NAME) = 'tugassubmission' AND COLUMN_NAME = 'isSuperAdmin')
        )
    `;
    const updatedRole = updatedColumns.find(
      (column) => column.TABLE_NAME.toLowerCase() === "user" && column.COLUMN_NAME === "role",
    );
    const verifiedRoles = updatedRole
      ? [...updatedRole.COLUMN_TYPE.matchAll(/'((?:\\.|[^'])*)'/g)].map((match) => match[1])
      : [];
    const submissionScopeColumns = [
      updatedColumns.find(
        (column) => column.TABLE_NAME.toLowerCase() === "submission" && column.COLUMN_NAME === "isSuperAdmin",
      ),
      updatedColumns.find(
        (column) => column.TABLE_NAME.toLowerCase() === "tugassubmission" && column.COLUMN_NAME === "isSuperAdmin",
      ),
    ];
    if (
      !verifiedRoles.includes("SUPER_ADMIN") ||
      submissionScopeColumns.some(
        (column) => !column || column.COLUMN_TYPE !== "tinyint(1)" || column.IS_NULLABLE !== "NO" || Number(column.COLUMN_DEFAULT) !== 0,
      )
    ) {
      throw new Error("Verifikasi schema Super Admin gagal setelah migrasi.");
    }

    console.log("Migrasi role Super Admin dan kolom pemisah submission berhasil diterapkan.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migrasi lokal gagal.");
  process.exitCode = 1;
});
