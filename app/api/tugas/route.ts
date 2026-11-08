import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    if (session!.role === "GURU" || session!.role === "SUPER_ADMIN") {
      const kelasId = req.nextUrl.searchParams.get("kelasId");
      const tugasList = await db.tugas.findMany({
        where: {
          guruId: session!.role === "GURU" ? session!.userId : undefined,
          kelasTujuan: kelasId ? { some: { kelasId } } : undefined,
        },
        include: {
          mapel: true,
          guru: { select: { id: true, nama: true, fotoProfil: true, role: true } },
          lampiran: true,
          kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
          _count: { select: { submission: { where: { isSuperAdmin: false } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      if (session!.role === "SUPER_ADMIN") {
        const submissionList = await db.tugasSubmission.findMany({
          where: {
            siswaId: session!.userId,
            isSuperAdmin: true,
            tugasId: { in: tugasList.map((tugas) => tugas.id) },
          },
          select: { tugasId: true, id: true, status: true, submittedAt: true },
        });
        const submissionByTask = new Map(submissionList.map((submission) => [submission.tugasId, submission]));
        return NextResponse.json({
          data: tugasList.map((tugas) => {
            const ownSubmission = submissionByTask.get(tugas.id);
            return {
              ...tugas,
              statusSubmission: ownSubmission?.status ?? "BELUM",
              superAdminSubmission: ownSubmission ?? null,
            };
          }),
        });
      }
      return NextResponse.json({ data: tugasList });
    }

    if (session!.role === "SISWA") {
      const kelasSiswa = await db.kelasSiswa.findMany({ where: { siswaId: session!.userId }, select: { kelasId: true } });
      const kelasIds = kelasSiswa.map((kelas) => kelas.kelasId);
      if (kelasIds.length === 0) return NextResponse.json({ data: [] });

      const tugasKelasList = await db.tugasKelas.findMany({
        where: { kelasId: { in: kelasIds } },
        include: {
          kelas: { select: { id: true, judul: true } },
          tugas: {
            include: {
              mapel: true,
              guru: { select: { id: true, nama: true, fotoProfil: true } },
              lampiran: true,
              submission: { where: { siswaId: session!.userId, isSuperAdmin: false } },
              _count: { select: { submission: { where: { isSuperAdmin: false } } } },
            },
          },
        },
        orderBy: { tugas: { createdAt: "desc" } },
      });

      const tugasMap = new Map<string, any>();
      for (const tugasKelas of tugasKelasList) {
        const tugas = tugasKelas.tugas;
        if (!tugasMap.has(tugas.id)) {
          const { submission, ...tugasRest } = tugas;
          tugasMap.set(tugas.id, {
            ...tugasRest,
            kelasTujuan: [{ kelas: tugasKelas.kelas }],
            statusSubmission: submission[0]?.status ?? "BELUM",
          });
        } else {
          tugasMap.get(tugas.id).kelasTujuan.push({ kelas: tugasKelas.kelas });
        }
      }
      return NextResponse.json({ data: Array.from(tugasMap.values()) });
    }

    return NextResponse.json({ data: [] });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SUPER_ADMIN"]);
    const body = await req.json();
    const { judul, isi, mapelId, kelasIds, lampiran } = body;
    const tugasBaru = await db.$transaction(async (tx) => {
      const tugas = await tx.tugas.create({
        data: {
          guruId: session!.userId,
          judul: String(judul ?? "").trim() || "Tugas tanpa judul",
          isi: isi || null,
          mapelId: mapelId || null,
          lampiran: Array.isArray(lampiran) && lampiran.length > 0
            ? { create: lampiran.map((item: { tipe: string; url: string; judul?: string; thumbnail?: string }) => ({ tipe: item.tipe, url: item.url, judul: item.judul || null, thumbnail: item.thumbnail || null })) }
            : undefined,
        },
      });
      if (Array.isArray(kelasIds) && kelasIds.length > 0) {
        await tx.tugasKelas.createMany({ data: kelasIds.map((kelasId: string) => ({ tugasId: tugas.id, kelasId })) });
      }
      return tugas;
    });
    return NextResponse.json({ message: "Tugas berhasil dibuat.", data: tugasBaru }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}