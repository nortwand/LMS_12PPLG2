import { createVerifiedLocalClient } from "./local-db";

async function main() {
  const db = await createVerifiedLocalClient();
  try {
    const accounts = await db.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { passwordSementara: true },
    });
    const readyAccounts = accounts.filter((account) => !account.passwordSementara).length;
    console.log(`Super Admin accounts: ${accounts.length}; ready for login: ${readyAccounts}.`);
    if (readyAccounts === 0) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verifikasi Super Admin lokal gagal.");
  process.exitCode = 1;
});
