import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

const TIPE_MATERI = ["LINK", "PDF", "FILE", "FOTO"] as const;

function isValidUrlForType(tipe: string, url: string) {
  if (tipe === "LINK") {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  return url.startsWith("/uploads/materi/");
}

function parseKelasIds(value: unknown) {
  const ids: string[] = [];
  if (Array.isArray(value)) {
    for (const kelasId of value) {
      if (typeof kelasId === "string") ids.push(kelasId);
    }
  }
  return [...new Set(ids)];
}

type Params = { params: Promise<{ id: string }> };

// PATCH /api/materi/[id] -> edit materi
// body: { judul?, url?, deskripsi?, kelasIds? } -> kelasIds kalau dikirim, replace semua assignment lama
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = requireRole(await getSession(), ["GURU"]);

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const judul = typeof body?.judul === "string" ? body.judul.trim() : undefined;
    const url = typeof body?.url === "string" ? body.url.trim() : undefined;
    const deskripsi = body?.deskripsi;
    const tipe = typeof body?.tipe === "string" ? body.tipe : undefined;
    const kelasIds = Array.isArray(body?.kelasIds) ? parseKelasIds(body.kelasIds) : undefined;

    const existing = await db.materi.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (existing.guruId !== session.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    const nextTipe = tipe ?? existing.tipe;
    const nextUrl = url ?? existing.url;
    if (!TIPE_MATERI.includes(nextTipe as (typeof TIPE_MATERI)[number]) || !isValidUrlForType(nextTipe, nextUrl)) {
      return NextResponse.json({ error: "Tipe atau URL sumber materi tidak valid." }, { status: 400 });
    }
    if (kelasIds && kelasIds.length === 0) {
      return NextResponse.json({ error: "Materi harus dibagikan ke minimal 1 kelas." }, { status: 400 });
    }
    if (kelasIds) {
      const kelasDiampu = await db.kelasGuruMapel.findMany({
        where: { guruId: session.userId, kelasId: { in: kelasIds } },
        select: { kelasId: true },
      });
      if (kelasDiampu.length !== kelasIds.length) {
        return NextResponse.json({ error: "Materi hanya dapat dibagikan ke kelas yang Anda ajar." }, { status: 403 });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const materi = await tx.materi.update({
        where: { id },
        data: {
          judul: judul || undefined,
          tipe: tipe || undefined,
          url: url || undefined,
          deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
        },
      });

      if (kelasIds) {
        await tx.materiKelas.deleteMany({ where: { materiId: id } });
        await tx.materiKelas.createMany({
          data: kelasIds.map((kelasId: string) => ({ materiId: id, kelasId })),
        });
      }

      return materi;
    });

    return NextResponse.json({ message: "Materi berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// DELETE /api/materi/[id] -> hapus materi
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = requireRole(await getSession(), ["GURU"]);

    const { id } = await params;
    const existing = await db.materi.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (existing.guruId !== session.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    await db.$transaction([
      db.materiKelas.deleteMany({ where: { materiId: id } }),
      db.materi.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Materi berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}