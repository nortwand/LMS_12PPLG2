"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

interface ModalKirimMateriProps {
  open: boolean;
  materiId: string | null;
  kelasTujuanIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalKirimMateri({
  open,
  materiId,
  kelasTujuanIds,
  onClose,
  onSuccess,
}: ModalKirimMateriProps) {
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedKelasIds([]);
    setError("");
    fetch("/api/kelas")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Daftar kelas gagal dimuat.");
        setKelasList(payload.data ?? []);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Daftar kelas gagal dimuat."));
  }, [open]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((current) =>
      current.includes(id) ? current.filter((kelasId) => kelasId !== id) : [...current, id]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!materiId || selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/materi/${materiId}/kirim-ke-kelas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: selectedKelasIds }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Materi gagal dikirim.");
      onSuccess();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Materi gagal dikirim.");
    } finally {
      setLoading(false);
    }
  }

  const availableKelas = kelasList.filter((kelas) =>
    !kelasTujuanIds.includes(kelas.id) && !selectedKelasIds.includes(kelas.id)
  );

  return (
    <Modal open={open} onClose={onClose} title="Kirim Materi ke Kelas" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">Pilih kelas tujuan</label>
          <select
            className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--brand)]"
            value=""
            onChange={(event) => {
              if (event.target.value) toggleKelas(event.target.value);
            }}
          >
            <option value="">+ Tambah kelas</option>
            {availableKelas.map((kelas) => (
              <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>
            ))}
          </select>
          {kelasTujuanIds.length > 0 && (
            <p className="mt-1.5 text-xs text-[var(--muted)]">Kelas yang sudah menerima materi tidak ditampilkan.</p>
          )}
          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const kelas = kelasList.find((item) => item.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {kelas?.judul}
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-[var(--danger)]">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        {error && <p role="alert" className="text-xs font-medium text-[var(--danger)]">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={loading} className="flex-1">Kirim Materi</Button>
        </div>
      </form>
    </Modal>
  );
}
