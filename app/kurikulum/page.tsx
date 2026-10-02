// app/kurikulum/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { AkunData } from "@/components/AkunCard";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KurikulumShell from "@/components/KurikulumShell";
import { STYLES } from "@/app/guru/_ui";

type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";
type KurikulumAsesmen = AsesmenData & { guru: { id: string; nama: string } };

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

function KurikulumDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [akunRole, setAkunRole] = useState<"SISWA" | "GURU">("SISWA");
  const [asesmenList, setAsesmenList] = useState<KurikulumAsesmen[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (tab && ["DASHBOARD", "KELAS", "AKUN", "ASESMEN", "PERFORMA"].includes(tab)) {
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
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  function openTab(tab: Tab) {
    setActiveTab(tab);
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
    const group = groups.get(asesmen.guru.id) ?? { guru: asesmen.guru, asesmen: [] as KurikulumAsesmen[] };
    group.asesmen.push(asesmen);
    groups.set(asesmen.guru.id, group);
    return groups;
  }, new Map<string, { guru: KurikulumAsesmen["guru"]; asesmen: KurikulumAsesmen[] }>()).values());

  return (
    <KurikulumShell activeTab={activeTab === "AKUN" ? akunRole : activeTab}>
        <div className="min-w-0">
          {loading && <p role="status" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">Memuat data...</p>}

          {!loading && activeTab === "DASHBOARD" && dashboardData && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">Dashboard Kurikulum</p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--fg)]">Selamat datang, {me?.nama ?? "Kurikulum"}</h1>
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
                    <h2 className="text-sm font-semibold text-[var(--fg)]">Akun Terbaru</h2>
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
                        <span className="text-right">
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
                  <h2 className="text-sm font-semibold text-[var(--fg)]">Kuis dan Ujian</h2>
                  <div className="mt-5 space-y-4">
                    {[ ["Kuis", dashboardData.statistik.kuis, "var(--chart-1)"], ["Ujian Online", dashboardData.statistik.ujian, "var(--chart-2)"]].map(([label, value, color]) => {
                      const max = Math.max(dashboardData.statistik.kuis, dashboardData.statistik.ujian, 1);
                      return (
                        <div key={label as string}>
                          <div className="mb-1 flex justify-between text-xs font-medium text-[var(--muted)]"><span>{label}</span><span>{value}</span></div>
                          <div className="h-2 rounded-full bg-[var(--tint)]"><div className="h-2 rounded-full" style={{ width: `${((value as number) / max) * 100}%`, background: color as string }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-semibold text-[var(--fg)]">Tugas Dibuat vs Dikumpulkan</h2>
                  <div className="mt-5 space-y-4">
                      {[ ["Tugas dibuat", dashboardData.statistik.tugasDibuat, "var(--chart-1)"], ["Dikumpulkan siswa", dashboardData.statistik.tugasDikumpulkan, "var(--chart-2)"]].map(([label, value, color]) => {
                      const max = Math.max(dashboardData.statistik.tugasDibuat, dashboardData.statistik.tugasDikumpulkan, 1);
                      return (
                        <div key={label as string}>
                          <div className="mb-1 flex justify-between text-xs font-medium text-[var(--muted)]"><span>{label}</span><span>{value}</span></div>
                          <div className="h-2 rounded-full bg-[var(--tint)]"><div className="h-2 rounded-full" style={{ width: `${Math.min(((value as number) / max) * 100, 100)}%`, background: color as string }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-semibold text-[var(--fg)]">Grafik Linear Tren Rata-rata Nilai Akademik Sekolah</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Perubahan rata-rata nilai seluruh siswa berdasarkan periode asesmen.</p>
                  <AcademicTrendChart items={dashboardData.akademik.trendNilai} />
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-semibold text-[var(--fg)]">Grafik Batang Rata-rata Nilai per Kelas</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Perbandingan capaian akademik rata-rata setiap kelas.</p>
                  <AcademicBarChart items={dashboardData.akademik.rataRataPerKelas} label="kelas" color="var(--chart-1)" />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-semibold text-[var(--fg)]">Grafik Batang Rata-rata Nilai per Mata Pelajaran</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Perbandingan rata-rata nilai untuk setiap mata pelajaran.</p>
                  <AcademicBarChart items={dashboardData.akademik.rataRataPerMapel} label="mata pelajaran" color="var(--chart-2)" />
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <h2 className="text-sm font-semibold text-[var(--fg)]">Grafik Progress Aktivitas Pembelajaran</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Status penyelesaian asesmen dan tugas di seluruh sekolah.</p>
                  <LearningProgressChart items={[
                    ["Asesmen sudah dikerjakan", dashboardData.aktivitasPembelajaran.asesmenSelesai, "var(--chart-1)"],
                    ["Asesmen belum dikerjakan", dashboardData.aktivitasPembelajaran.asesmenBelum, "var(--border-strong)"],
                    ["Tugas dikumpulkan", dashboardData.aktivitasPembelajaran.tugasDikumpulkan, "var(--chart-2)"],
                    ["Tugas belum dikumpulkan", dashboardData.aktivitasPembelajaran.tugasBelum, "var(--border-strong)"],
                  ]} />
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === "KELAS" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold text-[var(--fg)]">Kelas Sekolah</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Lihat daftar kelas dan aktivitas pembelajaran.</p>
              </div>
              {kelasList.length === 0 ? (
                <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Belum ada kelas dibuat.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kelasList.map((k) => (
                    <KelasCard key={k.id} data={k} isEditable={false} basePath="/kurikulum/kelas" />
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && akunRole === "SISWA" && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[var(--fg)]">Daftar Siswa</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Lihat data siswa dan kelasnya (akses lihat saja).</p>
              </div>
              <div className="mb-4 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-3 md:grid-cols-[180px_220px_minmax(220px,1fr)_auto] md:items-end">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Jurusan
                  <select value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]">
                    <option value="">Semua Jurusan</option>
                    {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Kelas
                  <select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]">
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Search
                  <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder="Nama, email, atau NIS..." className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]" />
                </label>
                <button type="button" onClick={() => { setJurusanFilter(""); setKelasFilter(""); setSiswaSearch(""); }} className="min-h-10 cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]">Reset</button>
              </div>
              {filteredSiswaList.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada siswa terdaftar.</p>
              ) : (
                <div className="overflow-x-auto">
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
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[var(--fg)]">Daftar Guru</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Lihat data guru dan mapel yang diampu (akses lihat saja).</p>
              </div>
              <div className="mb-4 grid gap-3 rounded-md border border-[var(--border)] bg-[var(--tint)] p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Mapel
                  <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none focus:border-[var(--brand)]">
                    <option value="">Semua Mapel</option>
                    {mapelOptions.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Search
                  <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder="Nama, email, atau NIK..." className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]" />
                </label>
                <button type="button" onClick={() => { setMapelFilter(""); setGuruSearch(""); }} className="min-h-10 cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]">Reset</button>
              </div>
              {filteredGuruList.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada guru terdaftar.</p>
              ) : (
                <div className="overflow-x-auto">
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
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--tint)] text-sm font-semibold text-[var(--link)]">{guru.nama.charAt(0)}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[var(--fg)]">{guru.nama}</span>
                            <span className="block text-xs text-[var(--muted)]">{asesmen.length} asesmen</span>
                          </span>
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 flex-shrink-0 text-[var(--muted)] transition-transform ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      {expanded && (
                        <div className="border-t border-[var(--border)] p-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {asesmen.map((item) => <AsesmenCard key={item.id} data={item} basePath="/kurikulum/asesmen" />)}
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
    </KurikulumShell>
  );
}

export default function KurikulumDashboard() {
  return (
    <Suspense fallback={<div className="lp flex min-h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--muted)]"><style>{STYLES}</style>Memuat dashboard...</div>}>
      <KurikulumDashboardContent />
    </Suspense>
  );
}

type AcademicTrend = AdminDashboardData["akademik"]["trendNilai"][number];
type AcademicAverage = AdminDashboardData["akademik"]["rataRataPerKelas"][number];

function AcademicTrendChart({ items }: { items: AcademicTrend[] }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[var(--muted)]">Data tren nilai belum tersedia.</p>;
  }
  const width = 640, height = 250, left = 48, right = 16, top = 16, bottom = 42;
  const chartWidth = width - left - right, chartHeight = height - top - bottom, maximum = 100;
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
            <circle cx={xFor(index)} cy={yFor(item.nilai ?? 0)} r="4" style={{ fill: "var(--surface)", stroke: "var(--chart-1)" }} strokeWidth="3"><title>{`${item.tanggal}: ${item.nilai ?? 0} (${item.judul})`}</title></circle>
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
            <div className="mb-1 flex justify-between gap-3 text-xs font-medium text-[var(--muted)]"><span className="truncate">{item.label}</span><span>{value}</span></div>
            <div className="h-2 rounded-full bg-[var(--tint)]"><div className="h-2 rounded-full" style={{ width: `${Math.min((value / maximum) * 100, 100)}%`, background: color }} /></div>
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
          <div className="mb-1 flex justify-between gap-3 text-xs font-medium text-[var(--muted)]"><span>{label}</span><span>{value}</span></div>
          <div className="h-2 rounded-full bg-[var(--tint)]"><div className="h-2 rounded-full" style={{ width: `${(value / maximum) * 100}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}