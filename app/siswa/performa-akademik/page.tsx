"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { PageTitle, PANEL } from "@/app/guru/_ui";

type RangeKey = "semua" | "bulan" | "3bulan" | "tahun";
type AssessmentItem = { id: string; judul: string; tipe: "KUIS" | "UJIAN"; nilai: number; mapel: string; tanggal: string };
type PerformanceData = {
  summary: { rataRataSemua: number | null; rataRataKuis: number | null; rataRataUjian: number | null; asesmenSudah: number; asesmenBelum: number; asesmenSedang: number; tugasSudah: number; tugasBelum: number; essaySudahDinilai: number; essayBelumDinilai: number };
  perkembanganNilai: AssessmentItem[];
  perbandinganTipe: Array<{ label: string; nilai: number | null }>;
  progressTugas: { sudah: number; belum: number };
  nilaiPerMapel: Array<{ mapel: string; nilai: number | null }>;
  nilaiTerbaru: AssessmentItem[];
  nilaiTertinggi: AssessmentItem[];
  asesmenBelumDikerjakan: Array<{ id: string; judul: string; tipe: "KUIS" | "UJIAN"; mapel: string }>;
  tugasBelumDikumpulkan: Array<{ id: string; judul: string; mapel: string }>;
};

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "bulan", label: "Bulan Ini" },
  { key: "3bulan", label: "3 Bulan Terakhir" },
  { key: "tahun", label: "Tahun Ini" },
];

function StatCard({ label, value }: { label: string; value: number | null }) {
  return <div className="bg-[var(--surface)] p-4"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value === null ? "-" : value}</p></div>;
}

function LineChart({ items }: { items: AssessmentItem[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted)]">Belum ada nilai untuk menampilkan perkembangan.</p>;
  const xFor = (index: number) => items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
  const points = items.map((item, index) => `${xFor(index)},${100 - item.nilai}`).join(" ");
  return (
    <div className="overflow-x-auto"><div className="min-w-[420px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible">
        <polyline points={points} fill="none" style={{ stroke: "var(--chart-1)" }} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {items.map((item, index) => <circle key={item.id} cx={xFor(index)} cy={100 - item.nilai} r="2" style={{ fill: "var(--chart-1)" }} vectorEffect="non-scaling-stroke"><title>{`${item.judul}: ${item.nilai}`}</title></circle>)}
      </svg>
      <div className="mt-2 flex justify-between gap-2">{items.map((item) => <span key={item.id} className="max-w-16 truncate text-[10px] text-[var(--muted)]">{item.judul}</span>)}</div>
    </div></div>
  );
}

function HorizontalBars({ items }: { items: Array<{ label: string; value: number | null }> }) {
  const available = items.filter((item): item is { label: string; value: number } => item.value !== null);
  if (!available.length) return <p className="text-sm text-[var(--muted)]">Belum ada nilai berdasarkan mata pelajaran.</p>;
  return <div className="space-y-4">{available.map((item) => (
    <div key={item.label}>
      <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{item.label}</span><strong className="tabular-nums">{item.value}</strong></div>
      <div className="h-2 rounded-sm bg-[var(--tint)]"><div className="h-2 rounded-sm bg-[var(--chart-1)]" style={{ width: `${Math.max(item.value, 0)}%` }} /></div>
    </div>
  ))}</div>;
}

function AssessmentList({ items, empty }: { items: AssessmentItem[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  return <div className="divide-y divide-[var(--border)]">{items.map((item) => (
    <div key={item.id} className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="truncate text-sm font-medium">{item.judul}</p><p className="text-xs text-[var(--muted)]">{item.mapel} · {item.tipe}</p></div>
      <Badge tone={item.nilai >= 75 ? "green" : "amber"}>{item.nilai}</Badge>
    </div>
  ))}</div>;
}

export default function SiswaPerformaAkademikPage() {
  const [range, setRange] = useState<RangeKey>("semua");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/siswa/performa?range=${range}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat performa akademik.");
        if (!ignore) setData(payload.data ?? null);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat performa akademik.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void load();
    return () => { ignore = true; };
  }, [range]);

  const comparisonMax = useMemo(() => Math.max(...(data?.perbandinganTipe.map((item) => item.nilai ?? 0) ?? [1]), 1), [data]);

  if (loading) return <div className="space-y-6"><div className={PANEL}><div className="h-6 w-48 animate-pulse rounded bg-[var(--tint)]" /><div className="mt-4 h-9 w-72 animate-pulse rounded bg-[var(--tint)]" /></div><div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-24 animate-pulse bg-[var(--surface)]" />)}</div></div>;
  if (error) return <div role="alert" className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-6 text-[var(--danger)]"><p className="font-semibold">Gagal memuat performa akademik</p><p className="mt-2 text-sm">{error}</p></div>;
  if (!data) return <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center"><p className="font-semibold">Belum ada data performa akademik.</p></div>;

  const summary = data.summary;
  const hasActivity = data.perkembanganNilai.length > 0 || summary.asesmenBelum > 0 || summary.asesmenSedang > 0 || data.progressTugas.sudah > 0 || data.progressTugas.belum > 0;
  const totalTugas = data.progressTugas.sudah + data.progressTugas.belum;

  return (
    <div className="space-y-6">
      <PageTitle title="Performa Akademik" desc="Pantau nilai dan perkembangan kegiatan belajarmu." />
      <div role="group" aria-label="Rentang performa" className="flex flex-wrap gap-2">
        {RANGES.map((item) => <button key={item.key} type="button" aria-pressed={range === item.key} onClick={() => setRange(item.key)} className={`h-9 cursor-pointer rounded-md border px-3 text-xs font-medium ${range === item.key ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]" : "border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--tint)]"}`}>{item.label}</button>)}
      </div>

      {!hasActivity && <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center"><p className="font-semibold">Belum ada nilai atau aktivitas akademik.</p><p className="mt-2 text-sm text-[var(--muted)]">Nilai dan grafik akan muncul setelah kamu mengerjakan asesmen atau mengumpulkan tugas.</p></div>}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
        <StatCard label="Rata-rata seluruh asesmen" value={summary.rataRataSemua} /><StatCard label="Rata-rata kuis" value={summary.rataRataKuis} /><StatCard label="Rata-rata ujian online" value={summary.rataRataUjian} /><StatCard label="Asesmen sudah dikerjakan" value={summary.asesmenSudah} />
        <StatCard label="Asesmen belum dikerjakan" value={summary.asesmenBelum} /><StatCard label="Asesmen sedang dikerjakan" value={summary.asesmenSedang} /><StatCard label="Tugas sudah dikumpulkan" value={summary.tugasSudah} /><StatCard label="Tugas belum dikumpulkan" value={summary.tugasBelum} />
        <StatCard label="Essay sudah dinilai" value={summary.essaySudahDinilai} /><StatCard label="Essay belum dinilai" value={summary.essayBelumDinilai} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={PANEL}><h2 className="text-sm font-semibold">Perkembangan Nilai Berdasarkan Asesmen</h2><div className="mt-5"><LineChart items={data.perkembanganNilai} /></div></section>
        <section className={PANEL}>
          <h2 className="text-sm font-semibold">Perbandingan Nilai Kuis dan Ujian</h2>
          <div className="mt-5 flex h-48 items-end justify-center gap-10">{data.perbandinganTipe.map((item, index) => <div key={item.label} className="flex h-full w-20 flex-col items-center justify-end gap-2"><span className="text-sm font-semibold tabular-nums">{item.nilai === null ? "-" : item.nilai}</span><div className={`w-12 rounded-t-md ${index === 0 ? "bg-[var(--chart-1)]" : "bg-[var(--chart-2)]"}`} style={{ height: `${item.nilai === null ? 0 : Math.max((item.nilai / comparisonMax) * 80, 5)}%` }} /><span className="text-xs text-[var(--muted)]">{item.label}</span></div>)}</div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={PANEL}><h2 className="text-sm font-semibold">Progress Tugas</h2><div className="mt-5 space-y-4">{([["Sudah dikumpulkan", data.progressTugas.sudah], ["Belum dikumpulkan", data.progressTugas.belum]] as const).map(([label, value], index) => <div key={label}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div><div className="h-2 rounded-sm bg-[var(--tint)]"><div className={`h-2 rounded-sm ${index === 0 ? "bg-[var(--chart-1)]" : "bg-[var(--chart-2)]"}`} style={{ width: `${totalTugas ? (value / totalTugas) * 100 : 0}%` }} /></div></div>)}</div></section>
        <section className={PANEL}><h2 className="text-sm font-semibold">Nilai Berdasarkan Mata Pelajaran</h2><div className="mt-5"><HorizontalBars items={data.nilaiPerMapel.map((item) => ({ label: item.mapel, value: item.nilai }))} /></div></section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={PANEL}><h2 className="mb-2 text-sm font-semibold">Nilai Terbaru</h2><AssessmentList items={data.nilaiTerbaru} empty="Belum ada nilai." /></section>
        <section className={PANEL}><h2 className="mb-2 text-sm font-semibold">Asesmen dengan Nilai Tertinggi</h2><AssessmentList items={data.nilaiTertinggi} empty="Belum ada nilai." /></section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={PANEL}><h2 className="mb-3 text-sm font-semibold">Asesmen Belum Dikerjakan</h2>{data.asesmenBelumDikerjakan.length ? <div className="divide-y divide-[var(--border)]">{data.asesmenBelumDikerjakan.map((item) => <div key={item.id} className="py-3"><p className="text-sm font-medium">{item.judul}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.mapel} · {item.tipe}</p></div>)}</div> : <p className="text-sm text-[var(--muted)]">Tidak ada asesmen yang tertunda.</p>}</section>
        <section className={PANEL}><h2 className="mb-3 text-sm font-semibold">Tugas Belum Dikumpulkan</h2>{data.tugasBelumDikumpulkan.length ? <div className="divide-y divide-[var(--border)]">{data.tugasBelumDikumpulkan.map((item) => <div key={item.id} className="py-3"><p className="text-sm font-medium">{item.judul}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.mapel}</p></div>)}</div> : <p className="text-sm text-[var(--muted)]">Semua tugas sudah dikumpulkan.</p>}</section>
      </div>
    </div>
  );
}