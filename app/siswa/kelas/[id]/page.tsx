// app/siswa/kelas/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import ClassFeedFilter, { filterClassFeed, type ClassFeedType } from "@/components/ClassFeedFilter";
import { Avatar, Btn, PANEL, Pill } from "@/app/guru/_ui";

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

export default function SiswaKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [error, setError] = useState("");

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [feedFilter, setFeedFilter] = useState<ClassFeedType>("ALL");
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);

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

  if (loading) return <p className="text-sm text-[var(--muted)]">Memuat...</p>;

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[var(--muted)]">{error || "Kelas tidak ditemukan."}</p>
        <Btn variant="outline" onClick={() => router.push("/siswa/kelas")}>
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

  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--border)] pb-5">
        <p className="text-xs font-medium text-[var(--muted)]">Ringkasan kelas</p>
        <h1 className="mt-1 break-words text-xl font-semibold tracking-tight">{kelas.judul}</h1>
        {kelas.deskripsi && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-[var(--muted)]">{kelas.deskripsi}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
          <Btn className="w-full justify-center whitespace-normal text-center sm:w-auto" size="sm" variant={section === "SISWA" ? "primary" : "outline"} aria-pressed={section === "SISWA"} onClick={() => setSection(section === "SISWA" ? null : "SISWA")}>
            Siswa ({kelas.siswa.length})
          </Btn>
          <Btn className="w-full justify-center whitespace-normal text-center sm:w-auto" size="sm" variant={section === "GURU" ? "primary" : "outline"} aria-pressed={section === "GURU"} onClick={() => setSection(section === "GURU" ? null : "GURU")}>
            Guru ({kelas.guruMapel.length})
          </Btn>
        </div>
      </section>

      {section === "SISWA" && (
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Belum ada siswa di kelas ini.</p>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className={`${PANEL} overflow-hidden p-0`}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex min-h-12 w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-[var(--tint)]">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                      {list.map((ks) => (
                        <button
                          key={ks.siswaId}
                          onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                          className="flex w-full cursor-pointer items-center gap-3 p-3 text-left hover:bg-[var(--tint)]"
                        >
                          <Avatar src={ks.siswa.fotoProfil} nama={ks.siswa.nama} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ks.siswa.nama}</p>
                            <p className="text-xs text-[var(--muted)]">NIS: {ks.siswa.nis}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {section === "GURU" && (
        <div className="mt-4">
          {Object.keys(guruGrouped).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Belum ada guru mengajar di kelas ini.</p>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-medium text-[var(--muted)]">{mapel}</p>
                <div className={`${PANEL} divide-y divide-[var(--border)] overflow-hidden p-0`}>
                  {list.map((gm) => (
                    <button
                      key={gm.id}
                      onClick={() => router.push(`/profil/${gm.guru.id}`)}
                      className="flex w-full cursor-pointer items-center gap-3 p-3 text-left hover:bg-[var(--tint)]"
                    >
                      <Avatar src={gm.guru.fotoProfil} nama={gm.guru.nama} />
                      <p className="text-sm font-medium">{gm.guru.nama}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold">Aktivitas Kelas</h2>
          <ClassFeedFilter value={feedFilter} onChange={setFeedFilter} themed />
          <div className="mt-4 space-y-3">
            {kelas.feed.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">Belum ada aktivitas di kelas ini.</p>
            ) : visibleFeed.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">Tidak ada aktivitas dengan filter ini.</p>
            ) : (
              visibleFeed.map((item, i) => {
                if (item.tipe === "PENGUMUMAN") {
                  // gak dikasih onEdit/onDelete -> tombol itu otomatis gak muncul buat siswa
                  return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                }
                if (item.tipe === "TUGAS") {
                  return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="SISWA" />;
                }
                if (item.tipe === "MATERI") {
                  return <MateriCard key={`m-${i}`} data={item.data} />;
                }
                // ASESMEN: murni tampilan, gak diklik dari feed -- siswa ngerjain dari tab Asesmen
                const a = item.data;
                return (
                  <div key={`a-${i}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                        {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/siswa/asesmen/${a.id}`)}
                        className="flex-shrink-0 rounded-md bg-[var(--brand)] px-3 py-2 text-xs font-medium text-[var(--on-brand)] hover:opacity-90"
                      >
                        {a.statusSubmission === "SUDAH" ? "Sudah Dikerjakan" : "Kerjakan"}
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{a.judul}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">oleh {a.guru?.nama}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}