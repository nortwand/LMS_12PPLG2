"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { showConfirm } from "@/lib/dialog";
import Badge from "@/components/ui/Badge";
import { Btn, PANEL } from "@/app/super-admin/_ui";

type Question = {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: { id: string; teks: string; urutan: number }[];
};

type Assessment = {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  durasiMenit: number | null;
  mapel: { nama: string } | null;
  soal: Question[];
  submissionId: string;
  submissionStatus: "BELUM" | "SUDAH";
  mulaiPada: string;
  jawabanTersimpan: {
    soalId: string;
    opsiIds: string[];
    jawabanEssay: string | null;
  }[];
};

export default function SuperAdminKerjakanAsesmenPage() {
  const params = useParams();
  const router = useRouter();
  const asesmenId = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, { opsiIds: string[]; jawabanEssay: string }>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const autoSubmitStarted = useRef(false);

  useEffect(() => {
    autoSubmitStarted.current = false;
    async function load() {
      try {
        const response = await fetch(`/api/asesmen/${asesmenId}?mode=kerjakan`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Asesmen gagal dimuat.");
        const loaded = payload.data as Assessment;
        setAssessment(loaded);
        setAnswers(Object.fromEntries(loaded.soal.map((question) => {
          const saved = loaded.jawabanTersimpan.find((answer) => answer.soalId === question.id);
          return [question.id, { opsiIds: saved?.opsiIds ?? [], jawabanEssay: saved?.jawabanEssay ?? "" }];
        })));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Asesmen gagal dimuat.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [asesmenId]);

  useEffect(() => {
    if (!assessment?.durasiMenit || assessment.submissionStatus === "SUDAH") return;
    const deadline = new Date(assessment.mulaiPada).getTime() + assessment.durasiMenit * 60_000;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !autoSubmitStarted.current) {
        autoSubmitStarted.current = true;
        void finishAssessment(true);
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [assessment]);

  async function saveAnswer(questionId: string, value: { opsiIds?: string[]; jawabanEssay?: string }) {
    const response = await fetch(`/api/asesmen/${asesmenId}/jawab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soalId: questionId, ...value }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Jawaban gagal disimpan.");
  }

  async function finishAssessment(automatically = false) {
    if (!assessment || saving || assessment.submissionStatus === "SUDAH") return;
    if (!automatically && !(await showConfirm("Kumpulkan asesmen sekarang? Jawaban tidak dapat diubah setelah dikumpulkan."))) return;
    setSaving(true);
    setError("");
    try {
      const current = assessment.soal[activeIndex];
      if (current) {
        const answer = answers[current.id];
        await saveAnswer(current.id, {
          opsiIds: answer?.opsiIds ?? [],
          jawabanEssay: answer?.jawabanEssay ?? "",
        });
      }
      const response = await fetch(`/api/asesmen/${asesmenId}/selesai`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Asesmen gagal dikumpulkan.");
      setAssessment({ ...assessment, submissionStatus: "SUDAH" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Asesmen gagal dikumpulkan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Memuat asesmen...</p>;
  if (!assessment) return <p role="alert" className="text-sm text-[var(--danger)]">{error || "Asesmen tidak ditemukan."}</p>;

  const currentQuestion = assessment.soal[activeIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const timeLabel = secondsLeft === null ? null : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => router.push("/super-admin/asesmen")} className="text-sm font-medium text-[var(--link)] hover:underline">
        &larr; Kembali ke Asesmen
      </button>
      <section className={`${PANEL} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <h1 className="text-xl font-semibold">{assessment.judul}</h1>
          <div className="mt-2 flex gap-2">
            <Badge tone="brand">{assessment.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
            {assessment.mapel && <Badge tone="gray">{assessment.mapel.nama}</Badge>}
            <Badge tone="gray">Submission akun Super Admin</Badge>
          </div>
        </div>
        {timeLabel && <p className="text-sm font-semibold tabular-nums">Sisa waktu {timeLabel}</p>}
      </section>

      {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
      {assessment.submissionStatus === "SUDAH" ? (
        <section className={PANEL}>
          <p className="font-semibold">Asesmen sudah dikumpulkan.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Jawaban ini tersimpan sebagai submission akun Super Admin.</p>
          <Btn className="mt-4" onClick={() => router.push(`/super-admin/asesmen/${asesmenId}/jawaban/${assessment.submissionId}`)}>
            Lihat jawaban saya
          </Btn>
        </section>
      ) : assessment.soal.length === 0 ? (
        <p className={PANEL}>Asesmen ini belum memiliki soal.</p>
      ) : currentQuestion ? (
        <>
          <section className={PANEL}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Soal {activeIndex + 1} dari {assessment.soal.length}</p>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => index - 1)}>Sebelumnya</Btn>
                <Btn variant="outline" size="sm" disabled={activeIndex >= assessment.soal.length - 1} onClick={() => setActiveIndex((index) => index + 1)}>Berikutnya</Btn>
              </div>
            </div>
            <p className="font-medium leading-relaxed">{currentQuestion.pertanyaan}</p>
            {currentQuestion.gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentQuestion.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-md object-contain" />
            )}
            {currentQuestion.tipe === "ESSAY" ? (
              <textarea
                className="mt-4 min-h-32 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-3 text-sm"
                value={currentAnswer?.jawabanEssay ?? ""}
                onChange={(event) => setAnswers((previous) => ({
                  ...previous,
                  [currentQuestion.id]: { opsiIds: [], jawabanEssay: event.target.value },
                }))}
                onBlur={() => {
                  const answer = answers[currentQuestion.id];
                  if (answer) void saveAnswer(currentQuestion.id, { jawabanEssay: answer.jawabanEssay }).catch((reason) => setError(reason.message));
                }}
                placeholder="Tulis jawaban..."
              />
            ) : (
              <div className="mt-4 space-y-2">
                {currentQuestion.opsi.map((option) => {
                  const checked = currentAnswer?.opsiIds.includes(option.id) ?? false;
                  return (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--border)] p-3 text-sm hover:bg-[var(--tint)]">
                      <input
                        type={currentQuestion.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                        checked={checked}
                        onChange={() => {
                          const next = currentQuestion.tipe === "PILIHAN_GANDA"
                            ? [option.id]
                            : checked
                              ? (currentAnswer?.opsiIds ?? []).filter((id) => id !== option.id)
                              : [...(currentAnswer?.opsiIds ?? []), option.id];
                          setAnswers((previous) => ({
                            ...previous,
                            [currentQuestion.id]: { opsiIds: next, jawabanEssay: "" },
                          }));
                          void saveAnswer(currentQuestion.id, { opsiIds: next }).catch((reason) => setError(reason.message));
                        }}
                      />
                      {option.teks}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
          <div className="flex justify-end">
            <Btn loading={saving} onClick={() => void finishAssessment()}>Kumpulkan asesmen</Btn>
          </div>
        </>
      ) : null}
    </div>
  );
}
