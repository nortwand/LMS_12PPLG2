// app/guru/tugas/page.tsx
"use client";

import { useEffect, useState } from "react";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import { showConfirm } from "@/lib/dialog";
import { Btn, PageTitle, INPUT, LABEL } from "@/app/guru/_ui";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token disediakan oleh app/guru/layout.tsx.
*/

export default function GuruTugasPage() {
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [filterKelasId, setFilterKelasId] = useState("");
  const [kelasOptions, setKelasOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => setKelasOptions((d.data ?? []).map((k: any) => ({ id: k.id, label: k.judul }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTugas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelasId]);

  async function loadTugas() {
    setLoading(true);
    try {
      const qs = filterKelasId ? `?kelasId=${filterKelasId}` : "";
      const res = await fetch(`/api/tugas${qs}`);
      const data = await res.json();
      setTugasList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function openBuat() {
    setEditingTugas(null);
    setShowModal(true);
  }
  function openEdit(t: TugasData) {
    setEditingTugas(t);
    setShowModal(true);
  }
  function handleSendSuccess() {
    setSendingTugas(null);
    loadTugas();
  }
  async function handleDelete(id: string) {
    if (!(await showConfirm("Hapus tugas ini?"))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadTugas();
  }

  const todayStr = new Date().toDateString();
  const hariIni = tugasList.filter((t) => new Date(t.createdAt).toDateString() === todayStr);
  const history = tugasList.filter((t) => new Date(t.createdAt).toDateString() !== todayStr);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Tugas"
        desc="Buat tugas, lalu kirim ke kelas untuk memulainya."
        action={<Btn onClick={openBuat}>+ Buat Tugas</Btn>}
      />

      <label className={`${LABEL} max-w-sm`}>
        Filter kelas
        <select
          className={`${INPUT} mt-1`}
          value={filterKelasId}
          onChange={(e) => setFilterKelasId(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Memuat...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-base font-semibold">Tugas Hari Ini</h2>
            {hariIni.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">
                Belum ada tugas dibuat hari ini.
              </p>
            ) : (
              <div className="space-y-3">
                {hariIni.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="GURU" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">History</h2>
            {history.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">
                Belum ada riwayat tugas.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="GURU" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <ModalTugas
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadTugas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
}