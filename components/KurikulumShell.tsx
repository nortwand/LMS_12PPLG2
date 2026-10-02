"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Btn as Button, STYLES, ThemeToggle } from "@/app/guru/_ui";

type KurikulumTab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "ASESMEN" | "PERFORMA";

const TABS: { key: KurikulumTab; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum" },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS" },
  { key: "SISWA", label: "Daftar Siswa", href: "/kurikulum?tab=SISWA" },
  { key: "GURU", label: "Daftar Guru", href: "/kurikulum?tab=GURU" },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA" },
];

function TabIcon({ tab }: { tab: KurikulumTab }) {
  const paths: Record<KurikulumTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">{paths[tab]}</svg>;
}

export default function KurikulumShell({ children, activeTab = "KELAS" }: { children: React.ReactNode; activeTab?: KurikulumTab }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [me, setMe] = useState<{ nama: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me").then((res) => res.json()).then((data) => setMe(data.data)).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="lp flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <style>{STYLES}</style>
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Buka menu Kurikulum" aria-expanded={sidebarOpen} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--tint)] lg:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Perluas menu" : "Ciutkan menu"} aria-expanded={!sidebarCollapsed} className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)] lg:flex">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}><path d="m14 18-6-6 6-6M20 4v16" /></svg>
            </button>
            <span className="text-base font-semibold tracking-tight">Studify</span>
          </div>
          <div className="flex items-center gap-3">
            {me && <div className="hidden text-right sm:block"><p className="text-sm font-medium">{me.nama}</p><p className="text-xs text-[var(--muted)]">KURIKULUM</p></div>}
            <div className="hidden sm:block"><Avatar src={me?.fotoProfil} nama={me?.nama ?? "Kurikulum"} /></div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} aria-hidden="true" className="fixed inset-x-0 bottom-0 top-14 z-40 bg-[var(--fg)]/30 lg:hidden" />}
        <aside aria-label="Navigasi kurikulum" className={`fixed bottom-0 left-0 top-14 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-3 transition-[width,transform] duration-150 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}>
          <p className={`mb-2 px-3 pt-2 text-xs font-medium text-[var(--muted)] ${sidebarCollapsed ? "lg:sr-only" : ""}`}>Dashboard Kurikulum</p>
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => <Link key={tab.key} href={tab.href} onClick={() => setSidebarOpen(false)} aria-current={activeTab === tab.key ? "page" : undefined} title={tab.label} className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""} ${activeTab === tab.key ? "bg-[var(--brand)] text-[var(--on-brand)]" : "text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]"}`}><TabIcon tab={tab.key} /><span className={sidebarCollapsed ? "lg:sr-only" : ""}>{tab.label}</span></Link>)}
          </nav>
          <Button size="md" variant="outline" onClick={handleLogout} title="Keluar" className={`mt-auto w-full ${sidebarCollapsed ? "lg:px-0" : ""}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M10 17l5-5-5-5M15 12H3M21 4v16" /></svg><span className={sidebarCollapsed ? "lg:sr-only" : ""}>Keluar</span></Button>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:py-6"><div className="mx-auto max-w-6xl">{children}</div></main>
      </div>

      <footer className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6"><span className="font-medium text-[var(--fg)]">Studify</span><span>© 2026 Studify. All Rights Reserved.</span></div>
      </footer>
    </div>
  );
}