"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { Btn, PageTitle, PANEL } from "@/app/guru/_ui";

type RangeKey = "semua" | "minggu" | "bulan" | "3bulan" | "tahun";

type PendingStudentItem = {
  type: "TUGAS" | "ESSAY";
  label: string;
  submittedAt: string | null;
};

type PendingStudent = {
  id: string;
  nama: string;
  kelas: string;
  items: PendingStudentItem[];
};

type PerformanceSummary = {
  totalKuis: number;
  totalUjian: number;
  rataRataNilaiKuis: number;
  rataRataNilaiUjian: number;
  rataRataNilaiSeluruhAsesmen: number;
  totalTugasDibuat: number;
  totalTugasDikumpulkan: number;
  persentasePengumpulanTugas: number;
  essayBelumDinilai: number;
  rataRataNilaiPerKelas: Array<{ kelas: string; rataRata: number }>;
  rataRataNilaiPerMapel: Array<{ mapel: string; rataRata: number }>;
  siswaBelumDinilai: PendingStudent[];
};

type PerformanceData = {
  range: RangeKey;
  summary: PerformanceSummary;
};

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "minggu", label: "Minggu ini" },
  { key: "bulan", label: "Bulan ini" },
  { key: "3bulan", label: "3 Bulan Terakhir" },
  { key: "tahun", label: "Tahun ini" },
];

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="bg-[var(--surface)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{helper}</p>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPercent(value: number): string {
  return `${Number(value).toFixed(1)}%`;
}

function formatAverage(value: number): string {
  return `${Number(value).toFixed(1)}`;
}

function ChartBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const height = max > 0 ? Math.max((value / max) * 100, 8) : 8;

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="flex h-36 w-full items-end justify-center rounded-md border border-[var(--border)] bg-[var(--tint)] p-3">
        <div
          className="w-14 rounded-t-xl transition-all duration-300"
          style={{ height: `${height}%`, background: color }}
          title={`${label}: ${value}`}
        />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function HorizontalBars({ items, suffix = "" }: { items: Array<{ label: string; value: number }>; suffix?: string }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Belum ada data untuk ditampilkan.</p>
      ) : (
        items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="font-semibold">{item.value}{suffix}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-sm bg-[var(--tint)]">
              <div
                className="h-full rounded-sm bg-[var(--chart-1)]"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function GuruPerformaAkademikPage() {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("bulan");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/guru/performa?range=${selectedRange}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat performa akademik.");
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat performa akademik.");
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
  }, [selectedRange]);

  const comparisonMax = useMemo(
    () => Math.max(data?.summary.totalKuis ?? 0, data?.summary.totalUjian ?? 0, 1),
    [data],
  );

  const classChart = useMemo(
    () =>
      (data?.summary.rataRataNilaiPerKelas ?? []).map((item) => ({
        label: item.kelas,
        value: item.rataRata,
      })),
    [data],
  );

  const mapelChart = useMemo(
    () =>
      (data?.summary.rataRataNilaiPerMapel ?? []).map((item) => ({
        label: item.mapel,
        value: item.rataRata,
      })),
    [data],
  );

  const hasData = Boolean(
    data &&
      (data.summary.totalKuis > 0 ||
        data.summary.totalUjian > 0 ||
        data.summary.totalTugasDibuat > 0 ||
        data.summary.totalTugasDikumpulkan > 0 ||
        data.summary.rataRataNilaiPerKelas.length > 0 ||
        data.summary.rataRataNilaiPerMapel.length > 0 ||
        data.summary.siswaBelumDinilai.length > 0),
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={PANEL}>
          <div className="h-6 w-40 animate-pulse rounded bg-[var(--tint)]" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-[var(--tint)]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-6 text-[var(--danger)]">
        <p className="text-base font-semibold">Gagal memuat data performa akademik</p>
        <p className="mt-2 text-sm">{error}</p>
        <Btn className="mt-4" size="sm" onClick={() => setSelectedRange((current) => current)}>
          Coba lagi
        </Btn>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center">
        <p className="text-base font-semibold">Belum ada data performa</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Data akan muncul setelah Anda membuat dan mengirim asesmen atau tugas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Performa Akademik"
        desc="Pantau nilai, tugas, dan kebutuhan penilaian berdasarkan rentang waktu."
      />
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`h-9 cursor-pointer rounded-md border px-3 text-xs font-medium ${selectedRange === option.key ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]" : "border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--tint)]"}`}
            onClick={() => setSelectedRange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
        <StatCard label="Total Kuis" value={formatNumber(data.summary.totalKuis)} helper="Kuis yang dibuat" />
        <StatCard label="Total Ujian" value={formatNumber(data.summary.totalUjian)} helper="Ujian online" />
        <StatCard label="Rata-rata Nilai Kuis" value={formatAverage(data.summary.rataRataNilaiKuis)} helper="Nilai kuis" />
        <StatCard label="Rata-rata Nilai Ujian" value={formatAverage(data.summary.rataRataNilaiUjian)} helper="Nilai ujian" />
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
        <StatCard label="Rata-rata Seluruh Asesmen" value={formatAverage(data.summary.rataRataNilaiSeluruhAsesmen)} helper="Semua nilai asesmen" />
        <StatCard label="Total Tugas Dibuat" value={formatNumber(data.summary.totalTugasDibuat)} helper="Tugas yang dibuat" />
        <StatCard label="Tugas Dikumpulkan" value={formatNumber(data.summary.totalTugasDikumpulkan)} helper="Submission siswa" />
        <StatCard label="Persentase Pengumpulan" value={formatPercent(data.summary.persentasePengumpulanTugas)} helper="Dari tugas yang dibuat" />
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center">
          <p className="text-base font-semibold">Belum ada data pada rentang waktu ini.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Buat kuis, ujian, atau tugas untuk melihat performa akademik di sini.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className={PANEL}>
              <p className="text-sm font-semibold">Perbandingan Kuis & Ujian</p>
              <div className="mt-5 flex items-end gap-6">
                <ChartBar label="Kuis" value={data.summary.totalKuis} max={comparisonMax} color="var(--chart-1)" />
                <ChartBar label="Ujian" value={data.summary.totalUjian} max={comparisonMax} color="var(--chart-2)" />
              </div>
            </div>

            <div className={PANEL}>
              <p className="text-sm font-semibold">Progress Tugas Dibuat vs Dikumpulkan</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Tugas dibuat</span>
                    <strong>{data.summary.totalTugasDibuat}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-[var(--tint)]">
                    <div className="h-full rounded-sm bg-[var(--chart-1)]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Tugas dikumpulkan</span>
                    <strong>{data.summary.totalTugasDikumpulkan}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-[var(--tint)]">
                    <div
                      className="h-full rounded-sm bg-[var(--chart-2)]"
                      style={{ width: `${data.summary.totalTugasDibuat > 0 ? (data.summary.totalTugasDikumpulkan / data.summary.totalTugasDibuat) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge tone="green">Pengumpulan: {formatPercent(data.summary.persentasePengumpulanTugas)}</Badge>
                  <Badge tone="amber">Essay belum dinilai: {data.summary.essayBelumDinilai}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className={PANEL}>
              <p className="text-sm font-semibold">Rata-rata Nilai per Kelas</p>
              <div className="mt-5">
                <HorizontalBars items={classChart} suffix="" />
              </div>
            </div>

            <div className={PANEL}>
              <p className="text-sm font-semibold">Rata-rata Nilai per Mata Pelajaran</p>
              <div className="mt-5">
                <HorizontalBars items={mapelChart} suffix="" />
              </div>
            </div>
          </div>

          <div className={PANEL}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Siswa dengan tugas atau essay belum dinilai</p>
              <Badge tone="amber">{data.summary.siswaBelumDinilai.length} siswa</Badge>
            </div>

            {data.summary.siswaBelumDinilai.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--tint)] p-4 text-sm text-[var(--muted)]">
                Tidak ada siswa dengan tugas atau essay yang menunggu penilaian.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.summary.siswaBelumDinilai.map((student) => (
                  <div key={student.id} className="rounded-md border border-[var(--border)] bg-[var(--tint)] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{student.nama}</p>
                        <p className="text-xs text-[var(--muted)]">{student.kelas}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.items.map((item, index) => (
                          <Badge key={`${student.id}-${index}`} tone={item.type === "ESSAY" ? "amber" : "brand"}>
                            {item.type === "ESSAY" ? "Essay" : "Tugas"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {student.items.map((item, index) => (
                        <li key={`${student.id}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <span>{item.label}</span>
                          <span className="text-xs text-[var(--muted)]">
                            {item.type === "TUGAS" && item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("id-ID") : "Essay menunggu review"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
