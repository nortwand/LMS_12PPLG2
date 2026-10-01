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
    <article className="border border-[#D8DEE6] bg-white p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">Materi</Badge>
              <Badge tone={data.tipe === "PDF" ? "red" : "gray"}>
                {data.tipe === "LINK" ? "Link" : data.tipe === "PDF" ? "PDF" : data.tipe === "FOTO" ? "Foto" : "File"}
              </Badge>
              <time className="text-xs text-[#64748B]" dateTime={data.createdAt}>
                {Number.isNaN(tanggal.getTime()) ? "" : tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </time>
            </div>
            <h3 className="mt-2 break-words text-sm font-bold text-[#111827]">{data.judul}</h3>
            {data.deskripsi && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#475569]">{data.deskripsi}</p>}
            {data.guru && <p className="mt-2 text-xs text-[#64748B]">Dibuat oleh {data.guru.nama}</p>}
          </div>

          {isEditable && (
            <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label="Opsi materi"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-lg font-bold text-[#64748B] hover:bg-[#F1F5F9]"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-28 overflow-hidden border border-[#D8DEE6] bg-white py-1">
                  <button type="button" onClick={() => { setMenuOpen(false); onEdit?.(data); }} className="block w-full px-3 py-2 text-left text-xs font-medium text-[#374151] hover:bg-[#F1F5F9]">
                    Edit
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); onDelete?.(data.id); }} className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">
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
          className="mt-3 flex min-w-0 items-center gap-3 border border-[#D8DEE6] bg-[#F8FAFC] p-2.5 hover:border-[#658864]"
        >
          {isFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.url} alt={data.judul} className="h-12 w-12 shrink-0 object-cover" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D8DEE6] bg-white text-xs font-bold text-[#475569]">
              {data.tipe === "LINK" ? "LINK" : data.tipe === "PDF" ? "PDF" : "FILE"}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1E293B]">{attachmentName}</span>
          <span className="shrink-0 text-xs font-semibold text-[#365C3A]">{data.tipe === "LINK" ? "Buka" : "Unduh"}</span>
        </a>
      </article>
    );
  }
