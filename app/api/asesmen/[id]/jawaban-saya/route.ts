import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = requireRole(await getSession(), ["SUPER_ADMIN"]);
    const { id: asesmenId } = await params;

    const submission = await db.submission.findFirst({
      where: {
        asesmenId,
        siswaId: session.userId,
        isSuperAdmin: true,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        nilaiAkhir: true,
      },
    });

    return NextResponse.json({
      data: submission
        ? {
            submissionId: submission.id,
            status: submission.status,
            submittedAt: submission.submittedAt,
            nilaiAkhir: submission.nilaiAkhir,
          }
        : null,
    });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
