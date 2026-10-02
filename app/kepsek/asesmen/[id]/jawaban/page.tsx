"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";
import KepsekShell from "@/components/KepsekShell";

interface NilaiRow {
  submissionId: string;
  nama: string;
  nis: string;
  kelasReferensi: string;
  kelas: { id: string; judul: string }[];
  nilaiObjektif: number;
  nilaiAkhir: number | null;
  nilaiSementara: number;
  totalSoalTerjawab: number;
}

interface KelasTujuan {
  kelas: { id: string; judul: string };
}

interface NilaiResponse {
  asesmen: { judul: string; tipe: "KUIS" | "UJIAN"; mapel?: string };
  kelas: string[];
  nilai: NilaiRow[];
}

export default function KepsekJawabanPage() {
  const params = useParams();
  const asesmenId = params.id as string;
  const [hasil, setHasil] = useState<NilaiResponse | null>(null);
  const [kelasTujuan, setKelasTujuan] = useState<KelasTujuan[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [nilaiRes, asesmenRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/nilai`),
        fetch(`/api/asesmen/${asesmenId}`),
      ]);
      const nilaiData = await nilaiRes.json();
      const asesmenData = await asesmenRes.json();
      if (!nilaiRes.ok) {
        setError(nilaiData.error ?? "Gagal memuat jawaban.");
        return;
      }
      setHasil(nilaiData.data);
      setKelasTujuan(asesmenData.data?.kelasTujuan ?? []);
    } catch {
      setError("Gagal memuat jawaban.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  const selectedRows = useMemo(
    () => hasil?.nilai.filter((row) => row.kelas.some((kelas) => kelas.id === selectedKelasId)) ?? [],
    [hasil, selectedKelasId]
  );

  if (loading) return <KepsekShell activeTab="ASESMEN"><p role="status" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">Memuat jawaban...</p></KepsekShell>;
  if (!hasil) return <KepsekShell activeTab="ASESMEN"><p role="alert" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--fg)]">{error || "Jawaban tidak ditemukan."}</p></KepsekShell>;

  return (
    <KepsekShell activeTab="ASESMEN"><div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Link href={`/kepsek/asesmen/${asesmenId}`} className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--link)] hover:underline">
        &larr; Kembali ke Asesmen
      </Link>

      <div className="mt-3 border-b border-[var(--border)] pb-5">
        <p className="text-xs font-medium text-[var(--muted)]">Jawaban Siswa</p>
        <h1 className="mt-1 text-xl font-semibold text-[var(--fg)]">{hasil.asesmen.judul}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
          {hasil.asesmen.mapel && <Badge tone="gray">{hasil.asesmen.mapel}</Badge>}
          <Badge tone="green">{hasil.nilai.length} sudah mengumpulkan</Badge>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)]">{error}</p>}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg)]">Daftar Per Kelas</h2>

        {kelasTujuan.length === 0 ? (
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Belum ada kelas tujuan.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasTujuan.map(({ kelas }) => {
              const count = hasil.nilai.filter((row) => row.kelas.some((item) => item.id === kelas.id)).length;
              const active = selectedKelasId === kelas.id;
              return (
                <button
                  key={kelas.id}
                  onClick={() => setSelectedKelasId(active ? null : kelas.id)}
                  type="button"
                  aria-pressed={active}
                  className={`min-h-20 rounded-md border p-4 text-left transition-colors ${active ? "border-[var(--brand)] bg-[var(--tint)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--tint)]"}`}
                >
                  <p className="text-sm font-semibold text-[var(--fg)]">{kelas.judul}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{count} siswa mengumpulkan jawaban</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedKelasId && (
        <div className="mt-6">
          <TabelNilai asesmenId={asesmenId} judulAsesmen={hasil.asesmen.judul} jenisAsesmen={hasil.asesmen.tipe} mataPelajaran={hasil.asesmen.mapel ?? "-"} kelasId={selectedKelasId} kelasNama={kelasTujuan.find((item) => item.kelas.id === selectedKelasId)?.kelas.judul ?? "-"} nilaiList={selectedRows} readOnly basePath="/kepsek/asesmen" />
        </div>
      )}
    </div></KepsekShell>
  );
}