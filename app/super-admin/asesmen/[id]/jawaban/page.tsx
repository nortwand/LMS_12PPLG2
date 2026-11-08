"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";
import { PANEL } from "@/app/super-admin/_ui";

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

interface JawabanSaya {
  submissionId: string;
  status: string;
  submittedAt: string | null;
  nilaiAkhir: number | null;
}

export default function SuperAdminJawabanPage() {
  const params = useParams();
  const asesmenId = params.id as string;
  const [hasil, setHasil] = useState<NilaiResponse | null>(null);
  const [kelasTujuan, setKelasTujuan] = useState<KelasTujuan[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jawabanSaya, setJawabanSaya] = useState<JawabanSaya | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [nilaiRes, asesmenRes, jawabanSayaRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/nilai`),
        fetch(`/api/asesmen/${asesmenId}`),
        fetch(`/api/asesmen/${asesmenId}/jawaban-saya`),
      ]);
      const nilaiData = await nilaiRes.json();
      const asesmenData = await asesmenRes.json();
      const jawabanSayaData = await jawabanSayaRes.json();
      if (!nilaiRes.ok) {
        setError(nilaiData.error ?? "Gagal memuat jawaban.");
        return;
      }
      if (!jawabanSayaRes.ok) {
        setError(jawabanSayaData.error ?? "Gagal memuat jawaban Super Admin.");
        return;
      }
      setHasil(nilaiData.data);
      setKelasTujuan(asesmenData.data?.kelasTujuan ?? []);
      setJawabanSaya(jawabanSayaData.data);
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
      <Link href={`/super-admin/asesmen/${asesmenId}`} className="inline-flex items-center text-sm font-medium text-[var(--link)] hover:underline">
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

      <section className={`${PANEL} border-l-4 border-l-[var(--brand)]`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">Submission pribadi</p>
            <h2 className="mt-1 text-base font-semibold">Jawaban Super Admin</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {jawabanSaya?.status === "SUDAH"
                ? "Jawaban asesmen dari akun Super Admin kamu sudah dikumpulkan."
                : jawabanSaya
                  ? "Asesmen ini masih dikerjakan dan belum dikumpulkan."
                  : "Kamu belum mengerjakan asesmen ini."}
            </p>
          </div>
          {jawabanSaya?.status === "SUDAH" ? (
            <Link
              href={`/super-admin/asesmen/${asesmenId}/jawaban/${jawabanSaya.submissionId}`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand)] px-3 text-xs font-medium text-[var(--on-brand)]"
            >
              Lihat jawaban saya
            </Link>
          ) : (
            <Link
              href={`/super-admin/asesmen/${asesmenId}/kerjakan`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-strong)] px-3 text-xs font-medium text-[var(--fg)] hover:bg-[var(--tint)]"
            >
              {jawabanSaya ? "Lanjutkan asesmen" : "Kerjakan asesmen"}
            </Link>
          )}
        </div>
      </section>

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
            basePath="/super-admin/asesmen"
            onReset={loadData}
          />
        </div>
      )}
    </div>
  );
}