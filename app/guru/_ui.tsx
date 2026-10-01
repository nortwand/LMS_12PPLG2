"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";

/*
  Komponen presentasi bersama untuk seluruh area /guru (selain asesmen).
  Palet 3 warna: Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token sama dengan landing, login, dan admin. Dark mode: class "dark" di <html>, key "theme".
  File ini bukan route (nama diawali underscore), hanya diimpor lewat "@/app/guru/_ui".
*/

export const STYLES = `
.lp{
  color-scheme:light;
  --bg:#FAF6EE; --surface:#FFFFFF; --tint:#F2EEE4;
  --fg:#1B261B; --muted:#5E6E5D;
  --border:rgba(27,38,27,.12); --border-strong:rgba(27,38,27,.28);
  --brand:#658864; --on-brand:#FFFFFF; --link:#4F6E4E;
  --focus:#658864; --danger:#9A3B2E;
  --chart-1:#658864; --chart-2:#A9C0A8;
}
.dark .lp{
  color-scheme:dark;
  --bg:#141B14; --surface:#1B241B; --tint:#202B20;
  --fg:#FFFFFF; --muted:rgba(255,255,255,.66);
  --border:rgba(255,255,255,.12); --border-strong:rgba(255,255,255,.28);
  --brand:#658864; --on-brand:#FFFFFF; --link:#8FB88E;
  --focus:#8FB88E; --danger:#E8A398;
  --chart-1:#8FB88E; --chart-2:#4F6E4E;
}
.lp *:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:6px}
.lp a,.lp button,.lp input,.lp select,.lp textarea{transition:background-color .12s,color .12s,border-color .12s,opacity .12s}
.lp *{scrollbar-width:thin;scrollbar-color:var(--border-strong) transparent}
`;

export const INPUT =
  "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)]";
export const LABEL = "block text-xs font-medium text-[var(--muted)]";
export const PANEL = "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5";
export const LINK_BTN =
  "inline-flex h-10 cursor-pointer items-center text-sm font-medium text-[var(--link)] underline-offset-4 hover:underline";

/* ============ TEMA ============ */

function ThemeIcon({ sun }: { sun: boolean }) {
  return sun ? (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("theme");
    } catch {}
    const isDark =
      saved === "dark" ||
      (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--tint)]"
    >
      <ThemeIcon sun={mounted && dark} />
    </button>
  );
}

/* ============ TOMBOL ============ */

type BtnVariant = "primary" | "outline" | "danger";
type BtnSize = "sm" | "md";

const BTN_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60";
const BTN_SIZE: Record<BtnSize, string> = { sm: "h-9 px-3", md: "h-10 px-4" };
const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-[var(--brand)] text-[var(--on-brand)] hover:opacity-90",
  outline: "border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]",
  danger: "border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--tint)]",
};

export function Btn({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${BTN_BASE} ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${className}`}
      {...props}
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}

export function LinkBtn({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BTN_BASE} ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/* ============ ELEMEN KECIL ============ */

export function Pill({ tone = "muted", children }: { tone?: "brand" | "muted"; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        tone === "brand"
          ? "bg-[var(--brand)] text-[var(--on-brand)]"
          : "border border-[var(--border-strong)] text-[var(--muted)]"
      }`}
    >
      {children}
    </span>
  );
}

export function Avatar({
  src,
  nama,
  size = 36,
}: {
  src: string | null | undefined;
  nama: string | undefined;
  size?: number;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--tint)] text-xs font-semibold text-[var(--muted)]"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nama ?? ""} className="h-full w-full object-cover" />
      ) : (
        nama?.charAt(0) ?? "G"
      )}
    </div>
  );
}

export function PageTitle({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: number | string; caption: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-[var(--surface)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{item.caption}</p>
        </div>
      ))}
    </div>
  );
}

export function BarRow({
  label,
  value,
  max,
  color = "var(--chart-1)",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-xs font-medium">
        <span className="truncate">{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-sm bg-[var(--tint)]">
        <div className="h-2 rounded-sm" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}