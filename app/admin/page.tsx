"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KelasCard, { KelasData } from "@/components/KelasCard";
import ModalKelas from "@/components/ModalKelas";
import { AkunData } from "@/components/AkunCard";
import ModalAkun from "@/components/ModalAkun";
import LaporanCard, { LaporanData } from "@/components/LaporanCard";
import Modal from "@/components/ui/Modal";
import { showAlert, showConfirm } from "@/lib/dialog";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token sama dengan landing, login, dan ganti-password-awal.
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

const INPUT =
  "mt-1 h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)]";
const LABEL = "block text-xs font-medium text-[var(--muted)]";
const TH = "pb-3 pr-3 font-medium";
const TD = "py-3 pr-3";
const PANEL = "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5";

type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "LAPORAN" | "PERFORMA";

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
  akunTerbaru: { id: string; nama: string; email: string; role: "SISWA" | "GURU"; createdAt: string }[];
  aktivitas: { periodeHari: number; userAktif: number; siswaAktif: number; guruAktif: number; aktivitasHarian: { tanggal: string; asesmen: number; tugas: number; submission: number; userAktif: number }[] };
}

function normalizeDashboardData(data: (Omit<AdminDashboardData, "aktivitas"> & { aktivitas?: AdminDashboardData["aktivitas"] }) | null | undefined): AdminDashboardData | null {
  if (!data) return null;
  return {
    ...data,
    aktivitas: data.aktivitas ?? {
      periodeHari: 14,
      userAktif: 0,
      siswaAktif: 0,
      guruAktif: 0,
      aktivitasHarian: [],
    },
  };
}

function TabIcon({ tab }: { tab: Tab }) {
  const paths: Record<Tab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
    LAPORAN: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[tab]}
    </svg>
  );
}

const TABS: { key: Tab; label: string }[] = [
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
  variant?: "primary" | "outline" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60";
  const sizes = { sm: "h-9 px-3", md: "h-10 px-4" };
  const variants = {
    primary: "bg-[var(--brand)] text-[var(--on-brand)] hover:opacity-90",
    outline: "border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]",
    danger: "border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--tint)]",
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

function Pill({ tone = "muted", children }: { tone?: "brand" | "muted"; children: React.ReactNode }) {
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

function Avatar({ src, nama, size = 32 }: { src: string | null | undefined; nama: string | undefined; size?: number }) {
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

function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {desc && <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>}
    </div>
  );
}

function StatGrid({ items }: { items: { label: string; value: number | string; caption: string; onClick?: () => void }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] lg:grid-cols-4">
      {items.map((item) => {
        const body = (
          <>
            <p className="text-xs font-medium text-[var(--muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{item.caption}</p>
          </>
        );
        return item.onClick ? (
          <button key={item.label} type="button" onClick={item.onClick} className="cursor-pointer bg-[var(--surface)] p-4 text-left hover:bg-[var(--tint)]">
            {body}
          </button>
        ) : (
          <div key={item.label} className="bg-[var(--surface)] p-4">
            {body}
          </div>
        );
      })}
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-sm bg-[var(--tint)]">
        <div className="h-2 rounded-sm" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function RowMenu({ open, onToggle, onEdit, onDelete }: { open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <td className="relative whitespace-nowrap py-3 text-right">
      <button
        type="button"
        aria-label="Menu aksi"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="h-10 w-10 cursor-pointer rounded-md text-lg font-bold text-[var(--muted)] hover:bg-[var(--tint)]"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-2 top-11 z-20 w-28 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="block h-10 w-full cursor-pointer px-3 text-left text-sm hover:bg-[var(--tint)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="block h-10 w-full cursor-pointer px-3 text-left text-sm text-[var(--danger)] hover:bg-[var(--tint)]"
          >
            Hapus
          </button>
        </div>
      )}
    </td>
  );
}

function RoleSwitch({ role, onChange }: { role: "SISWA" | "GURU"; onChange: (r: "SISWA" | "GURU") => void }) {
  return (
    <div role="group" aria-label="Pilih jenis akun" className="flex gap-1 rounded-md border border-[var(--border)] p-1">
      {(["SISWA", "GURU"] as const).map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={role === r}
          onClick={() => onChange(r)}
          className={`h-8 cursor-pointer rounded-[4px] px-3 text-xs font-medium ${
            role === r ? "bg-[var(--brand)] text-[var(--on-brand)]" : "text-[var(--muted)] hover:text-[var(--fg)]"
          }`}
        >
          {r === "SISWA" ? "Siswa" : "Guru"}
        </button>
      ))}
    </div>
  );
}

/* ============ HALAMAN ============ */

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ id: string; label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanData[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [openAkunMenuId, setOpenAkunMenuId] = useState<string | null>(null);
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [rombelFilter, setRombelFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [bulkKelasId, setBulkKelasId] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [mapelFilter, setMapelFilter] = useState("");
  const [guruSearch, setGuruSearch] = useState("");

  const [showModalKelas, setShowModalKelas] = useState(false);
  const [editingKelas, setEditingKelas] = useState<KelasData | null>(null);
  const [deletingKelas, setDeletingKelas] = useState<KelasData | null>(null);

  const [showModalAkun, setShowModalAkun] = useState(false);
  const [akunMode, setAkunMode] = useState<"create" | "edit">("create");
  const [akunDefaultRole, setAkunDefaultRole] = useState<"SISWA" | "GURU">("SISWA");
  const [akunRole, setAkunRole] = useState<"SISWA" | "GURU">("SISWA");
  const [editingAkun, setEditingAkun] = useState<any>(null);

  const isAkunRole = (role: "SISWA" | "GURU") => akunRole === role;

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "SISWA" || requestedTab === "GURU") {
      setAkunRole(requestedTab === "GURU" ? "GURU" : "SISWA");
      setActiveTab("AKUN");
      return;
    }
    if (TABS.some((tab) => tab.key === requestedTab)) setActiveTab(requestedTab as Tab);
  }, []);

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
    try {
      if (tab === "DASHBOARD") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      } else if (tab === "KELAS") {
        const res = await fetch("/api/kelas");
        const data = await res.json();
        setKelasList(data.data ?? []);
      } else if (tab === "AKUN") {
        const [res, referensiRes, kelasRes] = await Promise.all([
          fetch(`/api/akun?role=${akunRole}`),
          fetch("/api/kelas-referensi"),
          fetch("/api/kelas"),
        ]);
        const [data, referensiData, kelasData] = await Promise.all([res.json(), referensiRes.json(), kelasRes.json()]);
        if (akunRole === "SISWA") {
          setSiswaList(data.data ?? []);
        } else {
          setGuruList(data.data ?? []);
        }
        setKelasReferensiList(referensiData.data ?? []);
        setKelasList(kelasData.data ?? []);
        if (akunRole === "GURU") {
          const mapelRes = await fetch("/api/mapel");
          const mapelData = await mapelRes.json();
          setMapelList(mapelData.data ?? []);
        }
      } else if (tab === "LAPORAN") {
        const res = await fetch("/api/lupa-password");
        const data = await res.json();
        setLaporanList(data.data ?? []);
      } else if (tab === "PERFORMA") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  function toggleSidebar() {
    setSidebarOpen((v) => !v);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function openBuatKelas() {
    setEditingKelas(null);
    setShowModalKelas(true);
  }
  function openEditKelas(kelas: KelasData) {
    setEditingKelas(kelas);
    setShowModalKelas(true);
  }
  async function handleDeleteKelas() {
    if (!deletingKelas) return;
    const res = await fetch(`/api/kelas/${deletingKelas.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeletingKelas(null);
      loadTabData("KELAS");
    }
  }

  function openBuatAkun(role: "SISWA" | "GURU") {
    setAkunMode("create");
    setAkunDefaultRole(role);
    setEditingAkun(null);
    setShowModalAkun(true);
  }
  function openEditAkun(akun: AkunData) {
    setAkunMode("edit");
    setAkunDefaultRole(akun.role);

    const a = akun as any;
    setEditingAkun({
      id: akun.id,
      role: akun.role,
      email: akun.email,
      nama: akun.nama,
      nis: akun.nis,
      nik: akun.nik,
      deskripsi: akun.deskripsi,
      fotoProfil: akun.fotoProfil,
      tanggalLahir: a.tanggalLahir,
      jenisKelamin: a.jenisKelamin,
      kelasReferensiId: a.kelasReferensi?.id,
      mapelId: a.kelasGuruMapel?.[0]?.mapel?.id,
      kelasIds:
        akun.role === "SISWA"
          ? (a.kelasSiswa ?? []).map((ks: any) => ks.kelas.id)
          : (a.kelasGuruMapel ?? []).map((kg: any) => kg.kelas.id),
      // walasKelasId dihapus -- fitur walas gak ada lagi
    });
    setShowModalAkun(true);
  }
  async function handleDeleteAkun(id: string) {
    if (!(await showConfirm("Hapus akun ini?"))) return;
    const res = await fetch(`/api/akun/${id}`, { method: "DELETE" });
    if (res.ok) loadTabData("AKUN");
  }

  function toggleAkunMenu(id: string) {
    setOpenAkunMenuId((current) => (current === id ? null : id));
  }

  const jurusanOptions = Array.from(new Set(kelasReferensiList.map((kelas) => kelas.jurusan?.nama).filter(Boolean))) as string[];
  const kelasOptions = Array.from(new Set(kelasReferensiList.map((kelas) =>
    kelas.jenjang === "SMP" || kelas.jenjang === "SMA" ? kelas.jenjang : kelas.tingkat?.toString()
  ).filter(Boolean))) as string[];
  const rombelOptions = kelasReferensiList.filter((rombel) => {
    const jurusan = rombel.jurusan?.nama ?? "";
    const tingkat = rombel.jenjang === "SMP" || rombel.jenjang === "SMA" ? rombel.jenjang : rombel.tingkat?.toString() ?? "";
    return (!jurusanFilter || jurusan === jurusanFilter) && (!kelasFilter || tingkat === kelasFilter);
  });
  const hasSiswaFilter = Boolean(jurusanFilter || kelasFilter || rombelFilter || siswaSearch.trim());
  const filteredSiswaList = siswaList.filter((siswa) => {
    const jurusan = siswa.kelasReferensi?.jurusan?.nama ?? "";
    const tingkat = siswa.kelasReferensi?.jenjang === "SMP" || siswa.kelasReferensi?.jenjang === "SMA"
      ? siswa.kelasReferensi.jenjang
      : siswa.kelasReferensi?.tingkat?.toString() ?? "";
    const query = siswaSearch.trim().toLowerCase();
    const cocokJurusan = !jurusanFilter || jurusan === jurusanFilter;
    const cocokKelas = !kelasFilter || tingkat === kelasFilter;
    const cocokRombel = !rombelFilter || siswa.kelasReferensi?.id === rombelFilter;
    const cocokSearch = !query || [siswa.nama, siswa.email, siswa.nis ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokJurusan && cocokKelas && cocokRombel && cocokSearch;
  });

  async function handleKirimHasilFilter() {
    const kelasTujuan = kelasList.find((kelas) => kelas.id === bulkKelasId);
    if (!kelasTujuan || !hasSiswaFilter || filteredSiswaList.length === 0) return;
    if (!(await showConfirm(`Kirim ${filteredSiswaList.length} siswa yang cocok dengan filter ke kelas ${kelasTujuan.judul}? Siswa yang sudah menjadi anggota akan dilewati.`))) return;

    setBulkSending(true);
    try {
      const response = await fetch(`/api/kelas/${kelasTujuan.id}/siswa/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurusan: jurusanFilter || undefined,
          kelas: kelasFilter || undefined,
          rombelId: rombelFilter || undefined,
          search: siswaSearch.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        await showAlert(payload?.error ?? "Gagal mengirim hasil filter ke kelas.");
        return;
      }

      await showAlert(`Pengiriman selesai: ${payload.data.ditambahkan} ditambahkan, ${payload.data.dilewati} dilewati.`);
      await loadTabData("AKUN");
      await loadTabData("KELAS");
    } catch {
      await showAlert("Gagal mengirim hasil filter ke kelas. Coba lagi.");
    } finally {
      setBulkSending(false);
    }
  }
  const mapelOptions = mapelList.map((mapel) => mapel.nama);
  const filteredGuruList = guruList.filter((guru) => {
    const mapel = guru.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [];
    const query = guruSearch.trim().toLowerCase();
    const cocokMapel = !mapelFilter || mapel.includes(mapelFilter);
    const cocokSearch = !query || [guru.nama, guru.email, guru.nik ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokMapel && cocokSearch;
  });

  function openAdminTab(tab: Tab, targetRole?: "SISWA" | "GURU") {
    if (tab === "AKUN" && targetRole) setAkunRole(targetRole);
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  const dashboardTiles = dashboardData
    ? ([
        ["Kelas", dashboardData.statistik.kelas, "Kelola kelas", "KELAS"],
        ["Siswa", dashboardData.statistik.siswa, "Daftar siswa", "AKUN"],
        ["Guru", dashboardData.statistik.guru, "Daftar guru", "AKUN"],
        ["Asesmen", dashboardData.statistik.asesmen, "Kuis dan ujian", "KELAS"],
        ["Tugas", dashboardData.statistik.tugas, "Tugas dibuat", "KELAS"],
        ["Mata Pelajaran", dashboardData.statistik.mapel, "Mapel tersedia", "GURU"],
        ["Laporan Pending", dashboardData.statistik.laporanPending, "Perlu ditinjau", "LAPORAN"],
        ["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Dari asesmen dinilai", "PERFORMA"],
      ] as [string, number, string, string][])
    : [];

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
              onClick={toggleSidebar}
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
                <p className="text-xs leading-tight text-[var(--muted)]">{me.role}</p>
              </div>
            )}
            <div className="hidden sm:block">
              <Avatar src={me?.fotoProfil} nama={me?.nama} size={36} />
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
          aria-label="Navigasi admin"
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-3 transition-transform duration-150 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:flex-shrink-0 lg:translate-x-0 lg:transition-[width]
            ${sidebarCollapsed ? "lg:w-16" : "lg:w-60"}`}
        >
          <p className={`mb-2 px-3 pt-2 text-xs font-medium text-[var(--muted)] ${sidebarCollapsed ? "lg:hidden" : ""}`}>
            Dashboard Admin
          </p>
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false);
                  }}
                  title={tab.label}
                  className={`flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium ${
                    sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                  } ${
                    active
                      ? "bg-[var(--brand)] text-[var(--on-brand)]"
                      : "text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--fg)]"
                  }`}
                >
                  <TabIcon tab={tab.key} />
                  <span className={sidebarCollapsed ? "lg:hidden" : ""}>{tab.label}</span>
                </button>
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
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Keluar</span>
          </button>
        </aside>

        {/* KONTEN */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-6xl">
            {loading && <p className="text-sm text-[var(--muted)]">Memuat...</p>}

            {!loading && activeTab === "DASHBOARD" && dashboardData && (
              <div className="space-y-6">
                <PageTitle
                  title={`Selamat datang, ${me?.nama ?? "Admin"}`}
                  desc="Kelola akun, kelas, dan aktivitas pembelajaran Studify dari satu tempat."
                />

                <StatGrid
                  items={dashboardTiles.map(([label, value, caption, tab]) => ({
                    label,
                    value,
                    caption,
                    onClick: () => {
                      if (tab === "AKUN") {
                        openAdminTab("AKUN", label === "Guru" ? "GURU" : "SISWA");
                        return;
                      }
                      openAdminTab(tab as Tab);
                    },
                  }))}
                />

                <section className={PANEL}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Akun Terbaru</h2>
                      <p className="mt-1 text-xs text-[var(--muted)]">Lima akun siswa dan guru terakhir dibuat.</p>
                    </div>
                    <Btn size="sm" variant="outline" onClick={() => openAdminTab("AKUN", "SISWA")}>
                      Kelola Akun
                    </Btn>
                  </div>
                  <div className="mt-4 divide-y divide-[var(--border)]">
                    {dashboardData.akunTerbaru.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">Belum ada akun.</p>
                    ) : (
                      dashboardData.akunTerbaru.map((akun) => (
                        <button
                          key={akun.id}
                          type="button"
                          onClick={() => router.push(`/profil/${akun.id}`)}
                          className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 py-3 text-left hover:bg-[var(--tint)]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{akun.nama}</span>
                            <span className="block truncate text-xs text-[var(--muted)]">{akun.email}</span>
                          </span>
                          <span className="flex flex-shrink-0 flex-col items-end gap-1">
                            <Pill tone={akun.role === "GURU" ? "brand" : "muted"}>{akun.role === "GURU" ? "Guru" : "Siswa"}</Pill>
                            <span className="text-xs tabular-nums text-[var(--muted)]">
                              {new Date(akun.createdAt).toLocaleDateString("id-ID")}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}

            {!loading && activeTab === "PERFORMA" && dashboardData && (
              <div className="space-y-6">
                <PageTitle
                  title="Performa Akademik & Data"
                  desc="Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem."
                />

                <StatGrid
                  items={[
                    { label: "Rata-rata Nilai", value: dashboardData.statistik.rataRataNilai, caption: "Nilai asesmen dinilai" },
                    { label: "Asesmen Dinilai", value: dashboardData.statistik.submissionDinilai, caption: "Submission dengan nilai" },
                    { label: "Tugas Dibuat", value: dashboardData.statistik.tugasDibuat, caption: "Total tugas guru" },
                    { label: "Tugas Dikumpulkan", value: dashboardData.statistik.tugasDikumpulkan, caption: "Submission siswa" },
                  ]}
                />

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={PANEL}>
                    <h2 className="text-base font-semibold">Kuis dan Ujian</h2>
                    <div className="mt-5 space-y-4">
                      {(() => {
                        const max = Math.max(dashboardData.statistik.kuis, dashboardData.statistik.ujian, 1);
                        return (
                          <>
                            <BarRow label="Kuis" value={dashboardData.statistik.kuis} max={max} color="var(--chart-1)" />
                            <BarRow label="Ujian Online" value={dashboardData.statistik.ujian} max={max} color="var(--chart-2)" />
                          </>
                        );
                      })()}
                    </div>
                  </section>
                  <section className={PANEL}>
                    <h2 className="text-base font-semibold">Tugas Dibuat vs Dikumpulkan</h2>
                    <div className="mt-5 space-y-4">
                      {(() => {
                        const max = Math.max(dashboardData.statistik.tugasDibuat, dashboardData.statistik.tugasDikumpulkan, 1);
                        return (
                          <>
                            <BarRow label="Tugas dibuat" value={dashboardData.statistik.tugasDibuat} max={max} color="var(--chart-1)" />
                            <BarRow label="Dikumpulkan siswa" value={dashboardData.statistik.tugasDikumpulkan} max={max} color="var(--chart-2)" />
                          </>
                        );
                      })()}
                    </div>
                  </section>
                </div>

                <StatGrid
                  items={[
                    { label: "User aktif 14 hari", value: dashboardData.aktivitas.userAktif, caption: "User dengan aktivitas nyata" },
                    { label: "Siswa aktif", value: dashboardData.aktivitas.siswaAktif, caption: "Mengerjakan atau mengumpulkan" },
                    { label: "Guru aktif", value: dashboardData.aktivitas.guruAktif, caption: "Membuat asesmen atau tugas" },
                    { label: "Total user", value: dashboardData.statistik.siswa + dashboardData.statistik.guru, caption: "Siswa dan guru terdaftar" },
                  ]}
                />

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={PANEL}>
                    <h2 className="text-base font-semibold">Grafik Linear User Aktif</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Jumlah user yang melakukan aktivitas nyata setiap hari.</p>
                    <ActiveUsersLineChart items={dashboardData.aktivitas.aktivitasHarian} />
                  </section>
                  <section className={PANEL}>
                    <h2 className="text-base font-semibold">Grafik Batang Distribusi Data</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Perbandingan data utama yang tersimpan di sistem.</p>
                    <div className="mt-5 space-y-3">
                      {(() => {
                        const s = dashboardData.statistik;
                        const max = Math.max(s.siswa, s.guru, s.kelas, s.asesmen, s.tugas, 1);
                        return (
                          [["Siswa", s.siswa], ["Guru", s.guru], ["Kelas", s.kelas], ["Asesmen", s.asesmen], ["Tugas", s.tugas]] as [string, number][]
                        ).map(([label, value]) => (
                          <BarRow key={label} label={label} value={value} max={max} color="var(--chart-1)" />
                        ));
                      })()}
                    </div>
                  </section>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={PANEL}>
                    <h2 className="text-base font-semibold">Rincian Data Sistem</h2>
                    <div className="mt-4 divide-y divide-[var(--border)]">
                      {[
                        ["Mata pelajaran", dashboardData.statistik.mapel, "Mapel tersedia"],
                        ["Kuis", dashboardData.statistik.kuis, "Asesmen tipe kuis"],
                        ["Ujian online", dashboardData.statistik.ujian, "Asesmen tipe ujian"],
                        ["Submission dinilai", dashboardData.statistik.submissionDinilai, "Memiliki nilai akhir"],
                        ["Tugas dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Status submission sudah"],
                      ].map(([label, value, detail]) => (
                        <div key={label as string} className="flex items-center justify-between gap-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-[var(--muted)]">{detail}</p>
                          </div>
                          <strong className="text-base font-semibold tabular-nums">{value}</strong>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className={PANEL}>
                    <h2 className="text-base font-semibold">Definisi User Aktif</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      User aktif bukan dihitung dari login karena sistem belum menyimpan log login. Angka ini menghitung siswa yang mengerjakan asesmen atau mengumpulkan tugas, serta guru yang membuat asesmen atau tugas dalam 14 hari terakhir.
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
                      <div className="flex gap-2">
                        <dt className="font-medium">Periode:</dt>
                        <dd className="text-[var(--muted)]">14 hari terakhir</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-medium">Sumber:</dt>
                        <dd className="text-[var(--muted)]">asesmen, tugas, submission asesmen, dan submission tugas</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </div>
            )}

            {!loading && activeTab === "KELAS" && (
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <PageTitle title="Kelas" />
                  <Btn onClick={openBuatKelas}>Buat Kelas</Btn>
                </div>

                {kelasList.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Belum ada kelas dibuat.</p>
                ) : (
                  <section className={`${PANEL} py-2`}>
                    {kelasList.map((k) => (
                      <KelasCard
                        key={k.id}
                        data={k}
                        isEditable
                        variant="list"
                        basePath="/admin/kelas"
                        onEdit={openEditKelas}
                        onDelete={() => setDeletingKelas(k)}
                      />
                    ))}
                  </section>
                )}
              </div>
            )}

            {!loading && activeTab === "AKUN" && akunRole === "SISWA" && (
              <section className={PANEL}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-semibold">Daftar Akun</h2>
                    <RoleSwitch role={akunRole} onChange={setAkunRole} />
                  </div>
                  <Btn size="sm" onClick={() => openBuatAkun("SISWA")}>+ Buat Akun</Btn>
                </div>

                <div className="mb-5 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-3 md:grid-cols-[minmax(150px,0.8fr)_minmax(120px,0.6fr)_minmax(180px,1fr)_minmax(220px,1.4fr)_auto] md:items-end">
                  <label className={LABEL}>
                    Jurusan
                    <select value={jurusanFilter} onChange={(event) => { setJurusanFilter(event.target.value); setRombelFilter(""); }} className={INPUT}>
                      <option value="">Semua Jurusan</option>
                      {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
                    </select>
                  </label>
                  <label className={LABEL}>
                    Kelas
                    <select value={kelasFilter} onChange={(event) => { setKelasFilter(event.target.value); setRombelFilter(""); }} className={INPUT}>
                      <option value="">Semua Kelas</option>
                      {kelasOptions.map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                    </select>
                  </label>
                  <label className={LABEL}>
                    Rombel
                    <select value={rombelFilter} onChange={(event) => setRombelFilter(event.target.value)} className={INPUT}>
                      <option value="">Semua Rombel</option>
                      {rombelOptions.map((rombel) => <option key={rombel.id} value={rombel.id}>{rombel.label}</option>)}
                    </select>
                  </label>
                  <label className={LABEL}>
                    Search
                    <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder="Nama, email, atau NIS..." className={INPUT} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setJurusanFilter(""); setKelasFilter(""); setRombelFilter(""); setSiswaSearch(""); setBulkKelasId(""); }}
                    className="h-10 cursor-pointer rounded-md px-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--fg)]"
                  >
                    Reset
                  </button>
                </div>

                {hasSiswaFilter && filteredSiswaList.length > 0 && (
                  <div className="mb-5 grid gap-3 rounded-md border border-[var(--border-strong)] p-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto] md:items-end">
                    <div>
                      <p className="text-sm font-medium">Kirim hasil filter ke kelas</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{filteredSiswaList.length} siswa cocok. Anggota yang sudah ada akan dilewati.</p>
                    </div>
                    <label className={LABEL}>
                      Kelas tujuan
                      <select value={bulkKelasId} onChange={(event) => setBulkKelasId(event.target.value)} className={INPUT}>
                        <option value="">Pilih kelas tujuan</option>
                        {kelasList.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>)}
                      </select>
                    </label>
                    <Btn size="md" loading={bulkSending} disabled={!bulkKelasId} onClick={() => void handleKirimHasilFilter()}>
                      Kirim ke Kelas
                    </Btn>
                  </div>
                )}

                {filteredSiswaList.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">{siswaList.length === 0 ? "Belum ada siswa terdaftar." : "Tidak ada siswa yang cocok dengan filter."}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                        <tr>
                          <th className={TH}>No</th>
                          <th className={TH}>Profil</th>
                          <th className={TH}>Nama</th>
                          <th className={TH}>Email</th>
                          <th className={TH}>NIS</th>
                          <th className={TH}>Status Siswa</th>
                          <th className={TH}>Kelas/Rombel</th>
                          <th className={TH}>Jurusan</th>
                          <th className="pb-3 text-right font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredSiswaList.map((s, index) => (
                          <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[var(--tint)]">
                            <td className={`${TD} text-xs tabular-nums text-[var(--muted)]`}>{index + 1}</td>
                            <td className={TD}><Avatar src={s.fotoProfil} nama={s.nama} /></td>
                            <td className={`${TD} font-medium`}>{s.nama}</td>
                            <td className={`${TD} text-xs text-[var(--muted)]`}>{s.email}</td>
                            <td className={`${TD} text-xs tabular-nums text-[var(--muted)]`}>{s.nis ?? "-"}</td>
                            <td className={TD}><Pill>Aktif</Pill></td>
                            <td
                              className={`${TD} text-xs text-[var(--muted)]`}
                              title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || "Belum ada kelas"}
                            >
                              {s.kelasSiswa?.length ?? 0} Kelas
                            </td>
                            <td className={`${TD} text-xs text-[var(--muted)]`}>{s.kelasReferensi?.label ?? "-"}</td>
                            <RowMenu
                              open={openAkunMenuId === s.id}
                              onToggle={() => toggleAkunMenu(s.id)}
                              onEdit={() => { setOpenAkunMenuId(null); openEditAkun(s); }}
                              onDelete={() => { setOpenAkunMenuId(null); void handleDeleteAkun(s.id); }}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {!loading && activeTab === "AKUN" && isAkunRole("GURU") && (
              <section className={PANEL}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-semibold">Daftar Akun</h2>
                    <RoleSwitch role={akunRole} onChange={setAkunRole} />
                  </div>
                  <Btn size="sm" onClick={() => openBuatAkun("GURU")}>+ Tambah Guru</Btn>
                </div>

                <div className="mb-5 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                  <label className={LABEL}>
                    Mapel
                    <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className={INPUT}>
                      <option value="">Semua Mapel</option>
                      {mapelOptions.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
                    </select>
                  </label>
                  <label className={LABEL}>
                    Search
                    <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder="Nama, email, atau NIK..." className={INPUT} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMapelFilter(""); setGuruSearch(""); }}
                    className="h-10 cursor-pointer rounded-md px-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--fg)]"
                  >
                    Reset
                  </button>
                </div>

                {filteredGuruList.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Belum ada guru terdaftar.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                        <tr>
                          <th className={TH}>No</th>
                          <th className={TH}>Profil</th>
                          <th className={TH}>Nama</th>
                          <th className={TH}>Email</th>
                          <th className={TH}>NIK</th>
                          <th className={TH}>Status Guru</th>
                          <th className={TH}>Mapel</th>
                          <th className="pb-3 text-right font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredGuruList.map((g, index) => (
                          <tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-[var(--tint)]">
                            <td className={`${TD} text-xs tabular-nums text-[var(--muted)]`}>{index + 1}</td>
                            <td className={TD}><Avatar src={g.fotoProfil} nama={g.nama} /></td>
                            <td className={`${TD} font-medium`}>{g.nama}</td>
                            <td className={`${TD} text-xs text-[var(--muted)]`}>{g.email}</td>
                            <td className={`${TD} text-xs tabular-nums text-[var(--muted)]`}>{g.nik ?? "-"}</td>
                            <td className={TD}><Pill>Aktif</Pill></td>
                            <td className={`${TD} text-xs text-[var(--muted)]`}>
                              {Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || "Belum ada mapel"}
                            </td>
                            <RowMenu
                              open={openAkunMenuId === g.id}
                              onToggle={() => toggleAkunMenu(g.id)}
                              onEdit={() => { setOpenAkunMenuId(null); openEditAkun(g); }}
                              onDelete={() => { setOpenAkunMenuId(null); void handleDeleteAkun(g.id); }}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {!loading && activeTab === "LAPORAN" && (
              <div className="space-y-3">
                {laporanList.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Tidak ada laporan lupa password saat ini.</p>
                ) : (
                  laporanList.map((l) => <LaporanCard key={l.id} data={l} onUpdated={() => loadTabData("LAPORAN")} />)
                )}
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

      <ModalKelas
        open={showModalKelas}
        onClose={() => setShowModalKelas(false)}
        onSuccess={() => loadTabData("KELAS")}
        mode={editingKelas ? "edit" : "create"}
        initialData={editingKelas}
      />

      <Modal
        open={Boolean(deletingKelas)}
        onClose={() => setDeletingKelas(null)}
        title="Hapus Kelas"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="rounded-md border border-[var(--border-strong)] bg-[var(--tint)] p-4">
            <p className="text-sm font-semibold text-[var(--danger)]">Hapus kelas {deletingKelas?.judul}?</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Data hubungan siswa dan guru dengan kelas ini akan ikut terlepas. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setDeletingKelas(null)}>
              Batal
            </Btn>
            <Btn variant="danger" onClick={() => void handleDeleteKelas()}>
              Hapus Kelas
            </Btn>
          </div>
        </div>
      </Modal>

      <ModalAkun
        open={showModalAkun}
        onClose={() => setShowModalAkun(false)}
        onSuccess={() => loadTabData("AKUN")}
        mode={akunMode}
        defaultRole={akunDefaultRole}
        initialData={editingAkun}
      />
    </div>
  );
}

type ActivityDay = AdminDashboardData["aktivitas"]["aktivitasHarian"][number];

function ActiveUsersLineChart({ items }: { items: ActivityDay[] }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[var(--muted)]">Data user aktif belum tersedia.</p>;
  }

  const width = 640;
  const height = 250;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = Math.max(Math.ceil(Math.max(...items.map((item) => item.userAktif), 0) / 100) * 100, 1000);
  const xFor = (index: number) => left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth);
  const yFor = (value: number) => top + chartHeight - (value / maximum) * chartHeight;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.userAktif)}`).join(" ");
  const gridValues = [0, 250, 500, 750, 1000].filter((value) => value <= maximum);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px]" role="img" aria-label="Jumlah user aktif per hari">
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} style={{ stroke: "var(--border)" }} strokeDasharray="4 4" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--muted)" }}>{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" style={{ stroke: "var(--chart-1)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={item.tanggal}>
            <circle cx={xFor(index)} cy={yFor(item.userAktif)} r="4" style={{ fill: "var(--surface)", stroke: "var(--chart-1)" }} strokeWidth="2">
              <title>{`${item.tanggal}: ${item.userAktif} user aktif`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" style={{ fill: "var(--muted)" }}>{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}