"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KepsekShell from "@/components/KepsekShell";

interface OpsiJawaban {
  id: string;
  teks: string;
  isBenar: boolean;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiJawaban[];
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  deskripsi: string | null;
  mapel: { id?: string; nama: string } | null;
  guru: { nama: string };
  kelasTujuan: { kelas: { id: string; judul: string } }[];
  soal: Soal[];
}

export default function KepsekAsesmenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  async function loadAsesmen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat asesmen.");
        return;
      }
      setAsesmen(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const halamanCount = soalTerfilter.length;
  const currentSoal = soalTerfilter[activeIndex] ?? null;

  if (loading) return <KepsekShell activeTab="ASESMEN"><p role="status" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">Memuat asesmen...</p></KepsekShell>;
  if (error || !asesmen) {
    return (
      <KepsekShell activeTab="ASESMEN"><div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-sm text-[var(--fg)]">{error || "Asesmen tidak ditemukan."}</p><Button variant="outline" onClick={() => router.push("/kepsek")}>Kembali</Button></div></KepsekShell>
    );
  }

  return (
    <KepsekShell activeTab="ASESMEN"><div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Link href="/kepsek" className="mb-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--link)] hover:underline">
        &larr; Kembali ke Kepsek
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="break-words text-xl font-semibold text-[var(--fg)]">{asesmen.judul}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
            {asesmen.mapel && <Badge tone="gray">{asesmen.mapel.nama}</Badge>}
            <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.status === "SELESAI" ? "Selesai" : "Proses"}</Badge>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">Dibuat oleh {asesmen.guru.nama}</p>
          {asesmen.deskripsi && <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--fg)]">{asesmen.deskripsi}</p>}
          {asesmen.kelasTujuan.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {asesmen.kelasTujuan.map(({ kelas }) => (
                <Badge key={kelas.id} tone="gray">
                  {kelas.judul}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-[var(--muted)]">Durasi pengerjaan</p>
          <p className="mt-1 text-sm font-semibold text-[var(--fg)]">{asesmen.durasiMenit ? `${asesmen.durasiMenit} menit` : "Belum diatur"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/kepsek/asesmen/${asesmenId}/jawaban`}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--tint)]"
        >
          Jawaban
        </Link>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIndex(0);
          }}
          placeholder="Cari soal..."
          className="min-w-[180px] flex-1 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
        />
        <div className="flex items-center gap-1">
          <button
            aria-label="Soal sebelumnya"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="h-10 min-w-10 cursor-pointer rounded-md border border-[var(--border-strong)] text-sm font-medium text-[var(--fg)] hover:bg-[var(--tint)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {"<<"}
          </button>
          <span className="min-w-12 px-2 text-center text-xs font-medium tabular-nums text-[var(--muted)]">
            {halamanCount === 0 ? "0/0" : `${activeIndex + 1}/${halamanCount}`}
          </span>
          <button
            aria-label="Soal berikutnya"
            onClick={() => setActiveIndex((i) => Math.min(halamanCount - 1, i + 1))}
            disabled={activeIndex >= halamanCount - 1}
            className="h-10 min-w-10 cursor-pointer rounded-md border border-[var(--border-strong)] text-sm font-medium text-[var(--fg)] hover:bg-[var(--tint)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {">>"}
          </button>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]"
            title="Buka Library Soal"
            aria-label="Buka Library Soal"
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
          <p className="mb-2 text-xs font-semibold text-[var(--fg)]">Library Soal</p>
          {halamanCount === 0 ? (
            <p className="text-xs text-[var(--muted)]">{search ? "Tidak ada soal yang cocok." : "Belum ada soal."}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {soalTerfilter.map((soal, i) => (
                <button
                  key={soal.id}
                  onClick={() => {
                    setActiveIndex(i);
                    setShowGrid(false);
                  }}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-xs font-semibold ${i === activeIndex ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--tint)]"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 min-h-[360px] rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        {asesmen.soal.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Belum ada soal.</p>
        ) : halamanCount === 0 ? (
          <p className="text-sm text-[var(--muted)]">Tidak ada soal yang cocok dengan pencarian.</p>
        ) : currentSoal ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
            </div>

            <p className="mt-5 text-base font-semibold leading-relaxed text-[var(--fg)]">
              {activeIndex + 1}. {currentSoal.pertanyaan}
            </p>

            {currentSoal.gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSoal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-md object-contain" />
            )}

            {currentSoal.tipe !== "ESSAY" ? (
              <div className="mt-4 space-y-2">
                {currentSoal.opsi.map((o) => (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
                      o.isBenar ? "border-[var(--brand)] bg-[var(--tint)]" : "border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"} checked={o.isBenar} readOnly disabled />
                      <span className="text-[var(--fg)]">{o.teks}</span>
                    </div>
                    {o.isBenar && <Badge tone="green">Kunci Jawaban</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-[var(--muted)]">Soal Essay — dinilai manual oleh guru setelah siswa mengumpulkan.</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">Tampilan read-only untuk monitoring Kepsek.</p>
        <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>
          {asesmen.status === "SELESAI" ? "Sudah dipublikasikan ke kelas" : "Belum dipublikasikan"}
        </Badge>
      </div>
    </div></KepsekShell>
  );
}