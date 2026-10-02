"use client";

import { useEffect, useMemo, useState } from "react";
import TugasCard, { type TugasData } from "@/components/TugasCard";
import { INPUT, LABEL, PageTitle, PANEL } from "@/app/guru/_ui";

interface KelasOption {
  id: string;
  judul: string;
}

export default function SiswaTugasPage() {
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [kelasFilter, setKelasFilter] = useState("");
  const [query, setQuery] = useState("");
  const [siswaId, setSiswaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTugas() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tugas");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Gagal memuat tugas.");
      setTugasList(payload.data ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal memuat tugas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTugas();
    fetch("/api/kelas")
      .then((response) => response.json())
      .then((payload) => setKelasList(payload.data ?? []))
      .catch(() => {});
    fetch("/api/me")
      .then((response) => response.json())
      .then((payload) => setSiswaId(payload.data?.id ?? ""))
      .catch(() => {});
  }, []);

  const visibleTugas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tugasList.filter((tugas) => {
      const matchesKelas = !kelasFilter || tugas.kelasTujuan?.some((item) => item.kelas.id === kelasFilter);
      const matchesQuery = !normalizedQuery || `${tugas.judul} ${tugas.isi ?? ""} ${tugas.mapel?.nama ?? ""}`.toLowerCase().includes(normalizedQuery);
      return matchesKelas && matchesQuery;
    });
  }, [tugasList, kelasFilter, query]);
  const pendingTugas = visibleTugas.filter((tugas) => tugas.statusSubmission !== "SUDAH");
  const submittedTugas = visibleTugas.filter((tugas) => tugas.statusSubmission === "SUDAH");

  return (
    <div className="space-y-6">
      <PageTitle title="Tugas" desc="Tinjau tugas dari kelasmu dan kirimkan jawaban sebelum tenggat." />

      <section className={PANEL}>
        <div className="grid gap-3 md:grid-cols-[minmax(180px,240px)_minmax(220px,1fr)]">
          <label className={LABEL}>
            Kelas
            <select className={`${INPUT} mt-1`} value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)}>
              <option value="">Semua kelas</option>
              {kelasList.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>)}
            </select>
          </label>
          <label className={LABEL}>
            Cari tugas
            <input className={`${INPUT} mt-1`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Judul, deskripsi, atau mata pelajaran" />
          </label>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Memuat tugas...</p>
      ) : error ? (
        <p role="alert" className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-4 text-sm text-[var(--danger)]">{error}</p>
      ) : visibleTugas.length === 0 ? (
        <p className={`${PANEL} text-sm text-[var(--muted)]`}>{tugasList.length ? "Tidak ada tugas yang cocok dengan pencarian." : "Belum ada tugas dari kelasmu."}</p>
      ) : (
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Perlu Dikumpulkan</h2>
              <span className="text-xs tabular-nums text-[var(--muted)]">{pendingTugas.length}</span>
            </div>
            {pendingTugas.length ? <div className="space-y-3">{pendingTugas.map((tugas) => <TugasCard key={tugas.id} data={tugas} currentUserId={siswaId} role="SISWA" onSubmissionChanged={loadTugas} />)}</div> : <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">Semua tugas sudah dikumpulkan.</p>}
          </section>
          {submittedTugas.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Sudah Dikumpulkan</h2>
                <span className="text-xs tabular-nums text-[var(--muted)]">{submittedTugas.length}</span>
              </div>
              <div className="space-y-3">{submittedTugas.map((tugas) => <TugasCard key={tugas.id} data={tugas} currentUserId={siswaId} role="SISWA" onSubmissionChanged={loadTugas} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}