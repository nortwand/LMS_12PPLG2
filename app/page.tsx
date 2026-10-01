"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/*
  Palet (3 warna):
  - Brand  #658864
  - Bg     #FAF6EE
  - Putih  #FFFFFF
  Semua tone lain (teks, border, tint) diturunkan dari ketiganya.
  Asumsi: dark mode memakai class "dark" di <html> (Tailwind darkMode: "class").
*/

const STYLES = `
.lp{
  --bg:#FAF6EE; --surface:#FFFFFF; --tint:#F2EEE4;
  --fg:#1B261B; --muted:#5E6E5D;
  --border:rgba(27,38,27,.12);
  --brand:#658864; --on-brand:#FFFFFF;
  --focus:#658864;
}
.dark .lp{
  --bg:#141B14; --surface:#1B241B; --tint:#202B20;
  --fg:#FFFFFF; --muted:rgba(255,255,255,.66);
  --border:rgba(255,255,255,.12);
  --brand:#6F9A6E; --on-brand:#FFFFFF;
  --focus:#8FB88E;
}
.lp *:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:6px}
.lp a,.lp button{transition:background-color .12s,color .12s,border-color .12s}
`;

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

const FITUR = [
  ["Autentikasi berbasis role", "Setiap pengguna masuk sesuai perannya dan hanya melihat menu yang relevan."],
  ["Dashboard per peran", "Tampilan khusus untuk Admin, Kepala Sekolah, Kurikulum, Guru, dan Siswa."],
  ["Kelas dan anggota kelas", "Pengelolaan kelas, mata pelajaran, dan daftar anggota dalam satu sistem."],
  ["Pengumuman", "Informasi sekolah atau kelas tersampaikan langsung ke pengguna terkait."],
  ["Materi pembelajaran", "Guru mengunggah dan membagikan materi kepada siswa di kelasnya."],
  ["Tugas", "Pembuatan tugas oleh guru dan pengumpulan jawaban oleh siswa."],
  ["Asesmen", "Pembuatan asesmen dan soal, serta pengerjaan oleh siswa secara daring."],
  ["Penilaian", "Pemeriksaan jawaban dan pemberian nilai oleh guru."],
  ["Pemantauan performa", "Perkembangan akademik siswa, kelas, mata pelajaran, dan sekolah."],
  ["Ekspor nilai", "Data nilai dapat diekspor untuk kebutuhan administrasi sekolah."],
];

const PENGGUNA = [
  ["Admin", "Mengelola data dan akun pengguna sistem."],
  ["Kepala Sekolah", "Memantau performa akademik dan hasil asesmen sekolah."],
  ["Kurikulum", "Mengelola struktur pembelajaran dan memantau capaian."],
  ["Guru", "Mengelola materi, tugas, asesmen, dan penilaian."],
  ["Siswa", "Belajar, mengumpulkan tugas, mengikuti asesmen, dan melihat nilai."],
];

const MANFAAT = [
  [
    "Bagi sekolah",
    "Proses belajar mengajar yang semula manual menjadi terstruktur, terintegrasi, dan mudah dipantau. Data akademik tersimpan rapi dan siap digunakan untuk evaluasi serta administrasi.",
  ],
  [
    "Bagi guru",
    "Materi, tugas, dan asesmen dikelola di satu tempat. Pemeriksaan dan penilaian menjadi lebih efisien sehingga waktu lebih banyak untuk mengajar.",
  ],
  [
    "Bagi siswa",
    "Materi, tugas, dan asesmen dapat diakses kapan saja. Siswa dapat melihat perkembangan akademiknya sendiri secara jelas.",
  ],
];

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
      aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--tint)]"
    >
      {mounted && dark ? (
        <ThemeIcon sun />
      ) : (
        <ThemeIcon sun={false} />
      )}
    </button>
  );
}

export default function Home() {
  return (
    <div
      className="lp flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{STYLES}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <span className="text-base font-semibold tracking-tight">Studify</span>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
            <a href="#tentang" className="hover:text-[var(--fg)]">Tentang</a>
            <a href="#fitur" className="hover:text-[var(--fg)]">Fitur</a>
            <a href="#manfaat" className="hover:text-[var(--fg)]">Manfaat</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="flex h-10 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-[var(--on-brand)] hover:opacity-90"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-16 md:pb-24 md:pt-24">
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Pembelajaran sekolah, terpusat dalam satu platform.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
            Studify membantu guru dan siswa belajar, mengajar, dan berkembang
            dalam satu tempat, dengan pengelolaan yang terstruktur dan mudah
            dipantau oleh sekolah.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="flex h-11 items-center rounded-md bg-[var(--brand)] px-6 text-sm font-medium text-[var(--on-brand)] hover:opacity-90"
            >
              Login
            </Link>
            <a
              href="#tentang"
              className="flex h-11 items-center rounded-md border border-[var(--border)] px-6 text-sm font-medium hover:bg-[var(--tint)]"
            >
              Pelajari Studify
            </a>
          </div>
        </section>

        {/* 1. PENGERTIAN */}
        <section id="tentang" className="border-t border-[var(--border)]">
          <div className="mx-auto grid max-w-5xl gap-6 px-5 py-14 md:grid-cols-3 md:gap-10 md:py-16">
            <h2 className="text-lg font-semibold">Apa itu Studify</h2>
            <div className="space-y-4 text-sm leading-relaxed text-[var(--muted)] md:col-span-2">
              <p>
                Studify adalah Learning Management System (LMS) berbasis web
                yang dirancang untuk mendukung kegiatan pembelajaran di sekolah
                secara digital. Platform ini menjadi tempat terpusat bagi admin,
                kepala sekolah, bagian kurikulum, guru, dan siswa untuk
                mengelola proses belajar mengajar.
              </p>
              <p>
                Studify membantu sekolah beralih dari proses pembelajaran yang
                masih manual menjadi lebih terstruktur, terintegrasi, efisien,
                dan mudah dipantau.
              </p>
            </div>
          </div>
        </section>

        {/* 2. FITUR DAN PENGGUNA */}
        <section id="fitur" className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
            <h2 className="text-lg font-semibold">Fitur dan pengguna</h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              Satu sistem dengan hak akses sesuai peran masing-masing pengguna.
            </p>

            <dl className="mt-8 grid gap-x-10 border-t border-[var(--border)] md:grid-cols-2">
              {FITUR.map(([title, desc]) => (
                <div key={title} className="border-b border-[var(--border)] py-4">
                  <dt className="text-sm font-medium">{title}</dt>
                  <dd className="mt-1 text-sm text-[var(--muted)]">{desc}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-12 text-base font-semibold">Pengguna Studify</h3>
            <ul className="mt-4 border-t border-[var(--border)]">
              {PENGGUNA.map(([role, desc]) => (
                <li
                  key={role}
                  className="grid gap-1 border-b border-[var(--border)] py-4 sm:grid-cols-[180px_1fr] sm:gap-6"
                >
                  <span className="text-sm font-medium">{role}</span>
                  <span className="text-sm text-[var(--muted)]">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. MANFAAT */}
        <section id="manfaat" className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
            <h2 className="text-lg font-semibold">Manfaat Studify</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
              {MANFAAT.map(([title, desc]) => (
                <div key={title}>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
            <div className="flex flex-col gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Masuk ke Studify</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Gunakan akun yang diberikan sekolah untuk melanjutkan.
                </p>
              </div>
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-md bg-[var(--brand)] px-6 text-sm font-medium text-[var(--on-brand)] hover:opacity-90"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-[var(--fg)]">Studify</span>
          <span>© 2026 Studify. All Rights Reserved.</span>
        </div>
      </footer>
    </div>
  );
}