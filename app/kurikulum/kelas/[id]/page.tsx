"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import ClassFeedFilter, { filterClassFeed, type ClassFeedType } from "@/components/ClassFeedFilter";

const BRAND = "#658864";
type KurikulumTab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";

function TabIcon({ tab }: { tab: KurikulumTab }) {
  const paths: Record<KurikulumTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">{paths[tab]}</svg>;
}

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null };
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
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

const TABS: { key: KurikulumTab; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum" },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS" },
  { key: "AKUN", label: "Daftar Akun", href: "/kurikulum?tab=AKUN" },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA" },
];

export default function KurikulumKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [feedFilter, setFeedFilter] = useState<ClassFeedType>("ALL");
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  async function loadKelas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat kelas.");
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FAF6EE]"><p className="text-sm text-[#9CA3AF]">Memuat...</p></div>;
  }
  if (error || !kelas) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAF6EE]">
        <p className="text-sm text-[#9CA3AF]">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/kurikulum")}>Kembali</Button>
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

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6EE]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#FAF6EE]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Studify</span>
          </div>
          <div className="flex items-center gap-3">
            {me && <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-[#111827]">{me.nama}</p><p className="text-xs text-[#9CA3AF]">{me.role}</p></div>}
            <div className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280] sm:flex">
              {me?.fotoProfil ? <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" /> : me?.nama?.charAt(0) ?? "K"}
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push("/kurikulum")}>Back</Button>
          </div>
        </div>
      </header>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[#FAF6EE] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="min-h-full border-r border-black/5 bg-[#FAF6EE] p-4 shadow-sm">
          <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#111827]">Dashboard Kurikulum<br /><span style={{ color: BRAND }}>- Kelas</span></p>
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <Link key={tab.key} href={tab.href} onClick={() => setSidebarOpen(false)} className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors" style={tab.key === "KELAS" ? { background: `${BRAND}1A`, color: BRAND } : { color: "#374151" }}>
                <TabIcon tab={tab.key} />
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <section className="border-b border-[#D8DEE6] pb-5">
          <p className="text-xs font-semibold uppercase text-[#64748B]">Ringkasan kelas</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-[#17231A]">{kelas.judul}</h1>
          {kelas.deskripsi && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-[#475569]">{kelas.deskripsi}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
            <Button className="w-full justify-center whitespace-normal text-center sm:w-auto" size="sm" variant={section === "SISWA" ? "primary" : "outline"} onClick={() => setSection(section === "SISWA" ? null : "SISWA")}>Siswa ({kelas.siswa.length})</Button>
            <Button className="w-full justify-center whitespace-normal text-center sm:w-auto" size="sm" variant={section === "GURU" ? "primary" : "outline"} onClick={() => setSection(section === "GURU" ? null : "GURU")}>Guru ({kelas.guruMapel.length})</Button>
          </div>
        </section>

        {section === "SISWA" && (
          <div className="mt-4 space-y-3">
            {Object.keys(siswaGrouped).length === 0 ? <p className="text-sm text-[#9CA3AF]">Belum ada siswa di kelas ini.</p> : Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden border border-[#D8DEE6] bg-white">
                  <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2"><p className="text-sm font-bold text-[#111827]">{label}</p><Badge tone="brand">{list.length} Siswa</Badge></div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-black/5 p-4">
                      {list.map((ks) => (
                        <button key={ks.siswaId} onClick={() => router.push(`/profil/${ks.siswa.id}`)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black/5 p-3 text-left hover:bg-black/5">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                            {ks.siswa.fotoProfil ? <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" /> : ks.siswa.nama.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#111827]">{ks.siswa.nama}</p><p className="text-xs text-[#9CA3AF]">NIS: {ks.siswa.nis}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {section === "GURU" && (
          <div className="mt-4">
            {Object.keys(guruGrouped).length === 0 ? <p className="text-sm text-[#9CA3AF]">Belum ada guru mengajar di kelas ini.</p> : Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{mapel}</p>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <button key={gm.id} onClick={() => router.push(`/profil/${gm.guru.id}`)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black/5 bg-[#FAF6EE] p-3 text-left shadow-sm hover:bg-black/5">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                        {gm.guru.fotoProfil ? <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" /> : gm.guru.nama.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-[#111827]">{gm.guru.nama}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {section === null && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[#111827]">Aktivitas Kelas</p>
            <ClassFeedFilter value={feedFilter} onChange={setFeedFilter} />
            <div className="mt-4 space-y-3">
              {kelas.feed.length === 0 ? <p className="text-sm text-[#9CA3AF]">Belum ada aktivitas di kelas ini.</p> : visibleFeed.length === 0 ? <p className="border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">Tidak ada aktivitas dengan filter ini.</p> : visibleFeed.map((item, i) => {
                if (item.tipe === "PENGUMUMAN") return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                if (item.tipe === "MATERI") return <MateriCard key={`m-${i}`} data={item.data} />;
                if (item.tipe === "TUGAS") return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="KURIKULUM" />;
                const a = item.data;
                return (
                  <button
                    key={`a-${i}`}
                    onClick={() => router.push(`/kurikulum/asesmen/${a.id}`)}
                    className="block w-full cursor-pointer rounded-2xl border border-black/5 bg-[#FAF6EE] p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                      {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#111827]">{a.judul}</p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">{a._count?.soal ?? 0} soal · oleh {a.guru?.nama} — lihat ujian & jawaban siswa</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="py-10 text-center text-white" style={{ background: BRAND }}>
        <div className="mx-auto max-w-7xl px-6">
          <div>
            <p className="text-lg font-bold">Studify</p>
          </div>
        </div>
        <p className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-white/80">© 2026 Studify. All Rights Reserved.</p>
      </footer>
    </div>
  );
}