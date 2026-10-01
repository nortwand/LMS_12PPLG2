"use client";

import { useState } from "react";
import Badge from "./ui/Badge";

export interface MateriData {
  id: string;
  judul: string;
  tipe: "PDF" | "LINK" | "FILE" | "FOTO";
  url: string;
  deskripsi: string | null;
  createdAt: string;
  guru?: { id: string; nama: string };
  kelasTujuan?: { kelas: { id: string; judul: string } }[];
}

interface MateriCardProps {
  data: MateriData;
  isEditable?: boolean;
  onEdit?: (materi: MateriData) => void;
  onDelete?: (id: string) => void;
}

export default function MateriCard({ data, isEditable = false, onEdit, onDelete }: MateriCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const attachmentName = (() => {
    if (data.tipe === "LINK") {
      try {
        return new URL(data.url).hostname;
      } catch {
        return data.url;
      }
    }
    const filename = data.url.split(/[?#]/)[0].split("/").pop() ?? "Lampiran materi";
    try {
      return decodeURIComponent(filename).replace(/^[a-f0-9-]{36}-/i, "") || "Lampiran materi";
    } catch {
      return filename;
    }
  })();
  const isFoto = data.tipe === "FOTO";
  const tanggal = new Date(data.createdAt);

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">Materi</Badge>
              <Badge tone={data.tipe === "PDF" ? "red" : "gray"}>
                {data.tipe === "LINK" ? "Link" : data.tipe === "PDF" ? "PDF" : data.tipe === "FOTO" ? "Foto" : "File"}
              </Badge>
              <time className="text-xs text-[var(--muted)]" dateTime={data.createdAt}>
                {Number.isNaN(tanggal.getTime()) ? "" : tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </time>
            </div>
            <h3 className="mt-2 break-words text-sm font-semibold">{data.judul}</h3>
            {data.deskripsi && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--muted)]">{data.deskripsi}</p>}
            {data.guru && <p className="mt-2 text-xs text-[var(--muted)]">Dibuat oleh {data.guru.nama}</p>}
          </div>

          {isEditable && (
            <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label="Opsi materi"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg font-bold text-[var(--muted)] hover:bg-[var(--tint)]"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-28 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                  <button type="button" onClick={() => { setMenuOpen(false); onEdit?.(data); }} className="block h-9 w-full px-3 text-left text-xs font-medium hover:bg-[var(--tint)]">
                    Edit
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); onDelete?.(data.id); }} className="block h-9 w-full px-3 text-left text-xs font-medium text-[var(--danger)] hover:bg-[var(--tint)]">
                    Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          download={data.tipe === "LINK" ? undefined : attachmentName}
          className="mt-3 flex min-w-0 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-2.5 hover:border-[var(--brand)]"
        >
          {isFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.url} alt={data.judul} className="h-12 w-12 shrink-0 object-cover" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--muted)]">
              {data.tipe === "LINK" ? "LINK" : data.tipe === "PDF" ? "PDF" : "FILE"}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{attachmentName}</span>
          <span className="shrink-0 text-xs font-semibold text-[var(--link)]">{data.tipe === "LINK" ? "Buka" : "Unduh"}</span>
        </a>
      </article>
    );
  }
