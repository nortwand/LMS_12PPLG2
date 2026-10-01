"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import PengumumanCard, { PengumumanData } from "@/components/PengumumanCard";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalPengumuman from "@/components/ModalPengumuman";
import Modal from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import ModalKirimAsesmen from "@/components/ModalKirimAsesmen";
import ModalKirimPengumuman from "@/components/ModalKirimPengumuman";
import ModalMateri from "@/components/Modalmateri";
import MateriCard, { MateriData } from "@/components/MateriCard";
import ClassFeedFilter, { filterClassFeed, type ClassFeedType } from "@/components/ClassFeedFilter";
import type { AsesmenData } from "@/components/Asesmencard";
import { showAlert, showConfirm } from "@/lib/dialog";
import { Btn, PANEL } from "@/app/guru/_ui";

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
  inviteToken: string;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

export default function GuruKelasDetailPage() {
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
  const [copied, setCopied] = useState(false);

  const [showModalPengumuman, setShowModalPengumuman] = useState(false);
  const [contentType, setContentType] = useState<"PENGUMUMAN" | "MATERI" | null>(null);
  const [editingPengumuman, setEditingPengumuman] = useState<PengumumanData | null>(null);
  const [showModalAsesmen, setShowModalAsesmen] = useState(false);
  const [asesmenFixedTipe, setAsesmenFixedTipe] = useState<"KUIS" | "UJIAN">("KUIS");
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [showModalTugas, setShowModalTugas] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [showModalMateri, setShowModalMateri] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingPengumuman, setSendingPengumuman] = useState<PengumumanData | null>(null);
  const [openAsesmenOptionsId, setOpenAsesmenOptionsId] = useState<string | null>(null);

  useEffect(() => {
    if (!openAsesmenOptionsId) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setOpenAsesmenOptionsId(null);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openAsesmenOptionsId]);

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

  function handleCopyInvite() {
    if (!kelas) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${kelas.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openBuatQuiz() {
    setAsesmenFixedTipe("KUIS");
    setShowModalAsesmen(true);
  }
  function openBuatUjian() {
    setAsesmenFixedTipe("UJIAN");
    setShowModalAsesmen(true);
  }
  function handleAsesmenSuccess(asesmenId: string) {
    router.push(`/guru/asesmen/${asesmenId}`);
  }
  async function handleDeleteAsesmen(id: string) {
    if (!(await showConfirm("Hapus asesmen ini? Data soal dan pengumpulan juga akan dihapus."))) return;
    const res = await fetch(`/api/asesmen/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Asesmen gagal dihapus.");
      return;
    }
    loadKelas();
  }

  function openBuatTugas() {
    setEditingTugas(null);
    setShowModalTugas(true);
  }
  function openEditTugas(tugas: TugasData) {
    setEditingTugas(tugas);
    setShowModalTugas(true);
  }
  async function handleDeleteTugas(id: string) {
    if (!(await showConfirm("Hapus tugas ini?"))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadKelas();
  }

  function openEditMateri(materi: MateriData) {
    setEditingMateri(materi);
    setShowModalMateri(true);
  }

  async function handleDeleteMateri(id: string) {
    if (!(await showConfirm("Hapus materi ini?"))) return;
    const res = await fetch(`/api/materi/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Materi gagal dihapus.");
      return;
    }
    loadKelas();
  }

  function handleEditPengumuman(data: PengumumanData) {
    setShowModalPengumuman(false);
    setContentType(null);
    setEditingPengumuman(data);
  }
  async function handleDeletePengumuman(id: string) {
    if (!(await showConfirm("Hapus pengumuman ini?"))) return;
    await fetch(`/api/pengumuman/${id}`, { method: "DELETE" });
    loadKelas();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Memuat...</p>;

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[var(--muted)]">{error || "Kelas tidak ditemukan."}</p>
        <Btn variant="outline" onClick={() => router.push("/guru/kelas")}>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--muted)]">Ringkasan kelas</p>
            <h1 className="mt-1 break-words text-xl font-semibold tracking-tight">{kelas.judul}</h1>
            {kelas.deskripsi && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-[var(--muted)]">{kelas.deskripsi}</p>}
          </div>
          <div className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:w-auto sm:min-w-56">
            <p className="text-xs font-medium text-[var(--muted)]">Kode kelas</p>
            <p className="mt-1 break-all text-sm font-semibold tabular-nums">{kelas.inviteToken}</p>
            <button onClick={handleCopyInvite} className="mt-2 text-sm font-medium text-[var(--link)] hover:underline">
              {copied ? "Tersalin" : "Salin link undangan"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
          <Btn className="w-full justify-center whitespace-normal text-center sm:w-auto" size="sm" variant={section === "SISWA" ? "primary" : "outline"} onClick={() => setSection(section === "SISWA" ? null : "SISWA")}>
            Siswa ({kelas.siswa.length})
          </Btn>
          <Btn className="w-full justify-center whitespace-normal text-center sm:w-auto" size="sm" variant={section === "GURU" ? "primary" : "outline"} onClick={() => setSection(section === "GURU" ? null : "GURU")}>
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
                  <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex min-h-12 w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-[var(--tint)]">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-[var(--border)] p-4">
                      {list.map((ks) => (
                        <button
                          key={ks.siswaId}
                          type="button"
                          onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-[var(--border)] p-3 text-left transition-colors hover:bg-[var(--tint)]"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--tint)] text-xs font-semibold text-[var(--muted)]">
                            {ks.siswa.fotoProfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                            ) : (
                              ks.siswa.nama.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ks.siswa.nama}</p>
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
            <p className="text-sm text-[var(--muted)]">Belum ada guru lain di kelas ini.</p>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-medium text-[var(--muted)]">{mapel}</p>
                <div className={`${PANEL} divide-y divide-[var(--border)] overflow-hidden p-0`}>
                  {list.map((gm) => (
                    <div key={gm.id} className="flex items-center gap-3 p-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--tint)] text-xs font-semibold text-[var(--muted)]">
                        {gm.guru.fotoProfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                        ) : (
                          gm.guru.nama.charAt(0)
                        )}
                      </div>
                      <p className="text-sm font-medium">{gm.guru.nama}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Btn size="sm" onClick={() => { setContentType(null); setShowModalPengumuman(true); }}>Buat Konten</Btn>
            <Btn size="sm" variant="outline" onClick={openBuatQuiz}>Buat Kuis</Btn>
            <Btn size="sm" variant="outline" onClick={openBuatUjian}>Buat Ujian Online</Btn>
            <Btn size="sm" variant="outline" onClick={openBuatTugas}>Buat Tugas</Btn>
          </div>

          <ClassFeedFilter value={feedFilter} onChange={setFeedFilter} />
          <div className="mt-4 space-y-3">
        {kelas.feed.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">Belum ada aktivitas di kelas ini.</p>
        ) : visibleFeed.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--muted)]">Tidak ada aktivitas dengan filter ini.</p>
        ) : (
          visibleFeed.map((item, i) => {
            if (item.tipe === "PENGUMUMAN") {
              return (
                <PengumumanCard
                  key={`p-${i}`}
                  data={item.data}
                  currentUserId={me?.id ?? ""}
                  onEdit={handleEditPengumuman}
                  onDelete={handleDeletePengumuman}
                  onSend={setSendingPengumuman}
                />
              );
            }
            if (item.tipe === "TUGAS") {
              return (
                <TugasCard
                  key={`t-${i}`}
                  data={item.data}
                  currentUserId={me?.id ?? ""}
                  role="GURU"
                  onEdit={openEditTugas}
                  onDelete={handleDeleteTugas}
                  onSend={setSendingTugas}
                />
              );
            }
            if (item.tipe === "MATERI") {
              return (
                <MateriCard
                  key={`m-${i}`}
                  data={item.data}
                  isEditable={me?.id === item.data.guru?.id}
                  onEdit={openEditMateri}
                  onDelete={handleDeleteMateri}
                />
              );
            }
            const a = item.data;
            return (
              <div
                key={`a-${i}`}
                onClick={() => router.push(`/guru/asesmen/${a.id}`)}
                className="block w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:bg-[var(--tint)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                    {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                  </div>
                  {me?.id === a.guru?.id && (
                    <div className="relative" data-options-menu>
                      <button
                        type="button"
                        aria-label="Opsi asesmen"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenAsesmenOptionsId((value) => value === a.id ? null : a.id);
                        }}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg font-bold text-[var(--muted)] hover:bg-[var(--tint)]"
                      >
                        ⋯
                      </button>
                      {openAsesmenOptionsId === a.id && (
                        <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 text-left shadow-lg">
                          {a.status === "PROSES" && (
                            <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); setEditingAsesmen(a as AsesmenData); }} className="block h-9 w-full cursor-pointer px-3 text-left text-xs font-medium hover:bg-[var(--tint)]">
                              Edit
                            </button>
                          )}
                          {a.status === "SELESAI" && (
                            <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); setSendingAsesmen(a); }} className="block h-9 w-full cursor-pointer px-3 text-left text-xs font-medium hover:bg-[var(--tint)]">
                              Kirim ke
                            </button>
                          )}
                          <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); void handleDeleteAsesmen(a.id); }} className="block h-9 w-full cursor-pointer px-3 text-left text-xs font-medium text-[var(--danger)] hover:bg-[var(--tint)]">
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold">{a.judul}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {a._count?.soal ?? 0} soal · oleh {a.guru?.nama}
                </p>
              </div>
            );
          })
        )}
          </div>
        </>
      )}

      <ModalPengumuman
        open={!!editingPengumuman || (showModalPengumuman && contentType === "PENGUMUMAN")}
        onClose={() => {
          setShowModalPengumuman(false);
          setEditingPengumuman(null);
          setContentType(null);
        }}
        onSuccess={loadKelas}
        mode={editingPengumuman ? "edit" : "create"}
        initialData={editingPengumuman}
        kelasId={kelasId}
      />

      <ModalBuatAsesmen
        open={showModalAsesmen}
        onClose={() => setShowModalAsesmen(false)}
        onSuccess={handleAsesmenSuccess}
        defaultKelasId={kelasId}
        fixedTipe={asesmenFixedTipe}
      />

      <ModalTugas
        open={showModalTugas}
        onClose={() => setShowModalTugas(false)}
        onSuccess={loadKelas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas as any}
        defaultKelasId={kelasId}
      />
      <ModalMateri
        open={!!editingMateri || (showModalMateri && contentType === "MATERI")}
        onClose={() => {
          setShowModalMateri(false);
          setEditingMateri(null);
          setShowModalPengumuman(false);
          setContentType(null);
        }}
        onSuccess={loadKelas}
        mode={editingMateri ? "edit" : "create"}
        initialData={editingMateri}
        defaultKelasId={kelasId}
      />

      <Modal
        open={showModalPengumuman && contentType === null}
        onClose={() => setShowModalPengumuman(false)}
        title="Buat Konten"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <Select label="Jenis Konten" placeholder="Pilih jenis konten" value="" onChange={(event) => {
            const selected = event.target.value as "PENGUMUMAN" | "MATERI";
            setContentType(selected);
            if (selected === "MATERI") setShowModalMateri(true);
          }}>
            <option value="PENGUMUMAN">Pengumuman</option>
            <option value="MATERI">Materi</option>
          </Select>
          <p className="text-xs text-[var(--muted)]">Pilih jenis konten untuk kelas ini.</p>
        </div>
      </Modal>
      <ModalEditAsesmen
        open={!!editingAsesmen}
        onClose={() => setEditingAsesmen(null)}
        onSuccess={loadKelas}
        initialData={editingAsesmen ? { ...editingAsesmen, mapelId: editingAsesmen.mapelId ?? editingAsesmen.mapel?.id ?? null } : null}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={() => {
          setSendingTugas(null);
          loadKelas();
        }}
      />
      <ModalKirimAsesmen
        open={!!sendingAsesmen}
        asesmenId={sendingAsesmen?.id ?? null}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={() => {
          setSendingAsesmen(null);
          loadKelas();
        }}
      />
      <ModalKirimPengumuman
        open={!!sendingPengumuman}
        pengumumanId={sendingPengumuman?.id ?? null}
        onClose={() => setSendingPengumuman(null)}
        onSuccess={() => {
          setSendingPengumuman(null);
          loadKelas();
        }}
      />
    </div>
  );
}