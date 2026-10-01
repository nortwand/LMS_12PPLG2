"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import MateriCard, { MateriData } from "@/components/MateriCard";
import ModalMateri from "@/components/Modalmateri";
import { showAlert, showConfirm } from "@/lib/dialog";

export default function GuruMateriPage() {
  const [materiList, setMateriList] = useState<MateriData[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [kelasFilter, setKelasFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MateriData | null>(null);

  async function loadMateri() {
    setLoading(true);
    try {
      const res = await fetch("/api/materi");
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Gagal memuat materi.");
      setMateriList(payload.data ?? []);
    } catch (error) {
      await showAlert(error instanceof Error ? error.message : "Gagal memuat materi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMateri();
    fetch("/api/kelas")
      .then((res) => res.json())
      .then((payload) => setKelasList(payload.data ?? []))
      .catch(() => {});
  }, []);

  async function handleDelete(id: string) {
    if (!(await showConfirm("Hapus materi ini?"))) return;
    const res = await fetch(`/api/materi/${id}`, { method: "DELETE" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      await showAlert(payload?.error ?? "Materi gagal dihapus.");
      return;
    }
    await loadMateri();
  }

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
      <header className="flex flex-col gap-3 border-b border-[#D8DEE6] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#17231A]">Materi</h1>
          <p className="mt-1 text-sm text-[#64748B]">Materi untuk kelas yang Anda ajar.</p>
        </div>
        <Button onClick={() => {
          setEditing(null);
          setShowModal(true);
        }}>+ Upload Materi</Button>
      </header>

      <label className="block max-w-sm text-xs font-semibold text-[#475569]">
        Filter kelas
        <select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)} className="mt-1 w-full border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm font-normal">
          <option value="">Semua kelas</option>
          {kelasList.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>)}
        </select>
      </label>

      {loading ? <p className="text-sm text-[#64748B]">Memuat materi...</p> : (
        <div className="space-y-7">
          <section>
            <h2 className="mb-3 text-base font-bold text-[#17231A]">Materi Hari Ini</h2>
            <div className="space-y-2">
              {materiHariIni.length ? materiHariIni.map((item) => (
                <MateriCard
                  key={item.id}
                  data={item}
                  isEditable
                  onEdit={(materi) => { setEditing(materi); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              )) : <p className="border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">Belum ada materi hari ini.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-[#17231A]">History</h2>
            <div className="space-y-2">
              {materiHistory.length ? materiHistory.map((item) => (
                <MateriCard
                  key={item.id}
                  data={item}
                  isEditable
                  onEdit={(materi) => { setEditing(materi); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              )) : <p className="border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">Belum ada riwayat materi.</p>}
            </div>
          </section>
        </div>
      )}

      <ModalMateri
        open={showModal || !!editing}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSuccess={() => {
          setShowModal(false);
          setEditing(null);
          void loadMateri();
        }}
        mode={editing ? "edit" : "create"}
        initialData={editing}
      />
    </div>
  );
}
