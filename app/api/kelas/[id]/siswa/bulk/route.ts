import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { FULL_CRUD_ADMIN, requireRole } from "@/lib/rbac";

const MAX_BULK_STUDENTS = 500;
type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    requireRole(await getSession(), FULL_CRUD_ADMIN);

    const { id: kelasId } = await params;
    const kelas = await db.kelas.findUnique({ where: { id: kelasId }, select: { id: true, judul: true } });
    if (!kelas) return NextResponse.json({ error: "Kelas tujuan tidak ditemukan." }, { status: 404 });

    const body = await request.json().catch(() => null);
    const rombelId = typeof body?.rombelId === "string" ? body.rombelId.trim() : "";
    const jurusanNama = typeof body?.jurusan === "string" ? body.jurusan.trim() : "";
    const kelasFilter = typeof body?.kelas === "string" ? body.kelas.trim() : "";
    const search = typeof body?.search === "string" ? body.search.trim().slice(0, 100) : "";

    if (!rombelId && !jurusanNama && !kelasFilter && !search) {
      return NextResponse.json({ error: "Pilih minimal satu filter siswa sebelum mengirim." }, { status: 400 });
    }

    const referenceWhere: { id?: string; jurusanId?: string; jenjang?: string; tingkat?: number } = {};
    if (rombelId) referenceWhere.id = rombelId;
    if (jurusanNama) {
      const jurusan = await db.jurusan.findUnique({ where: { nama: jurusanNama }, select: { id: true } });
      if (!jurusan) return NextResponse.json({ error: "Jurusan filter tidak ditemukan." }, { status: 400 });
      referenceWhere.jurusanId = jurusan.id;
    }
    if (kelasFilter === "SMP" || kelasFilter === "SMA") {
      referenceWhere.jenjang = kelasFilter;
    } else if (kelasFilter) {
      const tingkat = Number(kelasFilter);
      if (!Number.isInteger(tingkat) || tingkat < 1 || tingkat > 12) {
        return NextResponse.json({ error: "Filter kelas tidak valid." }, { status: 400 });
      }
      referenceWhere.tingkat = tingkat;
    }

    const hasReferenceFilter = Object.keys(referenceWhere).length > 0;
    const referensiList = hasReferenceFilter
      ? await db.kelasReferensi.findMany({ where: referenceWhere, select: { id: true } })
      : [];
    if (hasReferenceFilter && referensiList.length === 0) {
      return NextResponse.json({ error: "Tidak ada rombel yang cocok dengan filter." }, { status: 400 });
    }

    const siswa = await db.user.findMany({
      where: {
        role: "SISWA",
        ...(hasReferenceFilter ? { kelasReferensiId: { in: referensiList.map((item) => item.id) } } : {}),
        ...(search ? {
          OR: [
            { nama: { contains: search } },
            { email: { contains: search } },
            { nis: { contains: search } },
          ],
        } : {}),
      },
      select: { id: true },
      orderBy: { nama: "asc" },
      take: MAX_BULK_STUDENTS + 1,
    });

    if (siswa.length > MAX_BULK_STUDENTS) {
      return NextResponse.json({ error: `Hasil filter melebihi batas ${MAX_BULK_STUDENTS} siswa. Persempit filter terlebih dahulu.` }, { status: 413 });
    }
    if (siswa.length === 0) {
      return NextResponse.json({ error: "Tidak ada siswa yang cocok dengan filter." }, { status: 404 });
    }

    const result = await db.kelasSiswa.createMany({
      data: siswa.map((item) => ({ kelasId, siswaId: item.id })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Pengiriman bulk selesai.",
      data: {
        kelas: kelas.judul,
        cocok: siswa.length,
        ditambahkan: result.count,
        dilewati: siswa.length - result.count,
      },
    });
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
