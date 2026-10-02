"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Pill } from "@/app/guru/_ui";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import ClassFeedFilter, { filterClassFeed, type ClassFeedType } from "@/components/ClassFeedFilter";
import KurikulumShell from "@/components/KurikulumShell";

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

export default function KurikulumKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);
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

  if (loading) {
    return <KurikulumShell activeTab="KELAS"><p role="status" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">Memuat kelas...</p></KurikulumShell>;
  }
  if (error || !kelas) {
    return (
      <KurikulumShell activeTab="KELAS"><div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--fg)]">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/kurikulum")}>Kembali</Button>
      </div></KurikulumShell>
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
    <KurikulumShell activeTab="KELAS"><div className="w-full space-y-5">
        <Link href="/kurikulum?tab=KELAS" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--link)] hover:underline">&larr; Kembali ke Kelas</Link>
        <section className="border-b border-[var(--border)] pb-5">
          <p className="text-xs font-medium text-[var(--muted)]">Ringkasan kelas</p>
          <h1 className="mt-1 break-words text-xl font-semibold text-[var(--fg)]">{kelas.judul}</h1>
          {kelas.deskripsi && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-[var(--muted)]">{kelas.deskripsi}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
            <button type="button" aria-pressed={section === "SISWA"} className={`min-h-10 w-full rounded-md border px-4 text-sm font-medium transition-colors sm:w-auto ${section === "SISWA" ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]" : "border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]"}`} onClick={() => setSection(section === "SISWA" ? null : "SISWA")}>Siswa ({kelas.siswa.length})</button>
            <button type="button" aria-pressed={section === "GURU"} className={`min-h-10 w-full rounded-md border px-4 text-sm font-medium transition-colors sm:w-auto ${section === "GURU" ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]" : "border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]"}`} onClick={() => setSection(section === "GURU" ? null : "GURU")}>Guru ({kelas.guruMapel.length})</button>
          </div>
        </section>

        {section === "SISWA" && (
          <div className="mt-4 space-y-3">
            {Object.keys(siswaGrouped).length === 0 ? <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Belum ada siswa di kelas ini.</p> : Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <button type="button" aria-expanded={isOpen} onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex min-h-12 w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-[var(--tint)]">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold text-[var(--fg)]">{label}</p><Pill>{list.length} Siswa</Pill></div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                      {list.map((ks) => (
                        <button key={ks.siswaId} type="button" onClick={() => router.push(`/profil/${ks.siswa.id}`)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-[var(--tint)]">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--tint)] text-xs font-bold text-[var(--muted)]">
                            {ks.siswa.fotoProfil ? <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" /> : ks.siswa.nama.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[var(--fg)]">{ks.siswa.nama}</p><p className="text-xs text-[var(--muted)]">NIS: {ks.siswa.nis}</p></div>
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
            {Object.keys(guruGrouped).length === 0 ? <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Belum ada guru mengajar di kelas ini.</p> : Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-semibold text-[var(--muted)]">{mapel}</p>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <button key={gm.id} type="button" onClick={() => router.push(`/profil/${gm.guru.id}`)} className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:bg-[var(--tint)]">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--tint)] text-xs font-bold text-[var(--muted)]">
                        {gm.guru.fotoProfil ? <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" /> : gm.guru.nama.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-[var(--fg)]">{gm.guru.nama}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {section === null && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-[var(--fg)]">Aktivitas Kelas</h2>
            <ClassFeedFilter value={feedFilter} onChange={setFeedFilter} />
            <div className="mt-4 space-y-3">
              {kelas.feed.length === 0 ? <p className="text-sm text-[var(--muted)]">Belum ada aktivitas di kelas ini.</p> : visibleFeed.length === 0 ? <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">Tidak ada aktivitas dengan filter ini.</p> : visibleFeed.map((item, i) => {
                if (item.tipe === "PENGUMUMAN") return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                if (item.tipe === "MATERI") return <MateriCard key={`m-${i}`} data={item.data} />;
                if (item.tipe === "TUGAS") return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="KURIKULUM" />;
                const a = item.data;
                return (
                  <button
                    key={`a-${i}`}
                    onClick={() => router.push(`/kurikulum/asesmen/${a.id}`)}
                    className="block w-full cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-left hover:bg-[var(--tint)]"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                      {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[var(--fg)]">{a.judul}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{a._count?.soal ?? 0} soal · oleh {a.guru?.nama} — lihat ujian & jawaban siswa</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div></KurikulumShell>
  );
}