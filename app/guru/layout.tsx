"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { STYLES, ThemeToggle, Avatar } from "@/app/guru/_ui";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Layout ini membungkus semua halaman /guru/* dan menyediakan token (.lp),
  header, sidebar, dan footer. Halaman anak cukup memakai var(--...).
*/

type NavKey = "DASHBOARD" | "KELAS" | "ASESMEN" | "TUGAS" | "MATERI" | "PERFORMA" | "PROFILE";

function NavIcon({ nav }: { nav: NavKey }) {
  const paths: Record<NavKey, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    ASESMEN: <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />,
    TUGAS: <path d="M9 3h6l1 3H8l1-3ZM6 6h12v15H6zM9 11h6M9 15h6" />,
    MATERI: <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H18a2 2 0 0 1 2 2v11.5A2.5 2.5 0 0 1 17.5 19H7.5A2.5 2.5 0 0 1 5 16.5v-11ZM8 7h8M8 11h8M8 15h5" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
    PROFILE: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[nav]}
    </svg>
  );
}

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
    { key: "DASHBOARD", label: "Dashboard", href: "/guru" },
    { key: "KELAS", label: "Kelas", href: "/guru/kelas" },
    { key: "ASESMEN", label: "Asesmen", href: "/guru/asesmen" },
    { key: "TUGAS", label: "Tugas", href: "/guru/tugas" },
    { key: "MATERI", label: "Materi", href: "/guru/materi" },
    { key: "PERFORMA", label: "Performa Akademik", href: "/guru/performa-akademik" },
    { key: "PROFILE", label: "Profile", href: me ? `/profil/${me.id}` : "#" },
  ];

  function isActive(href: string) {
    if (href === "/guru") return pathname === "/guru";
    return pathname.startsWith(href);
  }

  const labelCls = sidebarCollapsed ? "lg:hidden" : "";

  return (
    <div
      className="lp flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{STYLES}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* mobile: buka drawer */}
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
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
              onClick={() => setSidebarCollapsed((v) => !v)}
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
                <p className="text-xs leading-tight text-[var(--muted)]">Guru</p>
              </div>
            )}
            <div className="hidden sm:block">
              <Avatar src={me?.fotoProfil} nama={me?.nama} />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* BACKDROP (mobile saja) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          aria-label="Navigasi guru"
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-3 transition-transform duration-150 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:flex-shrink-0 lg:translate-x-0 lg:transition-[width]
            ${sidebarCollapsed ? "lg:w-16" : "lg:w-60"}`}
        >
          <p className={`mb-2 px-3 pt-2 text-xs font-medium text-[var(--muted)] ${labelCls}`}>Dashboard Guru</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-medium ${
                    sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                  } ${
                    active
                      ? "bg-[var(--brand)] text-[var(--on-brand)]"
                      : "text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]"
                  }`}
                >
                  <NavIcon nav={item.key} />
                  <span className={labelCls}>{item.label}</span>
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
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-medium text-[var(--fg)]">Studify</span>
          <span>© 2026 Studify. All Rights Reserved.</span>
        </div>
      </footer>
    </div>
  );
}