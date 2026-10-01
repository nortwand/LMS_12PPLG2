"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import type { KelasData } from "./KelasCard";

interface ModalKelasProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: KelasData | null;
}

export default function ModalKelas({ open, onClose, onSuccess, mode, initialData }: ModalKelasProps) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul ?? "");
      setDeskripsi(initialData.deskripsi ?? "");
    } else {
      setJudul("");
      setDeskripsi("");
    }
    setError("");
  }, [open, mode, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!judul.trim()) {
      setError("Judul kelas wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const isEdit = mode === "edit" && initialData;
      const url = isEdit ? `/api/kelas/${initialData.id}` : "/api/kelas";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          deskripsi: deskripsi.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Terjadi kesalahan saat menyimpan kelas.");
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
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Buat Kelas Baru" : "Edit Kelas"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Kelas" value={judul} onChange={(e) => setJudul(e.target.value)} required />
        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? "Buat Kelas" : "Simpan Perubahan"}
        </Button>
      </form>
    </Modal>
  );
}
