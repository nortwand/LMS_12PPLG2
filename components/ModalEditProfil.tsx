"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";

interface ModalEditProfilProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialNama: string;
  initialFoto: string | null;
  initialDeskripsi: string | null;
}

export default function ModalEditProfil({
  open,
  onClose,
  onSuccess,
  userId,
  initialNama,
  initialFoto,
  initialDeskripsi,
}: ModalEditProfilProps) {
  const [nama, setNama] = useState(initialNama);
  const [deskripsi, setDeskripsi] = useState(initialDeskripsi ?? "");
  const [fotoProfil, setFotoProfil] = useState(initialFoto ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNama(initialNama);
    setDeskripsi(initialDeskripsi ?? "");
    setFotoProfil(initialFoto ?? "");
    setError("");
  }, [open, initialNama, initialFoto, initialDeskripsi]);

  async function handleUploadFoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload?kategori=profil", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error ?? "Upload foto gagal.");
    }
    setFotoProfil(data.url ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/profil/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          deskripsi: deskripsi.trim() || null,
          fotoProfil: fotoProfil || null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gagal memperbarui profil.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profil" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
        <Textarea label="Deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        <label className="block text-xs font-semibold text-[var(--muted)]">
          Foto Profil
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--tint)] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[var(--fg)]"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void handleUploadFoto(file);
            }}
          />
        </label>

        {error && <p className="text-xs font-medium text-[var(--danger)]">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">Simpan Profil</Button>
      </form>
    </Modal>
  );
}
