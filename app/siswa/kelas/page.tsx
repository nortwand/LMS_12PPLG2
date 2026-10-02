"use client";

import { useEffect, useMemo, useState } from "react";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { PageTitle, PANEL } from "@/app/guru/_ui";

export default function SiswaKelasPage() {
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKelas();
  }, []);

  async function loadKelas() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Gagal memuat daftar kelas.");
      }

      setKelasList(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar kelas.");
    } finally {
      setLoading(false);
    }
  }

  const filteredKelas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return kelasList;
    return kelasList.filter((kelas) =>
      `${kelas.judul} ${kelas.deskripsi ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [kelasList, query]);

  return (
    <div className="space-y-6">
      <PageTitle title="Kelas Saya" desc="Buka ruang kelas untuk melihat pengumuman dan kegiatan belajar." />

      {loading && <p className="text-sm text-[var(--muted)]">Memuat kelas...</p>}

      {!loading && error && (
        <div role="alert" className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {!loading && !error && kelasList.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center">
          <p className="text-base font-semibold">Belum ada kelas</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Kamu belum tergabung di kelas yang dibuat admin.</p>
        </div>
      )}

      {!loading && !error && kelasList.length > 0 && (
        <section className={PANEL}>
          <label className="block max-w-md text-xs font-medium text-[var(--muted)]">
            Cari kelas
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nama atau deskripsi kelas"
              className="mt-1 h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
            />
          </label>
          {filteredKelas.length === 0 ? (
            <p className="mt-5 text-sm text-[var(--muted)]">Tidak ada kelas yang cocok dengan pencarian.</p>
          ) : (
            <div className="mt-4">
              {filteredKelas.map((kelas) => (
                <KelasCard key={kelas.id} data={kelas} variant="list" basePath="/siswa/kelas" />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
