"use client";

import { useEffect, useMemo, useState } from "react";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { PageTitle, PANEL } from "@/app/guru/_ui";

export default function GuruKelasPage() {
  const [kelas, setKelas] = useState<KelasData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/kelas")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Daftar kelas gagal dimuat.");
        setKelas(payload.data ?? []);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Daftar kelas gagal dimuat.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredKelas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return kelas;
    return kelas.filter((item) =>
      `${item.judul} ${item.deskripsi ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [kelas, query]);
  return (
    <div className="space-y-6">
      <PageTitle
        title="Kelas yang Diampu"
        desc="Buka ruang kelas untuk melihat siswa dan aktivitas pembelajaran."
      />

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

        {loading ? (
          <p className="mt-5 text-sm text-[var(--muted)]">Memuat kelas...</p>
        ) : error ? (
          <p role="alert" className="mt-5 text-sm text-[var(--danger)]">{error}</p>
        ) : filteredKelas.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--muted)]">
            {kelas.length === 0 ? "Belum ada kelas yang diampu." : "Tidak ada kelas yang cocok dengan pencarian."}
          </p>
        ) : (
          <div className="mt-4">
            {filteredKelas.map((item) => (
              <KelasCard key={item.id} data={item} variant="list" basePath="/guru/kelas" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}