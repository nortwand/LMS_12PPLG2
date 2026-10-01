"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkBtn, Pill, PageTitle, StatGrid, PANEL } from "@/app/guru/_ui";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token (--bg, --brand, dst.) disediakan oleh app/guru/layout.tsx.
*/

interface GuruDashboardData {
  statistik: { totalKelas: number; totalSiswa: number; totalAsesmen: number; totalTugas: number; submissionDinilai: number; essayBelumDinilai: number; tugasDikumpulkan: number };
  kelas: { id: string; judul: string; _count: { siswa: number } }[];
  asesmenTerbaru: { id: string; judul: string; tipe: "KUIS" | "UJIAN"; status: "PROSES" | "SELESAI"; updatedAt: string }[];
  tugasTerbaru: { id: string; judul: string; createdAt: string; _count: { submission: number } }[];
}

export default function GuruDashboardPage() {
  const [data, setData] = useState<GuruDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guru/dashboard")
      .then((res) => res.json())
      .then((result) => setData(result.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--muted)]">Memuat dashboard...</p>;
  if (!data) return <p role="alert" className="text-sm text-[var(--danger)]">Dashboard guru gagal dimuat.</p>;

  const statistik = [
    { label: "Kelas Diampu", value: data.statistik.totalKelas, caption: "Kelas yang kamu ajar" },
    { label: "Total Siswa", value: data.statistik.totalSiswa, caption: "Siswa di kelasmu" },
    { label: "Asesmen", value: data.statistik.totalAsesmen, caption: "Kuis dan ujian" },
    { label: "Tugas", value: data.statistik.totalTugas, caption: "Tugas yang dibuat" },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Selamat datang di ruang mengajar"
        desc="Pantau kelas, asesmen, tugas, dan pekerjaan penilaianmu dari satu tempat."
      />

      <StatGrid items={statistik} />

      <div className="grid gap-5 md:grid-cols-2">
        <section className={PANEL}>
          <h2 className="text-base font-semibold">Perlu Ditangani</h2>
          <div className="mt-4 divide-y divide-[var(--border)]">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm">Essay belum dinilai</span>
              <strong className="text-base font-semibold tabular-nums">{data.statistik.essayBelumDinilai}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm">Tugas sudah dikumpulkan</span>
              <strong className="text-base font-semibold tabular-nums">{data.statistik.tugasDikumpulkan}</strong>
            </div>
          </div>
        </section>

        <section className={PANEL}>
          <h2 className="text-base font-semibold">Aksi Cepat</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LinkBtn href="/guru/asesmen" size="sm">Buat Asesmen</LinkBtn>
            <LinkBtn href="/guru/tugas" size="sm" variant="outline">Buat Tugas</LinkBtn>
            <LinkBtn href="/guru/materi" size="sm" variant="outline">Upload Materi</LinkBtn>
            <LinkBtn href="/guru/kelas" size="sm" variant="outline">Lihat Kelas</LinkBtn>
          </div>
        </section>
      </div>

      <section className={PANEL}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Kelas yang Diampu</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Ringkasan jumlah siswa per kelas.</p>
          </div>
          <Link href="/guru/kelas" className="text-sm font-medium text-[var(--link)] underline-offset-4 hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.kelas.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Belum ada kelas yang diampu.</p>
          ) : (
            data.kelas.map((kelas) => (
              <Link
                key={kelas.id}
                href={`/guru/kelas/${kelas.id}`}
                className="rounded-md border border-[var(--border)] p-4 hover:bg-[var(--tint)]"
              >
                <p className="truncate text-sm font-medium">{kelas.judul}</p>
                <p className="mt-1 text-xs tabular-nums text-[var(--muted)]">{kelas._count.siswa} siswa</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={PANEL}>
          <h2 className="text-base font-semibold">Asesmen Terbaru</h2>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {data.asesmenTerbaru.length === 0 ? (
              <p className="py-3 text-sm text-[var(--muted)]">Belum ada asesmen.</p>
            ) : (
              data.asesmenTerbaru.map((asesmen) => (
                <Link
                  key={asesmen.id}
                  href={`/guru/asesmen/${asesmen.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 py-3 hover:bg-[var(--tint)]"
                >
                  <span className="min-w-0 truncate text-sm font-medium">{asesmen.judul}</span>
                  <Pill tone={asesmen.status === "SELESAI" ? "brand" : "muted"}>
                    {asesmen.tipe === "KUIS" ? "Kuis" : "Ujian"}
                  </Pill>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className={PANEL}>
          <h2 className="text-base font-semibold">Tugas Terbaru</h2>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {data.tugasTerbaru.length === 0 ? (
              <p className="py-3 text-sm text-[var(--muted)]">Belum ada tugas.</p>
            ) : (
              data.tugasTerbaru.map((tugas) => (
                <Link
                  key={tugas.id}
                  href={`/guru/tugas/${tugas.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 py-3 hover:bg-[var(--tint)]"
                >
                  <span className="min-w-0 truncate text-sm font-medium">{tugas.judul}</span>
                  <span className="flex-shrink-0 text-xs tabular-nums text-[var(--muted)]">
                    {tugas._count.submission} terkumpul
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}