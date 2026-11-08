import bcrypt from "bcryptjs";
import { createVerifiedLocalClient } from "./local-db";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SUPER_ADMIN_EMAIL wajib diisi dengan alamat email yang valid.");
  }
  if (!password || password.length < 12) {
    throw new Error("SUPER_ADMIN_PASSWORD wajib diisi dan minimal 12 karakter.");
  }

  const db = await createVerifiedLocalClient();
  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (existing && existing.role !== "SUPER_ADMIN") {
      throw new Error("Email tersebut sudah digunakan role lain; akun lama tidak diubah.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword, passwordSementara: false },
      });
      console.log("Password akun Super Admin yang dituju berhasil diperbarui.");
    } else {
      await db.user.create({
        data: {
          email,
          password: hashedPassword,
          passwordSementara: false,
          role: "SUPER_ADMIN",
          nama: "Super Admin",
        },
      });
      console.log("Akun Super Admin berhasil dibuat.");
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed Super Admin lokal gagal.");
  process.exitCode = 1;
});
