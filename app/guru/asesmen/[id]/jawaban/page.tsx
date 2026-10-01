"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";
import { PANEL } from "@/app/guru/_ui";

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

export default function GuruJawabanPage() {
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

  if (loading) return <p className="text-sm text-[var(--muted)]">Memuat jawaban...</p>;
  if (!hasil) return <p className="text-sm text-[var(--danger)]">{error || "Jawaban tidak ditemukan."}</p>;

  return (
    <div className="space-y-6 pb-10">
      <Link href={`/guru/asesmen/${asesmenId}`} className="inline-flex items-center text-sm font-medium text-[var(--link)] hover:underline">
        &larr; Kembali ke Asesmen
      </Link>

      <div className={`${PANEL} border-t-4 border-t-[var(--brand)]`}>
        <p className="text-xs font-medium text-[var(--muted)]">Jawaban siswa</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{hasil.asesmen.judul}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
          {hasil.asesmen.mapel && <Badge tone="gray">{hasil.asesmen.mapel}</Badge>}
          <Badge tone="green">{hasil.nilai.length} sudah mengumpulkan</Badge>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div>
        <h2 className="mb-3 text-base font-semibold">Daftar per kelas</h2>
        {kelasTujuan.length === 0 ? (
          <p className={`${PANEL} text-sm text-[var(--muted)]`}>Belum ada kelas tujuan.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasTujuan.map(({ kelas }) => {
              const count = hasil.nilai.filter((row) => row.kelas.some((item) => item.id === kelas.id)).length;
              const active = selectedKelasId === kelas.id;
              return (
                <button
                  key={kelas.id}
                  onClick={() => setSelectedKelasId(active ? null : kelas.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${active ? "border-[var(--brand)] bg-[var(--tint)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--tint)]"}`}
                >
                  <p className="font-semibold">{kelas.judul}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{count} siswa mengumpulkan jawaban</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedKelasId && (
        <div className="mt-6">
          <TabelNilai
            asesmenId={asesmenId}
            judulAsesmen={hasil.asesmen.judul}
            jenisAsesmen={hasil.asesmen.tipe}
            mataPelajaran={hasil.asesmen.mapel ?? "-"}
            kelasId={selectedKelasId}
            kelasNama={kelasTujuan.find((item) => item.kelas.id === selectedKelasId)?.kelas.judul ?? "-"}
            nilaiList={selectedRows}
            onReset={loadData}
          />
        </div>
      )}
    </div>
  );
}