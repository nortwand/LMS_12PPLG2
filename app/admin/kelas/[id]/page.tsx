"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import ModalKelas from "@/components/ModalKelas";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import ClassFeedFilter, { filterClassFeed, type ClassFeedType } from "@/components/ClassFeedFilter";
import { showAlert, showConfirm } from "@/lib/dialog";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token sama dengan landing, login, dan admin/page.tsx.
  Dark mode: class "dark" di <html>, localStorage key "theme".
*/

const STYLES = `
.lp{
  color-scheme:light;
  --bg:#FAF6EE; --surface:#FFFFFF; --tint:#F2EEE4;
  --fg:#1B261B; --muted:#5E6E5D;
  --border:rgba(27,38,27,.12); --border-strong:rgba(27,38,27,.28);
  --brand:#658864; --on-brand:#FFFFFF; --link:#4F6E4E;
  --focus:#658864; --danger:#9A3B2E;
}
.dark .lp{
  color-scheme:dark;
  --bg:#141B14; --surface:#1B241B; --tint:#202B20;
  --fg:#FFFFFF; --muted:rgba(255,255,255,.66);
  --border:rgba(255,255,255,.12); --border-strong:rgba(255,255,255,.28);
  --brand:#658864; --on-brand:#FFFFFF; --link:#8FB88E;
  --focus:#8FB88E; --danger:#E8A398;
}
.lp *:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:6px}
.lp a,.lp button,.lp input,.lp select,.lp textarea{transition:background-color .12s,color .12s,border-color .12s,opacity .12s}
.lp *{scrollbar-width:thin;scrollbar-color:var(--border-strong) transparent}
`;

const FONT = { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const SHELL = "lp flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]";

type AdminTab = "DASHBOARD" | "KELAS" | "AKUN" | "SISWA" | "GURU" | "LAPORAN" | "PERFORMA";
type GuruNav = "KELAS" | "ASESMEN" | "TUGAS" | "PROFILE";

function GuruNavIcon({ nav }: { nav: GuruNav }) {
  const paths: Record<GuruNav, React.ReactNode> = {
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    ASESMEN: <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />,
    TUGAS: <path d="M9 3h6l1 3H8l1-3ZM6 6h12v15H6zM9 11h6M9 15h6" />,
    PROFILE: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[nav]}
    </svg>
  );
}

function TabIcon({ tab }: { tab: AdminTab }) {
  const paths: Record<AdminTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
    LAPORAN: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[tab]}
    </svg>
  );
}

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Buat Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

/* ============ KOMPONEN PRESENTASI LOKAL ============ */

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

function ThemeToggle() {
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

function Btn({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60";
  const sizes = { sm: "h-9 px-3", md: "h-10 px-4" };
  const variants = {
    primary: "bg-[var(--brand)] text-[var(--on-brand)] hover:opacity-90",
    outline: "border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]",
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--border-strong)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">
      {children}
    </span>
  );
}

function Avatar({ src, nama, size = 36 }: { src: string | null | undefined; nama: string | undefined; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--tint)] text-xs font-semibold text-[var(--muted)]"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nama ?? ""} className="h-full w-full object-cover" />
      ) : (
        nama?.charAt(0) ?? "A"
      )}
    </div>
  );
}

interface SiswaDiKelas {
  siswaId: string;
  siswa: {
    id: string;
    nama: string;
    nis: string | null;
    fotoProfil: string | null;
    deskripsi: string | null;
    kelasReferensi: { id: string; label: string } | null;
  };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null; deskripsi: string | null };
  mapel: { id: string; nama: string };
}
interface FeedItem {
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS" | "MATERI";
  timestamp: string;
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

/* ============ HALAMAN ============ */

export default function AdminKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [feedFilter, setFeedFilter] = useState<ClassFeedType>("ALL");
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);

  const [showEditKelas, setShowEditKelas] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showTambahSiswa, setShowTambahSiswa] = useState(false);
  const [showTambahGuru, setShowTambahGuru] = useState(false);
  const canManageClass = me?.role === "ADMIN";

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  async function loadKelas() {
    setLoading(true);
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (res.ok) setKelas(data.data);
    } catch {}
    setLoading(false);
  }

  function handleCopyInvite() {
    if (!kelas) return;
    const link = `${window.location.origin}/join/${kelas.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function navigateToAdminTab(tab: AdminTab) {
    const target = tab === "AKUN" ? "/admin?tab=AKUN" : `/admin?tab=${tab}`;
    router.push(target);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  async function handleHapusSiswa(siswaId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm("Keluarkan siswa ini dari kelas?"))) return;
    await fetch(`/api/akun/${siswaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId) }),
    });
    loadKelas();
  }

  async function handleHapusGuru(guruId: string, mapelId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm("Keluarkan guru ini dari kelas?"))) return;
    await fetch(`/api/akun/${guruId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId), mapelId }),
    });
    loadKelas();
  }

  if (loading) {
    return (
      <div className={`${SHELL} items-center justify-center`} style={FONT}>
        <style>{STYLES}</style>
        <p className="text-sm text-[var(--muted)]">Memuat...</p>
      </div>
    );
  }

  if (!kelas) {
    return (
      <div className={`${SHELL} items-center justify-center gap-3`} style={FONT}>
        <style>{STYLES}</style>
        <p className="text-sm text-[var(--muted)]">Kelas tidak ditemukan.</p>
        <Btn variant="outline" onClick={() => router.push("/admin")}>
          Kembali
        </Btn>
      </div>
    );
  }

  const siswaGrouped = kelas.siswa.reduce((acc: Record<string, SiswaDiKelas[]>, ks) => {
    const label = ks.siswa.kelasReferensi?.label ?? "Belum Ada Kelas";
    if (!acc[label]) acc[label] = [];
    acc[label].push(ks);
    return acc;
  }, {});

  const guruGrouped = kelas.guruMapel.reduce((acc: Record<string, GuruDiKelas[]>, gm) => {
    const label = gm.mapel.nama;
    if (!acc[label]) acc[label] = [];
    acc[label].push(gm);
    return acc;
  }, {});
  const visibleFeed = filterClassFeed(kelas.feed, feedFilter);

  const navItemBase = `flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium ${
    sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
  }`;
  const navActive = "bg-[var(--brand)] text-[var(--on-brand)]";
  const navIdle = "text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]";
  const labelCls = sidebarCollapsed ? "lg:hidden" : "";

  return (
    <div className={SHELL} style={FONT}>
      <style>{STYLES}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* mobile: buka drawer */}
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label="Buka menu"
              aria-expanded={sidebarOpen}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--tint)] lg:hidden"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* desktop: collapse sidebar */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              aria-expanded={!sidebarCollapsed}
              className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--tint)] lg:flex"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-base font-semibold tracking-tight">Studify</span>
          </div>
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{me.nama}</p>
                <p className="text-xs leading-tight text-[var(--muted)]">{me.role}</p>
              </div>
            )}
            <div className="hidden sm:block">
              <Avatar src={me?.fotoProfil} nama={me?.nama} />
            </div>
            <ThemeToggle />
            <Btn size="md" variant="outline" onClick={() => router.push(canManageClass ? "/admin" : "/guru")}>
              Back
            </Btn>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* BACKDROP (mobile saja) */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} aria-hidden="true" className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        )}

        {/* SIDEBAR */}
        <aside
          aria-label={canManageClass ? "Navigasi admin" : "Navigasi guru"}
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-3 transition-transform duration-150 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:flex-shrink-0 lg:translate-x-0 lg:transition-[width]
            ${sidebarCollapsed ? "lg:w-16" : "lg:w-60"}`}
        >
          <p className={`mb-2 px-3 pt-2 text-xs font-medium text-[var(--muted)] ${labelCls}`}>
            {canManageClass ? "Dashboard Admin" : "Dashboard Guru"}
          </p>
          <nav className="flex flex-col gap-1">
            {canManageClass
              ? ADMIN_TABS.map((tab) => {
                  const active = tab.key === "KELAS";
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => navigateToAdminTab(tab.key)}
                      title={tab.label}
                      className={`${navItemBase} ${active ? navActive : navIdle}`}
                    >
                      <TabIcon tab={tab.key} />
                      <span className={labelCls}>{tab.label}</span>
                    </button>
                  );
                })
              : ([
                  ["KELAS", "Kelas", "/guru"],
                  ["ASESMEN", "Asesmen", "/guru/asesmen"],
                  ["TUGAS", "Tugas", "/guru/tugas"],
                  ["PROFILE", "Profile", me ? `/profil/${me.id}` : "#"],
                ] as [GuruNav, string, string][]).map(([nav, label, href]) => {
                  const active = nav === "KELAS";
                  return (
                    <Link
                      key={nav}
                      href={href}
                      title={label}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`${navItemBase} ${active ? navActive : navIdle}`}
                    >
                      <GuruNavIcon nav={nav} />
                      <span className={labelCls}>{label}</span>
                    </Link>
                  );
                })}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className={`mt-auto flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--border-strong)] text-sm font-medium hover:bg-[var(--tint)] ${
              sidebarCollapsed ? "lg:border-transparent" : ""
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M10 17l5-5-5-5M15 12H3M21 4v16" />
            </svg>
            <span className={labelCls}>Keluar</span>
          </button>
        </aside>

        {/* KONTEN */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <section className="border-b border-[var(--border)] pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--muted)]">Ringkasan kelas</p>
                  <h1 className="mt-1 break-words text-xl font-semibold tracking-tight">{kelas.judul}</h1>
                  {kelas.deskripsi && (
                    <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-[var(--muted)]">{kelas.deskripsi}</p>
                  )}
                </div>
                <div className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:w-auto sm:min-w-56">
                  <p className="text-xs font-medium text-[var(--muted)]">Kode kelas</p>
                  <p className="mt-1 break-all text-sm font-semibold tabular-nums">{kelas.inviteToken}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="inline-flex h-10 cursor-pointer items-center text-sm font-medium text-[var(--link)] underline-offset-4 hover:underline"
                    >
                      {copied ? "Tersalin" : "Salin link undangan"}
                    </button>
                    {canManageClass && (
                      <button
                        type="button"
                        onClick={() => setShowEditKelas(true)}
                        className="inline-flex h-10 cursor-pointer items-center text-sm font-medium text-[var(--link)] underline-offset-4 hover:underline"
                      >
                        Edit kelas
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                <Btn
                  className="w-full whitespace-normal text-center sm:w-auto"
                  variant={section === "SISWA" ? "primary" : "outline"}
                  aria-pressed={section === "SISWA"}
                  onClick={() => setSection(section === "SISWA" ? null : "SISWA")}
                >
                  Siswa ({kelas.siswa.length})
                </Btn>
                <Btn
                  className="w-full whitespace-normal text-center sm:w-auto"
                  variant={section === "GURU" ? "primary" : "outline"}
                  aria-pressed={section === "GURU"}
                  onClick={() => setSection(section === "GURU" ? null : "GURU")}
                >
                  Guru ({kelas.guruMapel.length})
                </Btn>
              </div>
            </section>

            {section === "SISWA" && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Deretan Siswa</h2>
                  <div className="flex items-center gap-2">
                    {canManageClass && (
                      <Btn size="sm" onClick={() => setShowTambahSiswa(true)}>
                        + Tambah Siswa
                      </Btn>
                    )}
                    <button
                      type="button"
                      aria-label="Tutup deretan siswa"
                      onClick={() => setSection(null)}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] text-lg text-[var(--muted)] hover:bg-[var(--tint)]"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {Object.keys(siswaGrouped).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Belum ada siswa di kelas ini.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(siswaGrouped).map(([label, list]) => {
                      const isOpen = expandedRombel === label;
                      return (
                        <div key={label} className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setExpandedRombel(isOpen ? null : label)}
                            className="flex min-h-12 w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-[var(--tint)]"
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{label}</p>
                              <Pill>{list.length} Siswa</Pill>
                            </div>
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`h-4 w-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                              {list.map((ks) => (
                                <div key={ks.siswaId} className="flex items-center gap-3 px-4 py-3">
                                  <Avatar src={ks.siswa.fotoProfil} nama={ks.siswa.nama} />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{ks.siswa.nama}</p>
                                    <p className="text-xs tabular-nums text-[var(--muted)]">NIS: {ks.siswa.nis}</p>
                                  </div>
                                  {canManageClass && (
                                    <button
                                      type="button"
                                      onClick={() => handleHapusSiswa(ks.siswa.id, [kelasId])}
                                      className="h-10 cursor-pointer px-2 text-sm font-medium text-[var(--danger)] hover:underline"
                                    >
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "GURU" && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Deretan Guru</h2>
                  <div className="flex items-center gap-2">
                    {canManageClass && (
                      <Btn size="sm" onClick={() => setShowTambahGuru(true)}>
                        + Tambah Guru
                      </Btn>
                    )}
                    <button
                      type="button"
                      aria-label="Tutup deretan guru"
                      onClick={() => setSection(null)}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] text-lg text-[var(--muted)] hover:bg-[var(--tint)]"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {Object.keys(guruGrouped).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Belum ada guru mengajar di kelas ini.</p>
                ) : (
                  Object.entries(guruGrouped).map(([mapel, list]) => (
                    <div key={mapel} className="mb-4">
                      <p className="mb-2 text-xs font-medium text-[var(--muted)]">{mapel}</p>
                      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                        {list.map((gm) => (
                          <div key={gm.id} className="flex items-center gap-3 px-4 py-3">
                            <Avatar src={gm.guru.fotoProfil} nama={gm.guru.nama} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{gm.guru.nama}</p>
                              <p className="text-xs tabular-nums text-[var(--muted)]">NIK: {gm.guru.nik}</p>
                            </div>
                            {canManageClass && (
                              <button
                                type="button"
                                onClick={() => handleHapusGuru(gm.guru.id, gm.mapel.id, [kelasId])}
                                className="h-10 cursor-pointer px-2 text-sm font-medium text-[var(--danger)] hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {section === null && (
              <div className="mt-6">
                <h2 className="mb-3 text-base font-semibold">Aktivitas Hari Ini</h2>
                <ClassFeedFilter value={feedFilter} onChange={setFeedFilter} />
                <div className="mt-4 space-y-3">
                  {kelas.feed.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Belum ada aktivitas di kelas ini.</p>
                  ) : visibleFeed.length === 0 ? (
                    <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">
                      Tidak ada aktivitas dengan filter ini.
                    </p>
                  ) : (
                    visibleFeed.map((item, i) => {
                      if (item.tipe === "PENGUMUMAN") {
                        return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                      }
                      if (item.tipe === "MATERI") return <MateriCard key={`m-${i}`} data={item.data} />;
                      if (item.tipe === "TUGAS") {
                        return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="ADMIN" />;
                      }
                      const a = item.data;
                      return (
                        <div key={`a-${i}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill>{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Pill>
                            {a.mapel && <Pill>{a.mapel.nama}</Pill>}
                          </div>
                          <p className="mt-2 text-sm font-medium">{a.judul}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {a._count?.soal ?? 0} soal · oleh {a.guru?.nama}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-medium text-[var(--fg)]">Studify</span>
          <span>© 2026 Studify. All Rights Reserved.</span>
        </div>
      </footer>

      {canManageClass && <ModalKelas open={showEditKelas} onClose={() => setShowEditKelas(false)} onSuccess={loadKelas} mode="edit" initialData={kelas} />}

      {canManageClass && (
        <ModalTambahSiswa
          open={showTambahSiswa}
          onClose={() => setShowTambahSiswa(false)}
          onSuccess={loadKelas}
          kelasId={kelasId}
          kelasJudul={kelas.judul}
          siswaSudahAda={kelas.siswa.map((ks) => ks.siswaId)}
        />
      )}

      {canManageClass && (
        <ModalTambahGuru
          open={showTambahGuru}
          onClose={() => setShowTambahGuru(false)}
          onSuccess={loadKelas}
          kelasId={kelasId}
          guruSudahAda={kelas.guruMapel.map((gm) => gm.guru.id)}
        />
      )}
    </div>
  );
}

function ModalTambahSiswa({
  open,
  onClose,
  onSuccess,
  kelasId,
  kelasJudul,
  siswaSudahAda,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId: string;
  kelasJudul: string;
  siswaSudahAda: string[];
}) {
  const [rombelList, setRombelList] = useState<{ id: string; label: string }[]>([]);
  const [rombelId, setRombelId] = useState("");
  const [kandidat, setKandidat] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rombelSiswaCount, setRombelSiswaCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRombelId("");
    setKandidat([]);
    setSelectedIds([]);
    setRombelSiswaCount(0);
    fetch("/api/kelas-referensi")
      .then((res) => res.json())
      .then((data) => setRombelList(data.data ?? []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!rombelId) {
      setKandidat([]);
      setRombelSiswaCount(0);
      return;
    }
    setLoading(true);
    fetch("/api/akun?role=SISWA")
      .then((res) => res.json())
      .then((data) => {
        const siswaRombel = (data.data ?? []).filter((s: any) => s.kelasReferensi?.id === rombelId);
        setRombelSiswaCount(siswaRombel.length);
        setKandidat(siswaRombel.filter((s: any) => !siswaSudahAda.includes(s.id)));
      })
      .finally(() => setLoading(false));
  }, [rombelId, siswaSudahAda]);

  async function handleTambahSemuaRombel() {
    const rombel = rombelList.find((item) => item.id === rombelId);
    if (!rombel || rombelSiswaCount === 0) return;
    if (!(await showConfirm(`Tambahkan semua ${rombelSiswaCount} siswa dari rombel ${rombel.label} ke kelas ${kelasJudul}? Siswa yang sudah menjadi anggota akan dilewati.`))) return;

    setBulkSubmitting(true);
    try {
      const response = await fetch(`/api/kelas/${kelasId}/siswa/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rombelId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        await showAlert(payload?.error ?? "Gagal menambahkan siswa rombel.");
        return;
      }

      await showAlert(`Selesai: ${payload.data.ditambahkan} ditambahkan, ${payload.data.dilewati} dilewati.`);
      onSuccess();
      onClose();
    } catch {
      await showAlert("Gagal menambahkan siswa rombel. Coba lagi.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map((siswaId) => {
          const siswa = kandidat.find((k) => k.id === siswaId);
          const kelasIdsLama = (siswa?.kelasSiswa ?? []).map((ks: any) => ks.kelas.id);
          return fetch(`/api/akun/${siswaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kelasIds: [...kelasIdsLama, kelasId] }),
          });
        })
      );
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Siswa">
      <div className="space-y-4">
        <Select label="Pilih Kelas/Rombel" placeholder="Pilih rombel dulu" value={rombelId} onChange={(e) => setRombelId(e.target.value)}>
          {rombelList.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>

        {rombelId && !loading && (
          <Btn
            variant="outline"
            className="w-full"
            loading={bulkSubmitting}
            disabled={rombelSiswaCount === 0}
            onClick={() => void handleTambahSemuaRombel()}
          >
            Tambah semua siswa rombel ({rombelSiswaCount})
          </Btn>
        )}

        {loading && <p className="text-xs text-[var(--muted)]">Memuat...</p>}

        {!loading && rombelId && kandidat.length === 0 && (
          <p className="text-xs text-[var(--muted)]">Semua siswa di rombel ini sudah ada di kelas.</p>
        )}

        {kandidat.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            {kandidat.map((s) => (
              <label key={s.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-[var(--tint)]">
                <input type="checkbox" className="accent-[var(--brand)]" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} />
                <span className="text-sm">
                  {s.nama} — {s.nis}
                </span>
              </label>
            ))}
          </div>
        )}

        <Btn className="w-full" loading={submitting} disabled={selectedIds.length === 0} onClick={handleSubmit}>
          Tambah {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} Siswa
        </Btn>
      </div>
    </Modal>
  );
}

function ModalTambahGuru({
  open,
  onClose,
  onSuccess,
  kelasId,
  guruSudahAda,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId: string;
  guruSudahAda: string[];
}) {
  const [guruList, setGuruList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [guruId, setGuruId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGuruId("");
    setMapelId("");
    fetch("/api/akun?role=GURU")
      .then((res) => res.json())
      .then((data) => setGuruList((data.data ?? []).filter((g: any) => !guruSudahAda.includes(g.id))))
      .catch(() => {});
    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});
  }, [open, guruSudahAda]);

  useEffect(() => {
    const guru = guruList.find((g) => g.id === guruId);
    const mapelExisting = guru?.kelasGuruMapel?.[0]?.mapel?.id;
    if (mapelExisting) setMapelId(mapelExisting);
  }, [guruId, guruList]);

  async function handleSubmit() {
    if (!guruId || !mapelId) return;
    setSubmitting(true);
    try {
      const guru = guruList.find((g) => g.id === guruId);
      const kelasIdsLama = (guru?.kelasGuruMapel ?? []).map((kg: any) => kg.kelas.id);
      await fetch(`/api/akun/${guruId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: [...kelasIdsLama, kelasId], mapelId }),
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Guru">
      <div className="space-y-4">
        <Select label="Pilih Guru" placeholder="Pilih guru" value={guruId} onChange={(e) => setGuruId(e.target.value)}>
          {guruList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </Select>

        <Select label="Mapel" placeholder="Pilih mapel" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
        </Select>

        <Btn className="w-full" loading={submitting} disabled={!guruId || !mapelId} onClick={handleSubmit}>
          Tambah Guru
        </Btn>
      </div>
    </Modal>
  );
}