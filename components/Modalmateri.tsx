"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { MateriData } from "./MateriCard";

interface KelasOption {
  id: string;
  label: string;
}

interface ModalMateriProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: MateriData | null;
  defaultKelasId?: string;
}

export default function ModalMateri({ open, onClose, onSuccess, mode, initialData, defaultKelasId }: ModalMateriProps) {
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<MateriData["tipe"]>("LINK");
  const [url, setUrl] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) =>
        setKelasList((data.data ?? []).map((k: any) => ({ id: k.id, label: k.judul || "Tanpa Judul", })))
      )
      .catch(() => {});

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul);
      setTipe(initialData.tipe);
      setUrl(initialData.url);
      setDeskripsi(initialData.deskripsi ?? "");
      setSelectedKelasIds((initialData.kelasTujuan ?? []).map((kt) => kt.kelas.id).filter(Boolean));
    } else {
      setJudul("");
      setTipe("LINK");
      setUrl("");
      setDeskripsi("");
      setSelectedKelasIds(defaultKelasId ? [defaultKelasId] : []);
    }
    setError("");
  }, [open, mode, initialData, defaultKelasId]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?kategori=materi", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lampiran gagal diunggah.");
        return;
      }

      setUrl(data.url);
      setTipe(file.type.startsWith("image/") ? "FOTO" : file.type === "application/pdf" ? "PDF" : "FILE");
    } catch {
      setError("Lampiran gagal diunggah. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);
    try {
      const isEdit = mode === "edit";
      const urlEndpoint = isEdit ? `/api/materi/${initialData?.id}` : "/api/materi";
      const method = isEdit ? "PATCH" : "POST";

      if (tipe !== "LINK" && !url) {
        setError("Pilih file yang akan diunggah.");
        setLoading(false);
        return;
      }
      if (tipe === "LINK" && !/^https?:\/\//i.test(url.trim())) {
        setError("Masukkan tautan dengan alamat http:// atau https://.");
        setLoading(false);
        return;
      }

      const res = await fetch(urlEndpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, tipe, url, deskripsi: deskripsi || null, kelasIds: selectedKelasIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
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
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Upload Materi" : "Edit Materi"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Materi" value={judul} onChange={(e) => setJudul(e.target.value)} required />

        <label className="block text-xs font-semibold text-[var(--muted)]">
          Sumber Materi
          <select
            className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--brand)]"
            value={tipe === "LINK" ? "LINK" : "FILE"}
            onChange={(event) => {
              const nextTipe = event.target.value === "LINK" ? "LINK" : "FILE";
              setTipe(nextTipe);
              setUrl("");
            }}
          >
            <option value="LINK">Tautan</option>
            <option value="FILE">Upload file atau foto</option>
          </select>
        </label>

        {tipe === "LINK" ? (
          <Input label="Tautan" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required />
        ) : (
          <label className="block text-xs font-semibold text-[var(--muted)]">
            Lampiran
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,image/jpeg,image/png,image/webp"
              className="mt-1 block w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--tint)] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[var(--fg)]"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
            <span className="mt-1 block font-normal text-[var(--muted)]">
              {uploading ? "Mengunggah..." : url ? "File terlampir. Pilih ulang untuk mengganti." : "PDF, dokumen, presentasi, atau foto. Maksimal 10 MB."}
            </span>
          </label>
        )}

        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">Kelas Tujuan</label>
          <select
            className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--brand)]"
            value=""
            onChange={(e) => e.target.value && toggleKelas(e.target.value)}
          >
            <option value="">+ Tambah kelas</option>
            {kelasList
              .filter((k) => !selectedKelasIds.includes(k.id))
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
          </select>

          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const k = kelasList.find((kk) => kk.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {k?.label}
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-[var(--danger)]">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-[var(--danger)]">{error}</p>}

        <Button type="submit" loading={loading} disabled={uploading} className="w-full">
          {mode === "create" ? "Upload Materi" : "Simpan Perubahan"}
        </Button>
      </form>
    </Modal>
  );
}