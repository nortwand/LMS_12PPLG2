"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Modal from "./ui/Modal";
import { showAlert } from "@/lib/dialog";

interface NilaiRow {
  submissionId: string;
  nama: string;
  nis: string;
  kelasReferensi: string;
  nilaiObjektif: number;
  nilaiAkhir: number | null;
  nilaiSementara: number;
  totalSoalTerjawab: number;
}

interface TabelNilaiProps {
  asesmenId: string;
  judulAsesmen: string;
  jenisAsesmen: "KUIS" | "UJIAN";
  mataPelajaran: string;
  kelasId: string;
  kelasNama: string;
  nilaiList: NilaiRow[];
  onReset?: () => void;
  readOnly?: boolean;
  basePath?: string;
}

export default function TabelNilai({ asesmenId, judulAsesmen, jenisAsesmen, mataPelajaran, kelasId, kelasNama, nilaiList, onReset, readOnly = false, basePath = "/guru/asesmen" }: TabelNilaiProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [resettingSubmissionId, setResettingSubmissionId] = useState<string | null>(null);
  const [resetRequest, setResetRequest] = useState<{
    type: "asesmen" | "nilai";
    submissionId: string;
    nama: string;
  } | null>(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      const query = new URLSearchParams({ format: "xlsx", kelasId });
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai?${query}`);
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nilai-${judulAsesmen.replace(/\s+/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      await showAlert("Gagal mengunduh nilai. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  }

  function handlePrintPdf() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      void showAlert("Izinkan pop-up untuk membuka pratinjau cetak PDF.");
      return;
    }

    const escapeHtml = (value: string | number) => String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const printedAt = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
    const rows = nilaiList.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.nama)}</td>
        <td>${escapeHtml(row.nis)}</td>
        <td>${escapeHtml(row.kelasReferensi)}</td>
        <td>${row.totalSoalTerjawab}</td>
        <td>${row.nilaiObjektif}</td>
        <td>${row.nilaiAkhir ?? "-"}</td>
      </tr>`).join("");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="id"><head><meta charset="utf-8"><title>Rekap Nilai - ${escapeHtml(judulAsesmen)}</title>
      <style>
        @page { size: A4 portrait; margin: 14mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #17231A; font: 10pt Arial, sans-serif; }
        h1 { margin: 0 0 5mm; font-size: 19pt; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 8mm; margin-bottom: 7mm; }
        .meta p { margin: 0; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #84918A; padding: 2.2mm 1.5mm; text-align: left; overflow-wrap: anywhere; }
        th { background: #EAF0EA; font-size: 8pt; }
        td { font-size: 8.5pt; }
        th:first-child, td:first-child { width: 7mm; text-align: center; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 15mm; margin-top: 18mm; page-break-inside: avoid; }
        .signature { min-height: 29mm; text-align: center; }
        .signature .space { height: 18mm; }
        .signature p { margin: 0; }
        @media print { tr { break-inside: avoid; } }
      </style></head><body>
      <h1>Rekap Nilai</h1>
      <div class="meta">
        <p><strong>Asesmen:</strong> ${escapeHtml(judulAsesmen)}</p>
        <p><strong>Jenis:</strong> ${jenisAsesmen === "KUIS" ? "Kuis" : "Ujian Online"}</p>
        <p><strong>Mata Pelajaran:</strong> ${escapeHtml(mataPelajaran || "-")}</p>
        <p><strong>Kelas:</strong> ${escapeHtml(kelasNama)}</p>
        <p><strong>Tanggal cetak:</strong> ${escapeHtml(printedAt)}</p>
      </div>
      <table><thead><tr><th>No.</th><th>Nama Siswa</th><th>NIS</th><th>Kelas/Jurusan</th><th>Soal Terjawab</th><th>Nilai Objektif</th><th>Nilai Akhir</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=\"7\">Belum ada siswa yang mengumpulkan.</td></tr>"}</tbody></table>
      <div class="signatures">
        <div class="signature"><p>Kepala Sekolah</p><div class="space"></div><p>(____________________________)</p></div>
        <div class="signature"><p>Wakil Kepala Sekolah Bidang Kurikulum</p><div class="space"></div><p>(____________________________)</p></div>
      </div>
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setShowExportModal(false);
  }

  async function handleResetSubmission(submissionId: string) {
    setResettingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai/${submissionId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal mereset asesmen siswa.");
        return;
      }
      onReset?.();
    } catch {
      await showAlert("Gagal mereset asesmen siswa.");
    } finally {
      setResettingSubmissionId(null);
    }
  }

  async function handleResetNilai(submissionId: string) {
    setResettingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai/${submissionId}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal mereset nilai.");
        return;
      }
      onReset?.();
    } catch {
      await showAlert("Gagal mereset nilai.");
    } finally {
      setResettingSubmissionId(null);
    }
  }

  function closeResetModal() {
    if (!resettingSubmissionId) setResetRequest(null);
  }

  async function confirmReset() {
    if (!resetRequest) return;
    const request = resetRequest;
    setResetRequest(null);
    if (request.type === "asesmen") {
      await handleResetSubmission(request.submissionId);
    } else {
      await handleResetNilai(request.submissionId);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--fg)]">Nilai Siswa</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowExportModal(true)}>
            Generate Nilai
          </Button>
        </div>
      </div>

      {nilaiList.length === 0 ? (
        <p className="mt-6 text-center text-xs text-[var(--muted)]">Belum ada siswa yang mengumpulkan.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-[var(--fg)]">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                <th className="pb-2 font-semibold">Nama</th>
                <th className="pb-2 font-semibold">NIS</th>
                <th className="pb-2 font-semibold">Kelas/Jurusan</th>
                <th className="pb-2 font-semibold">Soal Terjawab</th>
                <th className="pb-2 text-right font-semibold">Nilai Objektif</th>
                <th className="pb-2 text-right font-semibold">Nilai Akhir</th>
                <th className="pb-2 text-right font-semibold">{readOnly ? "Detail" : "Aksi"}</th>
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((row) => (
                <tr
                  key={row.submissionId}
                  onClick={() => router.push(`${basePath}/${asesmenId}/jawaban/${row.submissionId}`)}
                  className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--tint)] last:border-0"
                >
                  <td className="py-2.5 font-medium text-[var(--fg)]">{row.nama}</td>
                  <td className="py-2.5 text-xs text-[var(--muted)]">{row.nis}</td>
                  <td className="py-2.5 text-xs text-[var(--muted)]">{row.kelasReferensi}</td>
                  <td className="py-2.5 text-xs text-[var(--muted)]">{row.totalSoalTerjawab}</td>
                  <td className="py-2.5 text-right">
                    <Badge tone={row.nilaiObjektif >= 75 ? "green" : row.nilaiObjektif >= 50 ? "amber" : "red"}>
                      {row.nilaiObjektif}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={(row.nilaiAkhir ?? row.nilaiObjektif) >= 75 ? "green" : (row.nilaiAkhir ?? row.nilaiObjektif) >= 50 ? "amber" : "red"}>
                      {row.nilaiAkhir ?? "-"}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    {!readOnly && <Button
                      size="sm"
                      variant="outline"
                      loading={resettingSubmissionId === row.submissionId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setResetRequest({ type: "asesmen", submissionId: row.submissionId, nama: row.nama });
                      }}
                    >
                      Reset Asesmen
                    </Button>}
                    {!readOnly && <Button
                      size="sm"
                      variant="outline"
                      loading={resettingSubmissionId === row.submissionId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setResetRequest({ type: "nilai", submissionId: row.submissionId, nama: row.nama });
                      }}
                    >
                      Reset Nilai
                    </Button>}
                    {readOnly && <span className="text-xs font-semibold text-[var(--link)]">Lihat jawaban</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Generate Nilai"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">Pilih format untuk {kelasNama}.</p>
          <Button className="w-full" loading={downloading} onClick={() => { setShowExportModal(false); void handleDownload(); }}>
            Unduh Excel (.xlsx)
          </Button>
          <Button className="w-full" variant="outline" onClick={handlePrintPdf}>
            Cetak / Simpan PDF
          </Button>
        </div>
      </Modal>

      <Modal
        open={resetRequest !== null}
        onClose={closeResetModal}
        title={resetRequest?.type === "asesmen" ? "Reset Asesmen Siswa" : "Reset Nilai Siswa"}
      >
        {resetRequest?.type === "asesmen" ? (
          <p className="text-sm leading-6 text-[var(--muted)]">
            Semua jawaban <strong>{resetRequest.nama}</strong> akan dihapus dan siswa dapat mengerjakan asesmen ini dari awal.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">
            Nilai akhir <strong>{resetRequest?.nama}</strong> akan dikosongkan. Jawaban siswa tetap tersimpan.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={closeResetModal}>
            Batal
          </Button>
          <Button
            size="sm"
            variant={resetRequest?.type === "asesmen" ? "danger" : "primary"}
            onClick={() => void confirmReset()}
          >
            {resetRequest?.type === "asesmen" ? "Reset Asesmen" : "Reset Nilai"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}