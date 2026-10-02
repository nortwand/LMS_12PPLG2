"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import MateriCard, { MateriData } from "@/components/MateriCard";
import { LinkBtn, PageTitle, PANEL } from "@/app/guru/_ui";

type DashboardData = {
  siswa: {
    id: string;
    nama: string;
    kelasJurusan: string;
  };
  statistik: {
    totalKelas: number;
    totalAsesmen: number;
    asesmenSudah: number;
    asesmenSedang: number;
    asesmenBelum: number;
    totalTugas: number;
    tugasSudah: number;
    tugasBelum: number;
    rataRataNilai: number | null;
  };
  asesmenTerbaru: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    statusSubmission: "BELUM" | "SEDANG" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  tugasTerbaru: Array<{
    id: string;
    judul: string;
    statusSubmission: "BELUM" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  tugasBelumDikumpulkan: Array<{
    id: string;
    judul: string;
    statusSubmission: "BELUM" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  asesmenSedangDikerjakan: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    statusSubmission: "BELUM" | "SEDANG" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  materiHariIni: MateriData[];
  nilaiTerbaru: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    nilai: number | null;
    mapel: string;
    submittedAt: string | null;
  }>;
};

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="bg-[var(--surface)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{helper}</p>
    </div>
  );
}

export default function SiswaDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/siswa/dashboard");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat dashboard siswa.");
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat dashboard siswa.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={PANEL}>
          <div className="h-6 w-48 animate-pulse rounded bg-[var(--tint)]" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-[var(--tint)]" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse bg-[var(--surface)] p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-6 text-[var(--danger)]">
        <p className="text-base font-semibold">Gagal memuat dashboard</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center">
        <p className="text-base font-semibold">Belum ada data</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Belum ada aktivitas kelas, tugas, atau asesmen untuk akun Anda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Selamat datang, ${data.siswa.nama}`}
        desc={`Ringkasan kelas dan kegiatan belajarmu${data.siswa.kelasJurusan ? ` · ${data.siswa.kelasJurusan}` : ""}.`}
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
        <StatCard label="Total Kelas" value={String(data.statistik.totalKelas)} helper="Kelas yang diikuti" />
        <StatCard label="Total Asesmen" value={String(data.statistik.totalAsesmen)} helper="Kuis & ujian" />
        <StatCard label="Asesmen Selesai" value={String(data.statistik.asesmenSudah)} helper="Sudah dikerjakan" />
        <StatCard label="Asesmen Sedang" value={String(data.statistik.asesmenSedang)} helper="Dikerjakan saat ini" />
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
        <StatCard label="Asesmen Belum" value={String(data.statistik.asesmenBelum)} helper="Belum dikerjakan" />
        <StatCard label="Total Tugas" value={String(data.statistik.totalTugas)} helper="Tugas yang tersedia" />
        <StatCard label="Tugas Sudah" value={String(data.statistik.tugasSudah)} helper="Sudah dikumpulkan" />
        <StatCard label="Tugas Belum" value={String(data.statistik.tugasBelum)} helper="Belum dikumpulkan" />
      </div>

      <section className={`${PANEL} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Rata-rata Nilai Asesmen</p>
          <Badge tone={data.statistik.rataRataNilai !== null ? "green" : "gray"}>
            {data.statistik.rataRataNilai !== null ? `${data.statistik.rataRataNilai}` : "Belum ada nilai"}
          </Badge>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={PANEL}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Aksi Cepat</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <LinkBtn href="/siswa/asesmen" size="sm">Kerjakan Asesmen</LinkBtn>
            <LinkBtn href="/siswa/tugas" size="sm" variant="outline">Lihat Tugas</LinkBtn>
            <LinkBtn href="/siswa/materi" size="sm" variant="outline">Lihat Materi</LinkBtn>
          </div>
        </section>

        <section className={PANEL}>
          <p className="text-sm font-semibold">Materi Hari Ini</p>
          <div className="mt-3 space-y-3">
            {data.materiHariIni.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Belum ada materi baru hari ini.</p>
            ) : (
              <div className="space-y-2">{data.materiHariIni.map((item) => <MateriCard key={item.id} data={item} />)}</div>
            )}
          </div>
        </section>

        <section className={PANEL}>
          <p className="text-sm font-semibold">Nilai Terbaru</p>
          <div className="mt-3 space-y-3">
            {data.nilaiTerbaru.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Belum ada nilai yang tersedia.</p>
            ) : (
              data.nilaiTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{item.judul}</p>
                    <p className="text-xs text-[var(--muted)]">{item.mapel}</p>
                  </div>
                  <Badge tone={item.nilai !== null && item.nilai >= 75 ? "green" : item.nilai !== null ? "amber" : "gray"}>
                    {item.nilai !== null ? `${item.nilai}` : "-"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={PANEL}>
          <p className="text-sm font-semibold">Asesmen Terbaru</p>
          <div className="mt-3 space-y-3">
            {data.asesmenTerbaru.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Belum ada asesmen.</p>
            ) : (
              data.asesmenTerbaru.map((item) => (
                <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className="block rounded-md border border-[var(--border)] p-3 transition hover:bg-[var(--tint)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.judul}</p>
                      <p className="text-xs text-[var(--muted)]">{item.mapel?.nama ?? "Umum"}</p>
                    </div>
                    <Badge tone={item.statusSubmission === "SUDAH" ? "green" : item.statusSubmission === "SEDANG" ? "amber" : "red"}>
                      {item.statusSubmission === "SUDAH" ? "Selesai" : item.statusSubmission === "SEDANG" ? "Sedang" : "Belum"}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className={PANEL}>
          <p className="text-sm font-semibold">Tugas Terbaru</p>
          <div className="mt-3 space-y-3">
            {data.tugasTerbaru.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Belum ada tugas.</p>
            ) : (
              data.tugasTerbaru.map((item) => (
                <Link key={item.id} href="/siswa/tugas" className="block rounded-md border border-[var(--border)] p-3 transition hover:bg-[var(--tint)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.judul}</p>
                      <p className="text-xs text-[var(--muted)]">{item.mapel?.nama ?? "Umum"}</p>
                    </div>
                    <Badge tone={item.statusSubmission === "SUDAH" ? "green" : "red"}>
                      {item.statusSubmission === "SUDAH" ? "Sudah" : "Belum"}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={PANEL}>
          <p className="text-sm font-semibold">Tugas yang Belum Dikumpulkan</p>
          <div className="mt-3 space-y-3">
            {data.tugasBelumDikumpulkan.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Semua tugas sudah dikumpulkan.</p>
            ) : (
              data.tugasBelumDikumpulkan.map((item) => (
                <Link key={item.id} href="/siswa/tugas" className="block rounded-md border border-[var(--border)] p-3 transition hover:bg-[var(--tint)]">
                  <p className="text-sm font-medium">{item.judul}</p>
                  <p className="text-xs text-[var(--muted)]">{item.mapel?.nama ?? "Umum"}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className={PANEL}>
          <p className="text-sm font-semibold">Asesmen yang Sedang Dikerjakan</p>
          <div className="mt-3 space-y-3">
            {data.asesmenSedangDikerjakan.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Tidak ada asesmen yang sedang dikerjakan.</p>
            ) : (
              data.asesmenSedangDikerjakan.map((item) => (
                <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className="block rounded-md border border-[var(--border)] p-3 transition hover:bg-[var(--tint)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.judul}</p>
                      <p className="text-xs text-[var(--muted)]">{item.mapel?.nama ?? "Umum"}</p>
                    </div>
                    <Badge tone="amber">Sedang</Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
