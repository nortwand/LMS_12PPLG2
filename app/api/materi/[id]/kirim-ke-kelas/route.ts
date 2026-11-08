import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    requireRole(await getSession(), ["SUPER_ADMIN"]);
    const { id: materiId } = await params;
    const body = await req.json();
    const requestedKelasIds: unknown[] = Array.isArray(body?.kelasIds) ? body.kelasIds : [];
    const kelasIds = [
      ...new Set(requestedKelasIds.filter((id): id is string => typeof id === "string")),
    ]

    if (kelasIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 kelas tujuan." }, { status: 400 });
    }

    const materi = await db.materi.findUnique({ where: { id: materiId }, select: { id: true } });
    if (!materi) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });

    const kelasValid = await db.kelas.findMany({
      where: { id: { in: kelasIds } },
      select: { id: true },
    });
    if (kelasValid.length !== kelasIds.length) {
      return NextResponse.json({ error: "Satu atau beberapa kelas tujuan tidak ditemukan." }, { status: 404 });
    }

    const existing = await db.materiKelas.findMany({
      where: { materiId, kelasId: { in: kelasIds } },
      select: { kelasId: true },
    });
    const existingIds = new Set(existing.map((item) => item.kelasId));
    const newKelasIds = kelasIds.filter((kelasId: string) => !existingIds.has(kelasId));
    if (newKelasIds.length === 0) {
      return NextResponse.json({ error: "Materi ini sudah dikirim ke semua kelas yang dipilih." }, { status: 409 });
    }

    await db.materiKelas.createMany({
      data: newKelasIds.map((kelasId: string) => ({ materiId, kelasId })),
    });

    return NextResponse.json({ message: "Materi berhasil dikirim ke kelas." }, { status: 201 });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
