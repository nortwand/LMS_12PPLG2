// app/siswa/asesmen/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { showConfirm } from "@/lib/dialog";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Btn as Button, INPUT, PANEL } from "@/app/guru/_ui";

interface OpsiSoal {
  id: string;
  teks: string;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSoal[];
}
interface JawabanTersimpan {
  soalId: string;
  opsiIds: string[];
  jawabanEssay: string | null;
  raguRagu: boolean;
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  durasiMenit: number | null;
  mapel: { nama: string } | null;
  soal: Soal[];
  submissionId: string;
  submissionStatus: "BELUM" | "SUDAH";
  tabSwitchCount: number;
  mulaiPada: string;
  jawabanTersimpan: JawabanTersimpan[];
}
interface JawabanLokal {
  opsiIds: string[];
  jawabanEssay: string;
  raguRagu: boolean;
}

export default function SiswaAsesmenKerjakanPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  const [jawabanMap, setJawabanMap] = useState<Record<string, JawabanLokal>>({});

  const [sisaDetik, setSisaDetik] = useState(0);
  const [pelanggaranModal, setPelanggaranModal] = useState<{ violationCount: number; jumlahDireset: number } | null>(null);
  const keluarAsesmenRef = useRef(false);
  const mencatatPelanggaranRef = useRef(false);

  const [selesaiLoading, setSelesaiLoading] = useState(false);
  const [sudahSelesai, setSudahSelesai] = useState(false);

  useEffect(() => {
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  async function loadAsesmen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat asesmen.");
        setLoading(false);
        return;
      }
      const detail: AsesmenDetail = data.data;
      setAsesmen(detail);
      setSudahSelesai(detail.submissionStatus === "SUDAH");

      const map: Record<string, JawabanLokal> = {};
      for (const s of detail.soal) {
        const tersimpan = detail.jawabanTersimpan.find((j) => j.soalId === s.id);
        map[s.id] = {
          opsiIds: tersimpan?.opsiIds ?? [],
          jawabanEssay: tersimpan?.jawabanEssay ?? "",
          raguRagu: tersimpan?.raguRagu ?? false,
        };
      }
      setJawabanMap(map);

      if (detail.durasiMenit) {
        const deadline = new Date(detail.mulaiPada).getTime() + detail.durasiMenit * 60000;
        setSisaDetik(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  // ---- timer countdown, dihitung ulang tiap detik dari deadline server-truth ----
  useEffect(() => {
    if (!asesmen || sudahSelesai || !asesmen.durasiMenit) return;
    const deadline = new Date(asesmen.mulaiPada).getTime() + asesmen.durasiMenit * 60000;

    const interval = setInterval(() => {
      const sisa = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSisaDetik(sisa);
      if (sisa <= 0) {
        clearInterval(interval);
        handleSelesai(true);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmen, sudahSelesai]);

  // ---- anti-cheat: catat pelanggaran saat siswa kembali ke asesmen ----
  useEffect(() => {
    if (!asesmen || sudahSelesai) return;

    async function catatPelanggaran() {
      if (mencatatPelanggaranRef.current) return;
      mencatatPelanggaranRef.current = true;
      try {
        const res = await fetch(`/api/asesmen/${asesmenId}/pelanggaran`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) return;

        setPelanggaranModal({
          violationCount: data.violationCount ?? 1,
          jumlahDireset: data.jumlahDireset ?? 0,
        });
        await loadAsesmen();
      } catch {
      } finally {
        mencatatPelanggaranRef.current = false;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        keluarAsesmenRef.current = true;
      } else if (keluarAsesmenRef.current) {
        keluarAsesmenRef.current = false;
        void catatPelanggaran();
      }
    }

    function handleExitRequest() {
      void catatPelanggaran();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("assessment-exit-request", handleExitRequest);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("assessment-exit-request", handleExitRequest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmen, sudahSelesai, asesmenId]);

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const currentSoal = soalTerfilter[activeIndex] ?? null;
  const jawabanSaatIni = currentSoal ? jawabanMap[currentSoal.id] : null;
  const isKuis = asesmen?.tipe === "KUIS";

  async function simpanJawaban(soalId: string, patch: Partial<JawabanLokal>) {
    setJawabanMap((prev) => ({ ...prev, [soalId]: { ...prev[soalId], ...patch } }));
    const body: { soalId: string; opsiIds?: string[]; jawabanEssay?: string; raguRagu?: boolean } = { soalId };
    if (patch.opsiIds !== undefined) body.opsiIds = patch.opsiIds;
    if (patch.jawabanEssay !== undefined) body.jawabanEssay = patch.jawabanEssay;
    if (patch.raguRagu !== undefined) body.raguRagu = patch.raguRagu;
    await fetch(`/api/asesmen/${asesmenId}/jawab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function handlePilihOpsiPG(soalId: string, opsiId: string) {
    simpanJawaban(soalId, { opsiIds: [opsiId] });
    if (isKuis) lanjutKeSoalBerikutnya();
  }
  function handleToggleOpsiCB(soalId: string, opsiId: string) {
    const current = jawabanMap[soalId]?.opsiIds ?? [];
    const next = current.includes(opsiId) ? current.filter((id) => id !== opsiId) : [...current, opsiId];
    simpanJawaban(soalId, { opsiIds: next });
  }
  function handleEssayChange(soalId: string, teks: string) {
    setJawabanMap((prev) => ({ ...prev, [soalId]: { ...prev[soalId], jawabanEssay: teks } }));
  }
  function handleToggleRagu(soalId: string) {
    simpanJawaban(soalId, { raguRagu: !jawabanMap[soalId]?.raguRagu });
  }

  // dipake buat Checkbox & Essay di Kuis (tombol "Lanjut" eksplisit) DAN autosave Essay/Checkbox biasa di Ujian saat pindah soal
  async function handleLanjutManual() {
    if (!currentSoal) return;
    await simpanJawaban(currentSoal.id, {
      opsiIds: jawabanMap[currentSoal.id]?.opsiIds ?? [],
      jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "",
    });
    if (isKuis) lanjutKeSoalBerikutnya();
  }

  function lanjutKeSoalBerikutnya() {
    if (activeIndex >= soalTerfilter.length - 1) {
      handleSelesai(false);
    } else {
      setActiveIndex((i) => i + 1);
    }
  }

  async function handleSelesai(otomatis: boolean) {
    if (sudahSelesai) return;
    if (!otomatis) {
      if (!(await showConfirm("Selesaikan asesmen sekarang? Jawaban yang sudah tersimpan tidak bisa diubah lagi."))) return;
    }
    setSelesaiLoading(true);
    try {
      if (currentSoal && currentSoal.tipe !== "PILIHAN_GANDA") {
        await simpanJawaban(currentSoal.id, {
          opsiIds: jawabanMap[currentSoal.id]?.opsiIds ?? [],
          jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "",
        });
      }
      await fetch(`/api/asesmen/${asesmenId}/selesai`, { method: "POST" });
      setSudahSelesai(true);
    } finally {
      setSelesaiLoading(false);
    }
  }

  function formatTimer(detik: number) {
    const j = Math.floor(detik / 3600);
    const m = Math.floor((detik % 3600) / 60);
    const d = detik % 60;
    return [j, m, d].map((n) => String(n).padStart(2, "0")).join(":");
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Memuat asesmen...</p>;
  if (error || !asesmen) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[var(--muted)]">{error || "Asesmen tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/siswa/asesmen")}>
          Kembali
        </Button>
      </div>
    );
  }

  if (sudahSelesai) {
    return (
      <div className={`${PANEL} flex flex-col items-center gap-3 p-10 text-center`}>
        <Badge tone="green">Sudah Dikumpulkan</Badge>
        <p className="text-lg font-semibold">{asesmen.judul}</p>
        <p className="text-sm text-[var(--muted)]">Jawabanmu sudah tersimpan. Nilai akan diumumkan oleh guru.</p>
        <Button onClick={() => router.push("/siswa/asesmen")}>Kembali ke Asesmen</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${PANEL} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{asesmen.judul}</p>
            <Badge tone="amber">Sedang Mengerjakan {isKuis ? "Kuis" : "Ujian Online"}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-[var(--muted)]">Mapel - {asesmen.mapel?.nama ?? "-"}</p>
        </div>
        {asesmen.durasiMenit && (
          <div className={`rounded-md border px-4 py-2 text-right ${sisaDetik <= 300 ? "border-[var(--danger)] bg-[var(--tint)]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
            <p className="text-[10px] font-medium uppercase text-[var(--muted)]">Sisa Waktu</p>
            <p className={`text-lg font-semibold tabular-nums ${sisaDetik <= 300 ? "text-[var(--danger)]" : "text-[var(--fg)]"}`}>{formatTimer(sisaDetik)}</p>
            {sisaDetik <= 300 && <p className="text-[10px] font-semibold text-[var(--danger)]">Waktu hampir habis!</p>}
          </div>
        )}
      </div>

      {(
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Cari soal..."
            className={`${INPUT} min-w-[140px] flex-1`}
          />
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Soal sebelumnya" onClick={() => setActiveIndex((i) => Math.max(0, i - 1))} disabled={activeIndex === 0} className="h-9 cursor-pointer rounded-md border border-[var(--border-strong)] px-3 text-xs font-medium text-[var(--fg)] disabled:opacity-40">
              {"<<"}
            </button>
            <span className="px-2 text-xs font-medium tabular-nums text-[var(--muted)]">
              {soalTerfilter.length === 0 ? "0/0" : `${activeIndex + 1}/${soalTerfilter.length}`}
            </span>
            <button type="button" aria-label="Soal berikutnya" onClick={() => setActiveIndex((i) => Math.min(soalTerfilter.length - 1, i + 1))} disabled={activeIndex >= soalTerfilter.length - 1} className="h-9 cursor-pointer rounded-md border border-[var(--border-strong)] px-3 text-xs font-medium text-[var(--fg)] disabled:opacity-40">
              {">>"}
            </button>
            <button
              onClick={() => setShowGrid((v) => !v)}
              title={showGrid ? "Tutup daftar soal" : "Buka daftar soal"}
              aria-label={showGrid ? "Tutup daftar soal" : "Buka daftar soal"}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-colors ${showGrid ? "border-[var(--brand)] bg-[var(--tint)] text-[var(--brand)]" : "border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--tint)]"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showGrid && (
        <div className={`${PANEL} mt-2 grid grid-cols-6 gap-1.5 p-3 sm:grid-cols-10`}>
          {soalTerfilter.map((s, i) => {
            const dijawab = (jawabanMap[s.id]?.opsiIds.length ?? 0) > 0 || !!jawabanMap[s.id]?.jawabanEssay;
            const ragu = jawabanMap[s.id]?.raguRagu;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveIndex(i);
                  setShowGrid(false);
                }}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xs font-semibold ${i === activeIndex ? "bg-[var(--brand)] text-[var(--on-brand)]" : ragu ? "border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : dijawab ? "border border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className={`${PANEL} mt-4 min-h-[280px]`}>
        {!currentSoal ? (
          <p className="text-sm text-[var(--muted)]">Belum ada soal.</p>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
              {!isKuis && (
                <button
                  onClick={() => handleToggleRagu(currentSoal.id)}
                  className={`h-9 cursor-pointer rounded-md border px-3 text-xs font-medium ${jawabanSaatIni?.raguRagu ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : "border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--tint)]"}`}
                >
                  Ragu-ragu
                </button>
              )}
            </div>

            <p className="mt-3 text-sm font-semibold leading-6">
              {activeIndex + 1}. {currentSoal.pertanyaan}
            </p>

            {currentSoal.gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSoal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-xl object-contain" />
            )}

            {currentSoal.tipe === "ESSAY" ? (
              <textarea
                value={jawabanSaatIni?.jawabanEssay ?? ""}
                onChange={(e) => handleEssayChange(currentSoal.id, e.target.value)}
                onBlur={() => !isKuis && simpanJawaban(currentSoal.id, { jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "" })}
                rows={5}
                placeholder="Tulis jawabanmu di sini..."
                className="mt-4 min-h-32 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
              />
            ) : (
              <div className="mt-4 space-y-2">
                {currentSoal.opsi.map((o) => {
                  const dipilih = jawabanSaatIni?.opsiIds.includes(o.id) ?? false;
                  return (
                    <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors ${dipilih ? "border-[var(--brand)] bg-[var(--tint)]" : "border-[var(--border)] hover:bg-[var(--tint)]"}`}>
                      <input
                        type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                        checked={dipilih}
                        className="accent-[var(--brand)]"
                        onChange={() =>
                          currentSoal.tipe === "PILIHAN_GANDA"
                            ? handlePilihOpsiPG(currentSoal.id, o.id)
                            : handleToggleOpsiCB(currentSoal.id, o.id)
                        }
                      />
                      <span>{o.teks}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* tombol Lanjut eksplisit -- cuma di Kuis, cuma buat Checkbox & Essay (PG udah auto-lanjut) */}
            {isKuis && currentSoal.tipe !== "PILIHAN_GANDA" && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleLanjutManual}>Lanjut</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isKuis && (
        <div className="mt-4 flex justify-end">
          <Button loading={selesaiLoading} onClick={() => handleSelesai(false)}>
            Selesai Ujian
          </Button>
        </div>
      )}

      {isKuis && (
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Jawab soal untuk otomatis lanjut ke soal berikutnya. Kamu tidak bisa kembali ke soal sebelumnya.
        </p>
      )}

      <Modal
        open={!!pelanggaranModal}
        onClose={() => {}}
        dismissible={false}
        title="Peringatan Asesmen"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--fg)]">
            Kamu keluar dari tab atau halaman asesmen. Klik <strong>Lanjut Asesmen</strong> untuk kembali mengerjakan.
          </p>
          {pelanggaranModal && pelanggaranModal.jumlahDireset > 0 ? (
            <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100">
              Pelanggaran ke-{pelanggaranModal.violationCount}: {pelanggaranModal.jumlahDireset} jawaban pilihan ganda/checkbox direset. Jawaban essay tetap aman.
            </p>
          ) : pelanggaranModal && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
              Pelanggaran ke-{pelanggaranModal.violationCount} tercatat. Reset berikutnya terjadi pada pelanggaran ke-{pelanggaranModal.violationCount + (3 - (pelanggaranModal.violationCount % 3 || 3))}. Jawaban essay tetap aman.
            </p>
          )}
          <Button className="w-full" onClick={() => setPelanggaranModal(null)}>
            Lanjut Asesmen
          </Button>
        </div>
      </Modal>
    </div>
  );
}