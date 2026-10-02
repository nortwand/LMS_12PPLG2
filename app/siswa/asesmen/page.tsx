// app/siswa/asesmen/page.tsx
"use client";

import { useEffect, useState } from "react";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import { showConfirm } from "@/lib/dialog";
import { INPUT, LABEL, PageTitle, PANEL } from "@/app/guru/_ui";

type StatusFilter = "SEMUA" | "BELUM" | "SEDANG" | "SUDAH";

export default function SiswaAsesmenPage() {
  const [asesmenList, setAsesmenList] = useState<(AsesmenData & { statusSubmission?: "BELUM" | "SEDANG" | "SUDAH" })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SEMUA");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });

  useEffect(() => {
    fetch("/api/asesmen")
      .then((res) => res.json())
      .then((data) => {
        if (!data.data) throw new Error(data.error ?? "Gagal memuat asesmen.");
        setAsesmenList(data.data);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat asesmen."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const userId = data.data?.id;
        if (!userId) return;
        const stored = window.localStorage.getItem(`studify:siswa:removed-asesmen:${userId}`);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setDismissedIds(parsed.filter((id): id is string => typeof id === "string"));
      })
      .catch(() => {});
  }, []);

  async function removeHistory(asesmen: AsesmenData) {
    const confirmed = await showConfirm(`Hapus kartu "${asesmen.judul}" dari tampilan history? Jawaban, nilai, dan submission tetap aman.`);
    if (!confirmed) return;

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const userId = data.data?.id;
        if (!userId) return;
        setDismissedIds((current) => {
          const next = current.includes(asesmen.id) ? current : [...current, asesmen.id];
          window.localStorage.setItem(`studify:siswa:removed-asesmen:${userId}`, JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {});
  }

  if (loading) return <div className="space-y-5"><div className={PANEL}><div className="h-6 w-40 animate-pulse rounded bg-[var(--tint)]" /></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-lg bg-[var(--surface)]" />)}</div></div>;
  if (error) return <div role="alert" className="rounded-lg border border-[var(--danger)] bg-[var(--tint)] p-5 text-sm text-[var(--danger)]">{error}</div>;

  const visibleAsesmenList = asesmenList.filter((asesmen) => !dismissedIds.includes(asesmen.id));
  const filteredAsesmenList = visibleAsesmenList.filter((asesmen) => {
    const matchesQuery = `${asesmen.judul} ${asesmen.mapel?.nama ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (statusFilter === "SEMUA" || asesmen.statusSubmission === statusFilter);
  });
  const sekarang = new Date();
  const awalHariIni = new Date(sekarang);
  awalHariIni.setHours(0, 0, 0, 0);
  const awalPeriodeTigaBulan = new Date(sekarang);
  awalPeriodeTigaBulan.setMonth(awalPeriodeTigaBulan.getMonth() - 3);
  const awalPeriodeSebelumnya = new Date(sekarang);
  awalPeriodeSebelumnya.setMonth(awalPeriodeSebelumnya.getMonth() - 6);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const asesmenHariIni = filteredAsesmenList.filter((asesmen) => tanggalAsesmen(asesmen) >= awalHariIni);
  const asesmenTigaBulan = filteredAsesmenList.filter((asesmen) => {
    const tanggal = tanggalAsesmen(asesmen);
    return tanggal >= awalPeriodeTigaBulan && tanggal < awalHariIni;
  });
  const historyAsesmen = filteredAsesmenList.filter((asesmen) => tanggalAsesmen(asesmen) < awalPeriodeTigaBulan);

  const kelompok = [
    { key: "hari-ini", judul: "Hari Ini", data: asesmenHariIni },
    { key: "tiga-bulan", judul: "3 Bulan Terakhir", data: asesmenTigaBulan },
    { key: "history", judul: "Riwayat Sebelumnya", data: historyAsesmen },
  ];

  function renderAsesmenCards(data: typeof asesmenList) {
    const kelompokTipe = [
      { judul: "Kuis", data: data.filter((asesmen) => asesmen.tipe === "KUIS") },
      { judul: "Ujian Online", data: data.filter((asesmen) => asesmen.tipe === "UJIAN") },
    ];
    return (
      <div className="space-y-5">
        {kelompokTipe.map((group) => group.data.length > 0 && (
          <div key={group.judul}>
            <p className="mb-3 text-xs font-medium text-[var(--muted)]">{group.judul}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.data.map((asesmen) => (
                <AsesmenCard key={asesmen.id} data={asesmen} basePath="/siswa/asesmen" submissionStatus={asesmen.statusSubmission} onRemove={removeHistory} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Asesmen" desc="Lihat kuis dan ujian, lalu lanjutkan atau tinjau hasil pengerjaan." />
      <section className={PANEL}>
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(240px,360px)] md:items-end">
          <label className={LABEL}>Status
            <select className={`${INPUT} mt-1`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="SEMUA">Semua status</option><option value="BELUM">Belum dikerjakan</option><option value="SEDANG">Sedang dikerjakan</option><option value="SUDAH">Selesai</option>
            </select>
          </label>
          <label className={LABEL}>Cari asesmen
            <input className={`${INPUT} mt-1`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Judul atau mata pelajaran" />
          </label>
        </div>
      </section>
      {filteredAsesmenList.length === 0 ? (
        <p className={`${PANEL} text-sm text-[var(--muted)]`}>{visibleAsesmenList.length === 0 ? "Belum ada asesmen yang ditampilkan. Data asesmen yang sudah kamu hapus dari tampilan tetap tersimpan." : "Tidak ada asesmen yang cocok dengan filter."}</p>
      ) : (
        <div className="space-y-5">
          {kelompok.map((group) => group.data.length > 0 && (
            <section key={group.key} className={PANEL}>
              <button
                type="button"
                onClick={() => setVisibleGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-sm font-semibold">{group.judul}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-[var(--muted)] transition-transform ${visibleGroups[group.key] ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {visibleGroups[group.key] && <div className="mt-5">{renderAsesmenCards(group.data)}</div>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}