"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import type { AsesmenData } from "./Asesmencard";

interface ModalEditAsesmenProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: (AsesmenData & { mapelId?: string | null }) | null;
}

export default function ModalEditAsesmen({ open, onClose, onSuccess, initialData }: ModalEditAsesmenProps) {
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<"KUIS" | "UJIAN">("KUIS");
  const [mapelId, setMapelId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    if (!open) return;

    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});

    if (initialData) {
      setJudul(initialData.judul ?? "");
      setTipe(initialData.tipe ?? "KUIS");
      setMapelId(initialData.mapelId ?? initialData.mapel?.id ?? "");
      setDurasiMenit(initialData.durasiMenit ? String(initialData.durasiMenit) : "");
      setDeskripsi(initialData.deskripsi ?? "");
    } else {
      setJudul("");
      setTipe("KUIS");
      setMapelId("");
      setDurasiMenit("");
      setDeskripsi("");
    }
    setError("");
  }, [open, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!initialData?.id) {
      setError("Data asesmen tidak valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/asesmen/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          tipe,
          mapelId: mapelId || null,
          durasiMenit: durasiMenit ? Number(durasiMenit) : null,
          deskripsi: deskripsi.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gagal menyimpan perubahan.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Asesmen" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Asesmen" value={judul} onChange={(e) => setJudul(e.target.value)} required />

        <Select label="Tipe" value={tipe} onChange={(e) => setTipe(e.target.value as "KUIS" | "UJIAN")}>
          <option value="KUIS">Kuis</option>
          <option value="UJIAN">Ujian Online</option>
        </Select>

        <Select label="Mata Pelajaran" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          <option value="">Pilih mapel (opsional)</option>
          {mapelList.map((mapel) => (
            <option key={mapel.id} value={mapel.id}>{mapel.nama}</option>
          ))}
        </Select>

        <Input label="Durasi (menit)" type="number" min={10} value={durasiMenit} onChange={(e) => setDurasiMenit(e.target.value)} />
        <Textarea label="Deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">Simpan Perubahan</Button>
      </form>
    </Modal>
  );
}
