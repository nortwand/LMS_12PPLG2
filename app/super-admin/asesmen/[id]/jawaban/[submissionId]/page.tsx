"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { Btn, PANEL } from "@/app/super-admin/_ui";

type QuestionAnswer = {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: { id: string; teks: string; isBenar: boolean }[];
  jawabanSiswa: {
    id: string;
    jawabanEssay: string | null;
    nilaiSoal: number | null;
    opsiDipilihIds: string[];
  } | null;
  status: string;
};

type SubmissionDetail = {
  submissionId: string;
  isSuperAdmin: boolean;
  siswa: { nama: string; nis: string; kelasJurusan: string };
  asesmen: { judul: string; mapel: string | null };
  kelas: string;
  nilaiAkhir: number | null;
  soal: QuestionAnswer[];
};

export default function SuperAdminSubmissionDetailPage() {
  const params = useParams();
  const asesmenId = params.id as string;
  const submissionId = params.submissionId as string;
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Jawaban gagal dimuat.");
    setDetail(payload.data);
    setScores(Object.fromEntries(payload.data.soal.map((question: QuestionAnswer) => [
      question.jawabanSiswa?.id ?? question.id,
      question.jawabanSiswa?.nilaiSoal == null ? "" : String(question.jawabanSiswa.nilaiSoal),
    ])));
  }

  useEffect(() => {
    load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Jawaban gagal dimuat."));
  }, [asesmenId, submissionId]);

  async function saveScore(answer: QuestionAnswer) {
    if (!answer.jawabanSiswa) return;
    const score = Number(scores[answer.jawabanSiswa.id]);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setError("Nilai essay harus di antara 0 sampai 100.");
      return;
    }
    setSavingId(answer.jawabanSiswa.id);
    setError("");
    try {
      const response = await fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawabanSiswaId: answer.jawabanSiswa.id, nilaiSoal: score }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Nilai gagal disimpan.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nilai gagal disimpan.");
    } finally {
      setSavingId(null);
    }
  }

  if (error && !detail) return <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>;
  if (!detail) return <p className="text-sm text-[var(--muted)]">Memuat jawaban...</p>;

  return (
    <div className="space-y-5">
      <Link href={`/super-admin/asesmen/${asesmenId}/jawaban`} className="text-sm font-medium text-[var(--link)] hover:underline">
        &larr; Kembali ke daftar jawaban
      </Link>
      <section className={PANEL}>
        <p className="text-xs text-[var(--muted)]">
          {detail.isSuperAdmin ? "Submission pribadi Super Admin" : "Submission siswa"}
        </p>
        <h1 className="mt-1 text-xl font-semibold">{detail.asesmen.judul}</h1>
        <p className="mt-2 text-sm">{detail.siswa.nama} · {detail.kelas}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Nilai akhir: {detail.nilaiAkhir ?? "Belum dinilai"}</p>
      </section>
      {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
      {detail.soal.map((question) => (
        <section key={question.id} className={PANEL}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone={question.status === "BENAR" ? "brand" : "gray"}>{question.tipe.replace("_", " ")}</Badge>
            <span className="text-xs text-[var(--muted)]">{question.status.replaceAll("_", " ")}</span>
          </div>
          <p className="mt-4 font-medium">{question.urutan}. {question.pertanyaan}</p>
          {question.tipe === "ESSAY" ? (
            <div className="mt-3 space-y-3">
              <p className="whitespace-pre-wrap rounded-md bg-[var(--tint)] p-3 text-sm">{question.jawabanSiswa?.jawabanEssay || "Tidak dijawab."}</p>
              {question.jawabanSiswa && !detail.isSuperAdmin && (
                <div className="flex items-end gap-2">
                  <label className="text-xs text-[var(--muted)]">
                    Nilai essay (0-100)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scores[question.jawabanSiswa.id] ?? ""}
                      onChange={(event) => setScores((previous) => ({ ...previous, [question.jawabanSiswa!.id]: event.target.value }))}
                      className="mt-1 block h-9 w-28 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-sm"
                    />
                  </label>
                  <Btn size="sm" loading={savingId === question.jawabanSiswa.id} onClick={() => void saveScore(question)}>Simpan nilai</Btn>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {question.opsi.map((option) => (
                <p key={option.id} className={`rounded-md border p-3 text-sm ${option.isBenar ? "border-[var(--brand)] bg-[var(--tint)]" : "border-[var(--border)]"}`}>
                  {question.jawabanSiswa?.opsiDipilihIds.includes(option.id) ? "✓ " : ""}{option.teks}
                  {option.isBenar ? " · Kunci jawaban" : ""}
                </p>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
