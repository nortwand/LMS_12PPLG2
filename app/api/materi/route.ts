import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

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

export async function GET(req: NextRequest) {
  try {
    const session = requireRole(await getSession(), ["GURU", "SISWA", ...ADMIN_TIER]);
    const kelasId = req.nextUrl.searchParams.get("kelasId");

    if (kelasId) {
      const kelas = await db.kelas.findUnique({
        where: { id: kelasId },
        select: {
          id: true,
          guruMapel: { where: { guruId: session.userId }, select: { id: true }, take: 1 },
          siswa: { where: { siswaId: session.userId }, select: { id: true }, take: 1 },
        },
      });
      if (!kelas) return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
      if (session.role === "GURU" && kelas.guruMapel.length === 0) {
        return NextResponse.json({ error: "Anda tidak mengajar di kelas ini." }, { status: 403 });
      }
      if (session.role === "SISWA" && kelas.siswa.length === 0) {
        return NextResponse.json({ error: "Anda bukan anggota kelas ini." }, { status: 403 });
      }

      const materiList = await db.materi.findMany({
        where: { kelasTujuan: { some: { kelasId } } },
        include: {
          guru: { select: { id: true, nama: true } },
          kelasTujuan: { where: { kelasId }, include: { kelas: { select: { id: true, judul: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ data: materiList });
    }

    const where = session.role === "GURU"
      ? { guruId: session.userId }
      : session.role === "SISWA"
        ? { kelasTujuan: { some: { kelas: { siswa: { some: { siswaId: session.userId } } } } } }
        : {};
    const kelasTujuanWhere = session.role === "SISWA"
      ? { kelas: { siswa: { some: { siswaId: session.userId } } } }
      : session.role === "GURU"
        ? { kelas: { guruMapel: { some: { guruId: session.userId } } } }
        : undefined;

    const materiList = await db.materi.findMany({
      where,
      include: {
        guru: { select: { id: true, nama: true } },
        kelasTujuan: { where: kelasTujuanWhere, include: { kelas: { select: { id: true, judul: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: materiList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireRole(await getSession(), ["GURU"]);
    const body = await req.json().catch(() => null);
    const judul = typeof body?.judul === "string" ? body.judul.trim() : "";
    const tipe = typeof body?.tipe === "string" ? body.tipe : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const deskripsi = typeof body?.deskripsi === "string" ? body.deskripsi.trim() : null;
    const kelasIds = parseKelasIds(body?.kelasIds);

    if (!judul || !TIPE_MATERI.includes(tipe as (typeof TIPE_MATERI)[number]) || !url || kelasIds.length === 0) {
      return NextResponse.json({ error: "Judul, sumber, dan minimal 1 kelas tujuan wajib diisi." }, { status: 400 });
    }
    if (!isValidUrlForType(tipe, url)) {
      return NextResponse.json({ error: "URL tidak sesuai dengan tipe sumber materi." }, { status: 400 });
    }

    const kelasDiampu = await db.kelasGuruMapel.findMany({
      where: { guruId: session.userId, kelasId: { in: kelasIds } },
      select: { kelasId: true },
    });
    if (kelasDiampu.length !== kelasIds.length) {
      return NextResponse.json({ error: "Materi hanya dapat dibagikan ke kelas yang Anda ajar." }, { status: 403 });
    }

    const materiBaru = await db.$transaction(async (tx) => {
      const materi = await tx.materi.create({
        data: {
          guruId: session.userId,
          judul,
          tipe,
          url,
          deskripsi: deskripsi || null,
        },
      });

      await tx.materiKelas.createMany({
        data: kelasIds.map((kelasId: string) => ({ materiId: materi.id, kelasId })),
      });

      return materi;
    });

    return NextResponse.json({ message: "Materi berhasil ditambahkan.", data: materiBaru }, { status: 201 });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}