"use client";

import { useEffect, useState } from "react";
import MateriCard, { MateriData } from "@/components/MateriCard";
import { LABEL, PageTitle, PANEL, INPUT } from "@/app/guru/_ui";

export default function SiswaMateriPage() {
  const [materiList, setMateriList] = useState<MateriData[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [kelasFilter, setKelasFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMateri() {
      setLoading(true);
      try {
        const res = await fetch("/api/materi");
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Gagal memuat materi.");
        setMateriList(payload.data ?? []);
      } catch {
        setMateriList([]);
        setError("Materi gagal dimuat. Coba muat ulang halaman.");
      } finally {
        setLoading(false);
      }
    }

    void loadMateri();
    fetch("/api/kelas")
      .then((res) => res.json())
      .then((payload) => setKelasList(payload.data ?? []))
      .catch(() => {});
  }, []);

  const visibleMateri = materiList.filter((materi) =>
    !kelasFilter || materi.kelasTujuan?.some((item) => item.kelas.id === kelasFilter)
  );
  const isToday = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  };
  const materiHariIni = visibleMateri.filter((materi) => isToday(materi.createdAt));
  const materiHistory = visibleMateri.filter((materi) => !isToday(materi.createdAt));

  return (
    <div className="space-y-6">
      <PageTitle title="Materi" desc="Materi pembelajaran dari kelas yang kamu ikuti." />

      <label className={`${LABEL} block max-w-sm`}>
        Filter kelas
        <select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)} className={`${INPUT} mt-1`}>
          <option value="">Semua kelas</option>
          {kelasList.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>)}
        </select>
      </label>

      {loading ? <p className="text-sm text-[var(--muted)]">Memuat materi...</p> : error ? (
        <p role="alert" className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-4 text-sm text-[var(--danger)]">{error}</p>
      ) : (
        <div className="space-y-7">
          <section>
            <h2 className="mb-3 text-base font-semibold">Materi Hari Ini</h2>
            <div className="space-y-2">
              {materiHariIni.length ? materiHariIni.map((item) => <MateriCard key={item.id} data={item} />) : (
                <p className={`${PANEL} border-dashed text-sm text-[var(--muted)]`}>Belum ada materi hari ini.</p>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">History</h2>
            <div className="space-y-2">
              {materiHistory.length ? materiHistory.map((item) => <MateriCard key={item.id} data={item} />) : (
                <p className={`${PANEL} border-dashed text-sm text-[var(--muted)]`}>Belum ada riwayat materi.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
