"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "./ui/Badge";

export interface KelasData {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  _count?: { siswa: number };
}

interface KelasCardProps {
  data: KelasData;
  isEditable?: boolean;
  onEdit?: (kelas: KelasData) => void;
  onDelete?: (kelasId: string) => void;
  basePath?: string;
  variant?: "card" | "list";
}

export default function KelasCard({
  data,
  isEditable = false,
  onEdit,
  onDelete,
  basePath = "/admin/kelas",
  variant = "card",
}: KelasCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const label = data.judul || "Tanpa Judul";

  function handleCopyInvite(e?: React.MouseEvent) {
    e?.stopPropagation();
    const link = `${window.location.origin}/join/${data.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      onClick={() => router.push(`${basePath}/${data.id}`)}
      className={variant === "list"
        ? "group relative flex w-full cursor-pointer items-center gap-4 border-b border-[var(--border)] py-3 text-left last:border-b-0 hover:bg-[var(--tint)]"
        : "group relative cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-[#FAF6EE] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"}
    >
      <div className={variant === "list" ? "flex min-w-0 flex-1 items-center justify-between gap-4" : "flex items-center justify-between px-4 pt-4"}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={variant === "list" ? "truncate text-sm font-medium text-[var(--fg)]" : "text-sm font-bold text-[#111827]"}>{label}</p>
            {variant === "card" && <Badge tone="brand">{data._count?.siswa ?? 0} Siswa</Badge>}
          </div>
          {variant === "list" && (
            <p className="mt-1 truncate text-xs text-[var(--muted)]">
              {data.deskripsi || "Belum ada deskripsi kelas"}
            </p>
          )}
        </div>

        {variant === "list" && (
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="text-xs tabular-nums text-[var(--muted)]">{data._count?.siswa ?? 0} siswa</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--muted)]">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        )}

        {isEditable && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                  type="button"
                  aria-label="Menu aksi kelas"
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors ${variant === "list" ? "text-[var(--muted)] hover:bg-[var(--tint)]" : "text-[#9CA3AF] hover:bg-black/5"}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className={`absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-md border shadow-lg ${variant === "list" ? "border-[var(--border)] bg-[var(--surface)]" : "border-black/5 bg-[#FAF6EE]"}`}>
                {variant === "list" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleCopyInvite();
                    }}
                    className="block h-9 w-full cursor-pointer px-3 text-left text-xs font-medium text-[var(--fg)] hover:bg-[var(--tint)]"
                  >
                    Salin link undangan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(data);
                  }}
                  className={`block h-9 w-full cursor-pointer px-3 text-left text-xs font-medium ${variant === "list" ? "text-[var(--fg)] hover:bg-[var(--tint)]" : "text-[#374151] hover:bg-black/5"}`}
                >
                  Edit Kelas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(data.id);
                  }}
                  className={`block h-9 w-full cursor-pointer px-3 text-left text-xs font-medium ${variant === "list" ? "text-[var(--danger)] hover:bg-[var(--tint)]" : "text-red-500 hover:bg-red-50"}`}
                >
                  Hapus Kelas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* deskripsi -- strip walas dihapus total */}
      {variant === "card" && (
        <div className="px-4 py-3">
          <p className="line-clamp-2 text-xs italic text-[#6B7280]">
            {data.deskripsi ? `"${data.deskripsi}"` : "Belum ada deskripsi."}
          </p>
        </div>
      )}

      {isEditable && variant === "card" && (
        <div className="flex items-center gap-1 border-t border-black/5 px-4 py-2.5">
          <button
            onClick={handleCopyInvite}
            className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[#6B7280] hover:text-[#658864]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            {copied ? "Tersalin!" : "Salin Link Undangan"}
          </button>
        </div>
      )}
    </div>
  );
}