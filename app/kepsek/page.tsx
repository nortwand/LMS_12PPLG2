// app/kepsek/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { AkunData } from "@/components/AkunCard";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import Badge from "@/components/ui/Badge";
import { Avatar, Btn as Button, INPUT, LABEL, PageTitle, PANEL, STYLES, ThemeToggle } from "@/app/guru/_ui";

type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";
type KepsekAsesmen = AsesmenData & { guru: { id: string; nama: string } };

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
  akunTerbaru: { id: string; nama: string; email: string; role: "SISWA" | "GURU"; createdAt: string }[];
  aktivitas: { periodeHari: number; userAktif: number; siswaAktif: number; guruAktif: number; aktivitasHarian: { tanggal: string; asesmen: number; tugas: number; submission: number; userAktif: number }[] };
  akademik: { trendNilai: { tanggal: string; judul: string; nilai: number | null }[]; rataRataPerKelas: { label: string; nilai: number | null }[]; rataRataPerMapel: { label: string; nilai: number | null }[] };
  aktivitasPembelajaran: { asesmenSelesai: number; asesmenBelum: number; tugasDikumpulkan: number; tugasBelum: number };
}

function normalizeDashboardData(data: (Omit<AdminDashboardData, "aktivitas"> & { aktivitas?: AdminDashboardData["aktivitas"] }) | null | undefined): AdminDashboardData | null {
  if (!data) return null;
  return {
    ...data,
    aktivitas: data.aktivitas ?? { periodeHari: 14, userAktif: 0, siswaAktif: 0, guruAktif: 0, aktivitasHarian: [] },
    akademik: data.akademik ?? { trendNilai: [], rataRataPerKelas: [], rataRataPerMapel: [] },
    aktivitasPembelajaran: data.aktivitasPembelajaran ?? { asesmenSelesai: 0, asesmenBelum: 0, tugasDikumpulkan: 0, tugasBelum: 0 },
  };
}

function TabIcon({ tab }: { tab: Tab }) {
  const paths: Record<Tab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[tab]}
    </svg>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "ASESMEN", label: "Asesmen" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

function KepsekDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [akunRole, setAkunRole] = useState<"SISWA" | "GURU">("SISWA");
  const [asesmenList, setAsesmenList] = useState<KepsekAsesmen[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");
  const [guruSearch, setGuruSearch] = useState("");
  const [expandedGuruId, setExpandedGuruId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "SISWA" || tab === "GURU") {
      setAkunRole(tab === "GURU" ? "GURU" : "SISWA");
      setActiveTab("AKUN");
      return;
    }
    if (tab && TABS.some((item) => item.key === tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTabData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "AKUN") {
      loadTabData("AKUN");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [akunRole, activeTab]);

  async function loadTabData(tab: Tab) {
    setLoading(true);
    setLoadError(false);
    try {
      if (tab === "DASHBOARD" || tab === "PERFORMA") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      } else if (tab === "KELAS") {
        const res = await fetch("/api/kelas");
        const data = await res.json();
        setKelasList(data.data ?? []);
      } else if (tab === "AKUN") {
        const [res, referensiRes] = await Promise.all([
          fetch(`/api/akun?role=${akunRole}`),
          fetch("/api/kelas-referensi"),
        ]);
        const [data, referensiData] = await Promise.all([res.json(), referensiRes.json()]);
        if (akunRole === "SISWA") {
          setSiswaList(data.data ?? []);
        } else {
          setGuruList(data.data ?? []);
        }
        setKelasReferensiList(referensiData.data ?? []);
        if (akunRole === "GURU") {
          const mapelRes = await fetch("/api/mapel");
          const mapelData = await mapelRes.json();
          setMapelList(mapelData.data ?? []);
        }
      } else if (tab === "ASESMEN") {
        const res = await fetch("/api/asesmen");
        const data = await res.json();
        setAsesmenList(data.data ?? []);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function openTab(tab: Tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  const jurusanOptions = Array.from(new Set(kelasReferensiList.map((kelas) => kelas.jurusan?.nama).filter(Boolean))) as string[];
  const kelasOptions = ["SMP", "SMA", "10", "11", "12"];
  const filteredSiswaList = siswaList.filter((siswa) => {
    const jurusan = siswa.kelasReferensi?.jurusan?.nama ?? "";
    const tingkat = siswa.kelasReferensi?.jenjang === "SMP" || siswa.kelasReferensi?.jenjang === "SMA"
      ? siswa.kelasReferensi.jenjang
      : siswa.kelasReferensi?.tingkat?.toString() ?? "";
    const query = siswaSearch.trim().toLowerCase();
    const cocokJurusan = !jurusanFilter || jurusan === jurusanFilter;
    const cocokKelas = !kelasFilter || tingkat === kelasFilter;
    const cocokSearch = !query || [siswa.nama, siswa.email, siswa.nis ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokJurusan && cocokKelas && cocokSearch;
  });
  const mapelOptions = mapelList.map((mapel) => mapel.nama);
  const filteredGuruList = guruList.filter((guru) => {
    const mapel = guru.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [];
    const query = guruSearch.trim().toLowerCase();
    const cocokMapel = !mapelFilter || mapel.includes(mapelFilter);
    const cocokSearch = !query || [guru.nama, guru.email, guru.nik ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokMapel && cocokSearch;
  });
  const asesmenByGuru = Array.from(asesmenList.reduce((groups, asesmen) => {
    const group = groups.get(asesmen.guru.id) ?? { guru: asesmen.guru, asesmen: [] as KepsekAsesmen[] };
    group.asesmen.push(asesmen);
    groups.set(asesmen.guru.id, group);
    return groups;
  }, new Map<string, { guru: KepsekAsesmen["guru"]; asesmen: KepsekAsesmen[] }>()).values());

  return (
    <div className="lp flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <style>{STYLES}</style>
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Buka menu Kepsek" aria-expanded={sidebarOpen} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--tint)] lg:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Perluas menu" : "Ciutkan menu"} aria-expanded={!sidebarCollapsed} className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)] lg:flex">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}><path d="m14 18-6-6 6-6M20 4v16" /></svg>
            </button>
            <span className="text-base font-semibold tracking-tight">Studify</span>
          </div>
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{me.nama}</p>
                <p className="text-xs text-[var(--muted)]">{me.role}</p>
              </div>
            )}
            <div className="hidden sm:block"><Avatar src={me?.fotoProfil} nama={me?.nama ?? "Kepsek"} /></div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} aria-hidden="true" className="fixed inset-x-0 bottom-0 top-14 z-40 bg-[var(--fg)]/30 lg:hidden" />}

        <aside
          aria-label="Navigasi kepsek"
          className={`fixed bottom-0 left-0 top-14 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-3 transition-[width,transform] duration-150 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}
        >
          <p className={`mb-2 px-3 pt-2 text-xs font-medium text-[var(--muted)] ${sidebarCollapsed ? "lg:sr-only" : ""}`}>Dashboard Kepsek</p>
          <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => openTab(tab.key)}
                  title={tab.label}
                  className={`flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""} ${activeTab === tab.key ? "bg-[var(--brand)] text-[var(--on-brand)]" : "text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]"}`}
                >
                  <TabIcon tab={tab.key} />
                  <span className={sidebarCollapsed ? "lg:sr-only" : ""}>{tab.label}</span>
                </button>
              ))}
          </nav>
          <Button size="md" variant="outline" onClick={handleLogout} title="Keluar" className={`mt-auto w-full ${sidebarCollapsed ? "lg:px-0" : ""}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M10 17l5-5-5-5M15 12H3M21 4v16" /></svg>
            <span className={sidebarCollapsed ? "lg:sr-only" : ""}>Keluar</span>
          </Button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:py-6">
          <div className="mx-auto max-w-6xl">
          {loading && <p role="status" aria-live="polite" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">Memuat data...</p>}
          {!loading && loadError && <p role="alert" className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--fg)]">Data belum dapat dimuat. Coba pilih tab ini kembali.</p>}

          {!loading && activeTab === "DASHBOARD" && dashboardData && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">Dashboard Kepsek</p>
                <h1 className="mt-1 text-xl font-semibold">Selamat datang, {me?.nama ?? "Kepsek"}</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Pantau kelas, akun, dan performa akademik Studify · akses lihat saja.</p>
              </div>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[var(--border)] bg-[var(--border)] lg:grid-cols-4">
                {[
                  ["Kelas", dashboardData.statistik.kelas, "Lihat kelas", "KELAS"],
                  ["Siswa", dashboardData.statistik.siswa, "Daftar siswa", "SISWA"],
                  ["Guru", dashboardData.statistik.guru, "Daftar guru", "GURU"],
                  ["Asesmen", dashboardData.statistik.asesmen, "Kuis dan ujian", "KELAS"],
                  ["Tugas", dashboardData.statistik.tugas, "Tugas dibuat", "KELAS"],
                  ["Mata Pelajaran", dashboardData.statistik.mapel, "Mapel tersedia", "GURU"],
                  ["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Dari asesmen dinilai", "PERFORMA"],
                ].map(([label, value, caption, tab]) => (
                  <button key={label as string} type="button" onClick={() => openTab(tab as Tab)} className="min-h-24 bg-[var(--surface)] p-4 text-left transition-colors hover:bg-[var(--tint)]">
                    <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--fg)]">{value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{caption}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--fg)]">Akun Terbaru</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Lima akun siswa dan guru terakhir dibuat.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setAkunRole("SISWA");
                    setActiveTab("AKUN");
                  }}>Lihat Akun</Button>
                </div>
                <div className="mt-4 divide-y divide-[var(--border)]">
                  {dashboardData.akunTerbaru.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Belum ada akun.</p>
                  ) : (
                    dashboardData.akunTerbaru.map((akun) => (
                      <button key={akun.id} type="button" onClick={() => router.push(`/profil/${akun.id}`)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[var(--tint)]">
                        <span>
                          <span className="block text-sm font-semibold text-[var(--fg)]">{akun.nama}</span>
                          <span className="block text-xs text-[var(--muted)]">{akun.email}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{akun.role === "GURU" ? "Guru" : "Siswa"}</Badge>
                          <span className="mt-1 block text-[11px] text-[var(--muted)]">{new Date(akun.createdAt).toLocaleDateString("id-ID")}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === "PERFORMA" && dashboardData && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">Analitik LMS</p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--fg)]">Performa Akademik & Data</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Nilai asesmen dinilai"], ["Asesmen Dinilai", dashboardData.statistik.submissionDinilai, "Submission dengan nilai"], ["Tugas Dibuat", dashboardData.statistik.tugasDibuat, "Total tugas guru"], ["Tugas Dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Submission siswa"]].map(([label, value, caption]) => (
                  <div key={label as string} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--fg)]">{value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{caption}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-[var(--fg)]">Kuis dan Ujian</h2>
                  <div className="mt-5 space-y-4">
                      {[ ["Kuis", dashboardData.statistik.kuis, "var(--chart-1)"], ["Ujian Online", dashboardData.statistik.ujian, "var(--chart-2)"]].map(([label, value, color]) => {
                      const max = Math.max(dashboardData.statistik.kuis, dashboardData.statistik.ujian, 1);
                      return (
                        <div key={label as string}>
                          <div className="mb-1 flex justify-between text-xs font-semibold text-[var(--muted)]"><span>{label}</span><span>{value}</span></div>
                          <div className="h-3 rounded-full bg-[var(--tint)]"><div className="h-3 rounded-full" style={{ width: `${((value as number) / max) * 100}%`, background: color as string }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-[var(--fg)]">Tugas Dibuat vs Dikumpulkan</h2>
                  <div className="mt-5 space-y-4">
                    {[["Tugas dibuat", dashboardData.statistik.tugasDibuat, "var(--chart-1)"], ["Dikumpulkan siswa", dashboardData.statistik.tugasDikumpulkan, "var(--chart-2)"]].map(([label, value, color]) => {
                      const max = Math.max(dashboardData.statistik.tugasDibuat, dashboardData.statistik.tugasDikumpulkan, 1);
                      return (
                        <div key={label as string}>
                          <div className="mb-1 flex justify-between text-xs font-semibold text-[var(--muted)]"><span>{label}</span><span>{value}</span></div>
                          <div className="h-3 rounded-full bg-[var(--tint)]"><div className="h-3 rounded-full" style={{ width: `${Math.min(((value as number) / max) * 100, 100)}%`, background: color as string }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-[var(--fg)]">Grafik Linear Tren Rata-rata Nilai Akademik Sekolah</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Perubahan rata-rata nilai seluruh siswa berdasarkan periode asesmen.</p>
                  <AcademicTrendChart items={dashboardData.akademik.trendNilai} />
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-[var(--fg)]">Grafik Batang Rata-rata Nilai per Kelas</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Perbandingan capaian akademik rata-rata setiap kelas.</p>
                  <AcademicBarChart items={dashboardData.akademik.rataRataPerKelas} label="kelas" color="var(--chart-1)" />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-[var(--fg)]">Grafik Batang Rata-rata Nilai per Mata Pelajaran</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Perbandingan rata-rata nilai untuk setiap mata pelajaran.</p>
                  <AcademicBarChart items={dashboardData.akademik.rataRataPerMapel} label="mata pelajaran" color="var(--chart-2)" />
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-[var(--fg)]">Grafik Progress Aktivitas Pembelajaran</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Status penyelesaian asesmen dan tugas di seluruh sekolah.</p>
                  <LearningProgressChart items={[
                    ["Asesmen sudah dikerjakan", dashboardData.aktivitasPembelajaran.asesmenSelesai, "var(--chart-1)"],
                    ["Asesmen belum dikerjakan", dashboardData.aktivitasPembelajaran.asesmenBelum, "var(--border-strong)"],
                    ["Tugas dikumpulkan", dashboardData.aktivitasPembelajaran.tugasDikumpulkan, "var(--chart-2)"],
                    ["Tugas belum dikumpulkan", dashboardData.aktivitasPembelajaran.tugasBelum, "var(--chart-2)"],
                  ]} />
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === "KELAS" && (
            <div className="space-y-5">
              <PageTitle title="Kelas Sekolah" desc="Lihat daftar kelas, anggota, dan aktivitas pembelajaran." />
              {kelasList.length === 0 ? (
                <p className={`${PANEL} rounded-md text-sm text-[var(--muted)]`}>Belum ada kelas dibuat.</p>
              ) : (
                <section className={`${PANEL} rounded-md py-2`}>
                  {kelasList.map((k) => (
                    <KelasCard key={k.id} data={k} isEditable={false} variant="list" basePath="/kepsek/kelas" />
                  ))}
                </section>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-[var(--fg)]">Daftar Akun</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Lihat data siswa dan guru (akses lihat saja).</p>
              </div>
              <div className="inline-flex w-fit rounded-md border border-[var(--border)] bg-[var(--surface)] p-1" role="group" aria-label="Pilih jenis akun">
                {(["SISWA", "GURU"] as const).map((role) => (
                  <button key={role} type="button" onClick={() => setAkunRole(role)} aria-pressed={akunRole === role} className={`min-h-9 rounded px-4 text-sm font-medium transition-colors ${akunRole === role ? "bg-[var(--brand)] text-[var(--on-brand)]" : "text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]"}`}>
                    {role === "SISWA" ? "Siswa" : "Guru"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && activeTab === "AKUN" && akunRole === "SISWA" && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
              <div className="mb-3 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-3 md:grid-cols-[180px_220px_minmax(220px,1fr)_auto] md:items-end">
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Jurusan
                  <select value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]">
                    <option value="">Semua Jurusan</option>
                    {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Kelas
                  <select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]">
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Search
                  <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder="Nama, email, atau NIS..." className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]" />
                </label>
                <button type="button" onClick={() => { setJurusanFilter(""); setKelasFilter(""); setSiswaSearch(""); }} className="min-h-10 cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]">Reset</button>
              </div>
              {filteredSiswaList.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada siswa terdaftar.</p>
              ) : (
                <div className="max-w-full overflow-x-auto rounded-md border border-[var(--border)]">
                  <table className="w-full min-w-[750px] text-left text-sm [&_th]:px-3 [&_th]:py-3 [&_td]:px-3">
                    <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                      <tr>
                        <th className="pb-3 font-semibold">No</th>
                        <th className="pb-3 font-semibold">Profil</th>
                        <th className="pb-3 font-semibold">Nama</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">NIS</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Kelas/Rombel</th>
                        <th className="pb-3 font-semibold">Jurusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredSiswaList.map((s, index) => (
                        <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[var(--tint)]">
                          <td className="py-3 text-xs text-[var(--muted)]">{index + 1}</td>
                          <td className="py-3"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--tint)] text-xs font-bold text-[var(--muted)]">{s.fotoProfil ? <img src={s.fotoProfil} alt={s.nama} className="h-full w-full object-cover" /> : s.nama.charAt(0)}</div></td>
                          <td className="py-3 font-semibold text-[var(--fg)]">{s.nama}</td>
                          <td className="py-3 text-xs text-[var(--muted)]">{s.email}</td>
                          <td className="py-3 text-xs text-[var(--muted)]">{s.nis ?? "-"}</td>
                          <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                          <td className="py-3 text-xs text-[var(--muted)]" title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || "Belum ada kelas"}>
                            {s.kelasSiswa?.length ?? 0} Kelas
                          </td>
                          <td className="py-3 text-xs text-[var(--muted)]">{s.kelasReferensi?.label ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && akunRole === "GURU" && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
              <div className="mb-3 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Mapel
                  <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]">
                    <option value="">Semua Mapel</option>
                    {mapelOptions.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[var(--muted)]">
                  Search
                  <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder="Nama, email, atau NIK..." className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]" />
                </label>
                <button type="button" onClick={() => { setMapelFilter(""); setGuruSearch(""); }} className="min-h-10 cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]">Reset</button>
              </div>
              {filteredGuruList.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada guru terdaftar.</p>
              ) : (
                <div className="max-w-full overflow-x-auto rounded-md border border-[var(--border)]">
                  <table className="w-full min-w-[680px] text-left text-sm [&_th]:px-3 [&_th]:py-3 [&_td]:px-3">
                    <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                      <tr>
                        <th className="pb-3 font-semibold">No</th>
                        <th className="pb-3 font-semibold">Profil</th>
                        <th className="pb-3 font-semibold">Nama</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">NIK</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Mapel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredGuruList.map((g, index) => (
                        <tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-[var(--tint)]">
                          <td className="py-3 text-xs text-[var(--muted)]">{index + 1}</td>
                          <td className="py-3"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--tint)] text-xs font-bold text-[var(--muted)]">{g.fotoProfil ? <img src={g.fotoProfil} alt={g.nama} className="h-full w-full object-cover" /> : g.nama.charAt(0)}</div></td>
                          <td className="py-3 font-semibold text-[var(--fg)]">{g.nama}</td>
                          <td className="py-3 text-xs text-[var(--muted)]">{g.email}</td>
                          <td className="py-3 text-xs text-[var(--muted)]">{g.nik ?? "-"}</td>
                          <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                          <td className="py-3 text-xs text-[var(--muted)]">{Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || "Belum ada mapel"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "ASESMEN" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold text-[var(--fg)]">Asesmen Guru</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Pilih guru untuk melihat seluruh asesmen yang dibuatnya.</p>
              </div>
              {asesmenByGuru.length === 0 ? (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-sm text-[var(--muted)]">Belum ada asesmen yang dibuat guru.</p>
                </div>
              ) : (
                asesmenByGuru.map(({ guru, asesmen }) => {
                  const expanded = expandedGuruId === guru.id;
                  return (
                    <section key={guru.id} className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
                      <button
                        type="button"
                        onClick={() => setExpandedGuruId(expanded ? null : guru.id)}
                        aria-expanded={expanded}
                        className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 p-4 text-left hover:bg-[var(--tint)]"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--tint)] text-sm font-bold text-[var(--link)]">{guru.nama.charAt(0)}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[var(--fg)]">{guru.nama}</span>
                            <span className="block text-xs text-[var(--muted)]">{asesmen.length} asesmen</span>
                          </span>
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      {expanded && (
                        <div className="border-t border-[var(--border)] p-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {asesmen.map((item) => <AsesmenCard key={item.id} data={item} basePath="/kepsek/asesmen" />)}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })
              )}
            </div>
          )}
          </div>
        </main>
      </div>

      <footer className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6"><span className="font-medium text-[var(--fg)]">Studify</span><span>© 2026 Studify. All Rights Reserved.</span></div>
      </footer>
    </div>
  );
}

export default function KepsekDashboard() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--surface)] text-sm text-[var(--muted)]">Memuat dashboard…</div>}>
      <KepsekDashboardContent />
    </Suspense>
  );
}

type AcademicTrend = AdminDashboardData["akademik"]["trendNilai"][number];
type AcademicAverage = AdminDashboardData["akademik"]["rataRataPerKelas"][number];

function AcademicTrendChart({ items }: { items: AcademicTrend[] }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[var(--muted)]">Data tren nilai belum tersedia.</p>;
  }

  const width = 640;
  const height = 250;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = 100;
  const xFor = (index: number) => left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth);
  const yFor = (value: number) => top + chartHeight - (value / maximum) * chartHeight;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.nilai ?? 0)}`).join(" ");
  const gridValues = [0, 25, 50, 75, 100];

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px]" role="img" aria-label="Tren rata-rata nilai akademik sekolah">
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} style={{ stroke: "var(--border)" }} strokeDasharray="4 4" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--muted)" }}>{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" style={{ stroke: "var(--chart-1)" }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={`${item.tanggal}-${item.judul}`}>
            <circle cx={xFor(index)} cy={yFor(item.nilai ?? 0)} r="4" style={{ fill: "var(--surface)", stroke: "var(--chart-1)" }} strokeWidth="3">
              <title>{`${item.tanggal}: ${item.nilai ?? 0} (${item.judul})`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" style={{ fill: "var(--muted)" }}>{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AcademicBarChart({ items, label, color }: { items: AcademicAverage[]; label: string; color: string }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[var(--muted)]">Data nilai per {label} belum tersedia.</p>;
  }

  const maximum = 100;
  return (
    <div className="mt-5 space-y-3">
      {items.map((item) => {
        const value = item.nilai ?? 0;
        return (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs font-semibold text-[var(--muted)]"><span className="truncate">{item.label}</span><span>{value}</span></div>
            <div className="h-3 rounded-full bg-[var(--tint)]"><div className="h-3 rounded-full" style={{ width: `${Math.min((value / maximum) * 100, 100)}%`, background: color }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function LearningProgressChart({ items }: { items: [string, number, string][] }) {
  const maximum = Math.max(...items.map(([, value]) => value), 1);
  return (
    <div className="mt-5 space-y-4">
      {items.map(([label, value, color]) => (
        <div key={label}>
          <div className="mb-1 flex justify-between gap-3 text-xs font-semibold text-[var(--muted)]"><span>{label}</span><span>{value}</span></div>
          <div className="h-3 rounded-full bg-[var(--tint)]"><div className="h-3 rounded-full" style={{ width: `${(value / maximum) * 100}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}