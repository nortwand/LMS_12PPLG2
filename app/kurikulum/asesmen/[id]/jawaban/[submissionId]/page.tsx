"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KurikulumShell from "@/components/KurikulumShell";

interface OpsiSoal {
  id: string;
  teks: string;
  urutan: number;
  isBenar: boolean;
}
type StatusSoal = "BENAR" | "SALAH" | "SEBAGIAN_BENAR" | "BELUM_DIJAWAB" | "BELUM_DINILAI" | "SUDAH_DINILAI";
interface SoalDetail {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSoal[];
  jawabanSiswa: { id: string; jawabanEssay: string | null; nilaiSoal: number | null; raguRagu: boolean; opsiDipilihIds: string[] } | null;
  status: StatusSoal;
}
interface DetailResponse {
  submissionId: string;
  siswa: { nama: string; nis: string; kelasJurusan: string };
  asesmen: { judul: string; mapel: string | null };
  kelas: string;
  mulaiPada: string;
  submittedAt: string | null;
  nilaiAkhir: number | null;
  rekap: {
    totalBenar: number;
    totalSalah: number;
    totalKosong: number;
    totalEssay: number;
    totalEssayBelumDinilai: number;
    totalObjektif: number;
    totalObjektifDijawab: number;
    totalEssayDijawab: number;
    totalRaguRagu: number;
    nilaiObjektif: number;
  };
  soal: SoalDetail[];
}

const STATUS_BADGE: Record<StatusSoal, { label: string; tone: "green" | "red" | "amber" | "gray" }> = {
  BENAR: { label: "Benar", tone: "green" },
  SALAH: { label: "Salah", tone: "red" },
  SEBAGIAN_BENAR: { label: "Sebagian Benar", tone: "amber" },
  BELUM_DIJAWAB: { label: "Belum Dijawab", tone: "gray" },
  BELUM_DINILAI: { label: "Belum Dinilai", tone: "amber" },
  SUDAH_DINILAI: { label: "Sudah Dinilai", tone: "green" },
};

function formatTanggal(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

// Tampilan satu soal read-only untuk monitoring Kurikulum.
function SoalView({ soal, nomor }: { soal: SoalDetail; nomor: number }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <Badge tone="gray">
          {soal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : soal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
        </Badge>
        <Badge tone={STATUS_BADGE[soal.status].tone}>{STATUS_BADGE[soal.status].label}</Badge>
      </div>

      <p className="mt-5 text-base font-semibold leading-relaxed text-[var(--fg)]">
        {nomor}. {soal.pertanyaan}
      </p>

      {soal.gambar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={soal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-md object-contain" />
      )}

      {soal.tipe !== "ESSAY" ? (
        <div className="mt-4 space-y-2">
          {soal.opsi.map((o) => {
            const dipilihSiswa = soal.jawabanSiswa?.opsiDipilihIds.includes(o.id) ?? false;
            const optionStyle = o.isBenar
              ? "border-[var(--brand)] bg-[var(--tint)]"
              : dipilihSiswa
                ? "border-[var(--danger)] bg-[var(--tint)]"
                : "border-[var(--border)]";

            return (
              <div key={o.id} className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${optionStyle}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <input type={soal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"} checked={dipilihSiswa} readOnly disabled />
                  <span className="text-[var(--fg)]">{o.teks}</span>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {dipilihSiswa && <Badge tone="brand">Dipilih Siswa</Badge>}
                  {o.isBenar && <Badge tone="green">Kunci Jawaban</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--fg)]">
            {soal.jawabanSiswa?.jawabanEssay || <span className="text-[var(--muted)]">Siswa belum menjawab.</span>}
          </div>

          {soal.jawabanSiswa && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted)]">Nilai Essay (0-100)</span>
              {soal.jawabanSiswa.nilaiSoal !== null ? (
                <Badge tone="green">{soal.jawabanSiswa.nilaiSoal}</Badge>
              ) : (
                <Badge tone="amber">Belum dinilai guru</Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KurikulumDetailJawabanSiswaPage() {
  const params = useParams();
  const router = useRouter();
  const asesmenId = params.id as string;
  const submissionId = params.submissionId as string;

  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [urutanSiswa, setUrutanSiswa] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const [detailRes, nilaiRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`),
        fetch(`/api/asesmen/${asesmenId}/nilai`),
      ]);
      const detailData = await detailRes.json();
      if (!detailRes.ok) {
        setError(detailData.error ?? "Gagal memuat jawaban siswa.");
        return;
      }
      setDetail(detailData.data);
      setActiveIndex(0);

      if (nilaiRes.ok) {
        const nilaiData = await nilaiRes.json();
        setUrutanSiswa((nilaiData.data?.nilai ?? []).map((r: { submissionId: string }) => r.submissionId));
      }
    } catch {
      setError("Terjadi kesalahan saat memuat jawaban siswa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId, submissionId]);

  const currentSoal = detail?.soal[activeIndex] ?? null;

  const { prevSiswaId, nextSiswaId } = useMemo(() => {
    const idx = urutanSiswa.indexOf(submissionId);
    return {
      prevSiswaId: idx > 0 ? urutanSiswa[idx - 1] : null,
      nextSiswaId: idx >= 0 && idx < urutanSiswa.length - 1 ? urutanSiswa[idx + 1] : null,
    };
  }, [urutanSiswa, submissionId]);

  if (loading) return <KurikulumShell activeTab="ASESMEN"><p role="status" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">Memuat jawaban siswa...</p></KurikulumShell>;
  if (error || !detail) {
    return (
      <KurikulumShell activeTab="ASESMEN"><div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--fg)]">{error || "Jawaban siswa tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push(`/kurikulum/asesmen/${asesmenId}/jawaban`)}>
          Kembali
        </Button>
      </div></KurikulumShell>
    );
  }

  const { rekap } = detail;

  return (
    <KurikulumShell activeTab="ASESMEN"><div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Link
        href={`/kurikulum/asesmen/${asesmenId}/jawaban`}
        className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--link)] hover:underline"
      >
        &larr; Kembali ke Daftar Jawaban
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-5">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">Jawaban Siswa</p>
          <h1 className="mt-1 text-xl font-semibold text-[var(--fg)]">{detail.siswa.nama}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="gray">NIS {detail.siswa.nis}</Badge>
            <Badge tone="gray">{detail.siswa.kelasJurusan}</Badge>
            <Badge tone="gray">{detail.kelas}</Badge>
            {detail.asesmen.mapel && <Badge tone="brand">{detail.asesmen.mapel}</Badge>}
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--fg)]">{detail.asesmen.judul}</p>
        </div>

      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid lg:grid-cols-[1fr_220px]">
          <div className="overflow-x-auto p-4 sm:p-5">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-medium text-[var(--muted)]">
                  <th className="pb-3">Ringkasan</th>
                  <th className="pb-3 text-right">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="py-3 text-[var(--muted)]">Mulai</td>
                  <td className="py-3 text-right font-semibold text-[var(--fg)]">{formatTanggal(detail.mulaiPada)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[var(--muted)]">Dikumpulkan</td>
                  <td className="py-3 text-right font-semibold text-[var(--fg)]">{formatTanggal(detail.submittedAt)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[var(--muted)]">Pilihan Ganda Dikerjakan</td>
                  <td className="py-3 text-right font-bold text-[var(--fg)]">{rekap.totalObjektifDijawab}/{rekap.totalObjektif}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[var(--muted)]">Essay Dikerjakan</td>
                  <td className="py-3 text-right font-bold text-[var(--fg)]">{rekap.totalEssayDijawab}/{rekap.totalEssay}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[var(--muted)]">Jumlah Ragu-ragu</td>
                  <td className="py-3 text-right font-bold text-[var(--fg)]">{rekap.totalRaguRagu}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="order-first flex items-center justify-center border-b border-[var(--border)] bg-[var(--tint)] p-5 text-center lg:order-last lg:border-b-0 lg:border-l">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Nilai Objektif</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--fg)]">{rekap.nilaiObjektif}</p>
              <div className="my-4 h-px bg-[var(--border)]" />
              <p className="text-xs font-medium text-[var(--muted)]">Nilai Akhir</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--fg)]">
                {detail.nilaiAkhir ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!prevSiswaId} onClick={() => prevSiswaId && router.push(`/kurikulum/asesmen/${asesmenId}/jawaban/${prevSiswaId}`)}>
          &larr; Siswa Sebelumnya
        </Button>
        <Button size="sm" variant="outline" disabled={!nextSiswaId} onClick={() => nextSiswaId && router.push(`/kurikulum/asesmen/${asesmenId}/jawaban/${nextSiswaId}`)}>
          Siswa Berikutnya &rarr;
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="Soal sebelumnya"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="h-10 min-w-10 cursor-pointer rounded-md border border-[var(--border-strong)] text-sm font-medium text-[var(--fg)] hover:bg-[var(--tint)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {"<<"}
          </button>
          <span className="min-w-14 px-2 text-center text-xs font-medium tabular-nums text-[var(--muted)]">
            {detail.soal.length === 0 ? "0/0" : `${activeIndex + 1}/${detail.soal.length}`}
          </span>
          <button
            aria-label="Soal berikutnya"
            onClick={() => setActiveIndex((i) => Math.min(detail.soal.length - 1, i + 1))}
            disabled={activeIndex >= detail.soal.length - 1}
            className="h-10 min-w-10 cursor-pointer rounded-md border border-[var(--border-strong)] text-sm font-medium text-[var(--fg)] hover:bg-[var(--tint)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {">>"}
          </button>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]"
            title="Daftar Nomor Soal"
            aria-label="Daftar Nomor Soal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {showGrid && (
        <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="mb-2 text-xs font-semibold text-[var(--fg)]">Daftar Soal</p>
          {detail.soal.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Belum ada soal.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {detail.soal.map((s, i) => {
                const statusClass =
                  s.status === "BENAR" || s.status === "SUDAH_DINILAI"
                    ? "border-[var(--brand)] text-[var(--link)]"
                    : s.status === "SALAH"
                    ? "border-[var(--danger)] text-[var(--danger)]"
                    : s.status === "SEBAGIAN_BENAR" || s.status === "BELUM_DINILAI"
                    ? "border-[var(--border-strong)] text-[var(--fg)]"
                    : "border-[var(--border)] text-[var(--muted)]";
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveIndex(i);
                      setShowGrid(false);
                    }}
                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-xs font-semibold ${i === activeIndex ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]" : `bg-[var(--surface)] ${statusClass} hover:bg-[var(--tint)]`}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 min-h-[360px] rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        {detail.soal.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Siswa ini belum menjawab soal apapun.</p>
        ) : currentSoal ? (
          <SoalView soal={currentSoal} nomor={activeIndex + 1} />
        ) : null}
      </div>

    </div></KurikulumShell>
  );
}