"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageTitle, PANEL } from "@/app/guru/_ui";

interface KelasGuru {
  id: string;
  judul: string;
  deskripsi: string | null;
  _count: { siswa: number };
}

export default function GuruKelasPage() {
  const [kelas, setKelas] = useState<KelasGuru[]>([]);
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
  const totalSiswa = kelas.reduce((total, item) => total + item._count.siswa, 0);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Kelas yang Diampu"
        desc="Buka ruang kelas untuk melihat siswa dan aktivitas pembelajaran."
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:max-w-md">
        <div className="bg-[var(--surface)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Kelas</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{kelas.length}</p>
        </div>
        <div className="bg-[var(--surface)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Siswa</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{totalSiswa}</p>
        </div>
      </div>

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
          <div className="mt-4 divide-y divide-[var(--border)]">
            {filteredKelas.map((item) => (
              <Link
                key={item.id}
                href={`/guru/kelas/${item.id}`}
                className="flex min-h-16 items-center justify-between gap-4 py-3 hover:bg-[var(--tint)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.judul}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                    {item.deskripsi || "Belum ada deskripsi kelas"}
                  </span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-3">
                  <span className="text-xs tabular-nums text-[var(--muted)]">{item._count.siswa} siswa</span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--muted)]">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}