"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import { showAlert, showConfirm } from "@/lib/dialog";
import { Btn, PageTitle, PANEL } from "@/app/guru/_ui";

type StatusFilter = "SEMUA" | "PROSES" | "SELESAI";

export default function GuruAsesmenPage() {
  const router = useRouter();
  const [asesmenList, setAsesmenList] = useState<AsesmenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SEMUA");
  const [showModal, setShowModal] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);

  useEffect(() => {
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadAsesmen() {
    setLoading(true);
    try {
      const qs = statusFilter !== "SEMUA" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/asesmen${qs}`);
      const data = await res.json();
      setAsesmenList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess(asesmenId: string) {
    router.push(`/guru/asesmen/${asesmenId}`);
  }

  function handleSendSuccess() {
    setSendingAsesmen(null);
    loadAsesmen();
  }

  async function handleDeleteAsesmen(asesmen: AsesmenData) {
    if (!(await showConfirm(`Hapus asesmen "${asesmen.judul}"? Data soal dan pengumpulan juga akan dihapus.`))) return;

    const res = await fetch(`/api/asesmen/${asesmen.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Asesmen gagal dihapus.");
      return;
    }

    loadAsesmen();
  }

  const sekarang = new Date();
  const awalHariIni = new Date(sekarang);
  awalHariIni.setHours(0, 0, 0, 0);
  const awalPeriodeSekarang = new Date(sekarang);
  awalPeriodeSekarang.setMonth(awalPeriodeSekarang.getMonth() - 3);
  const awalPeriodeSebelumnya = new Date(sekarang);
  awalPeriodeSebelumnya.setMonth(awalPeriodeSebelumnya.getMonth() - 6);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const kelompok = [
    {
      key: "hari-ini",
      judul: "Asesmen Hari Ini",
      data: asesmenList.filter((asesmen) => tanggalAsesmen(asesmen) >= awalHariIni),
    },
    {
      key: "tiga-bulan",
      judul: "3 Bulan Terakhir",
      data: asesmenList.filter((asesmen) => {
        const tanggal = tanggalAsesmen(asesmen);
        return tanggal >= awalPeriodeSebelumnya && tanggal < awalPeriodeSekarang;
      }),
    },
    {
      key: "history",
      judul: "History Asesmen",
      data: asesmenList.filter((asesmen) => tanggalAsesmen(asesmen) < awalPeriodeSebelumnya),
    },
  ];

  function renderAsesmenCards(data: AsesmenData[]) {
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
                <AsesmenCard key={asesmen.id} data={asesmen} basePath="/guru/asesmen" onEdit={setEditingAsesmen} onSend={setSendingAsesmen} onDelete={handleDeleteAsesmen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Asesmen"
        desc="Buat kuis dan ujian, susun soal, lalu pantau jawaban siswa."
        action={<Btn onClick={() => setShowModal(true)}>Buat Asesmen</Btn>}
      />

      <div className="flex flex-wrap gap-2">
          {(["SEMUA", "PROSES", "SELESAI"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-9 cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]"
                  : "border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]"
              }`}
            >
              {s === "SEMUA" ? "Semua" : s === "PROSES" ? "Proses" : "Selesai"}
            </button>
          ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Memuat...</p>
      ) : asesmenList.length === 0 ? (
        <p className={`${PANEL} text-sm text-[var(--muted)]`}>Belum ada asesmen dibuat.</p>
      ) : (
        <div className="mt-6 space-y-5">
          {kelompok.map((group) => group.data.length > 0 && (
            <section key={group.key} className={PANEL}>
              <button
                type="button"
                onClick={() => setVisibleGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-sm font-semibold">{group.judul}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-[var(--muted)] transition-transform ${visibleGroups[group.key] ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {visibleGroups[group.key] && <div className="mt-5">{renderAsesmenCards(group.data)}</div>}
            </section>
          ))}
        </div>
      )}

      <ModalBuatAsesmen open={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      <ModalEditAsesmen
        open={!!editingAsesmen}
        onClose={() => setEditingAsesmen(null)}
        onSuccess={loadAsesmen}
        initialData={editingAsesmen ? { ...editingAsesmen, mapelId: editingAsesmen.mapelId ?? editingAsesmen.mapel?.id ?? null } : null}
      />
      <ModalBuatAsesmen
        open={!!sendingAsesmen}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={handleSendSuccess}
        initialSumber="EXISTING"
        initialAsesmenId={sendingAsesmen?.id}
      />
    </div>
  );
}