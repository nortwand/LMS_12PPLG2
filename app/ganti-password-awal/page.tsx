"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token sama dengan landing page dan login.
  Dark mode memakai class "dark" di <html>, key localStorage "theme" (sama dengan landing).
*/

const STYLES = `
.lp{
  color-scheme:light;
  --bg:#FAF6EE; --surface:#FFFFFF; --tint:#F2EEE4;
  --fg:#1B261B; --muted:#5E6E5D;
  --border:rgba(27,38,27,.12); --border-strong:rgba(27,38,27,.28);
  --brand:#658864; --on-brand:#FFFFFF; --link:#4F6E4E;
  --focus:#658864; --danger:#9A3B2E;
}
.dark .lp{
  color-scheme:dark;
  --bg:#141B14; --surface:#1B241B; --tint:#202B20;
  --fg:#FFFFFF; --muted:rgba(255,255,255,.66);
  --border:rgba(255,255,255,.12); --border-strong:rgba(255,255,255,.28);
  --brand:#658864; --on-brand:#FFFFFF; --link:#8FB88E;
  --focus:#8FB88E; --danger:#E8A398;
}
.lp *:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:6px}
.lp a,.lp button,.lp input{transition:background-color .12s,color .12s,border-color .12s,opacity .12s}
`;

const INPUT =
  "h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-base text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] md:text-sm";

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

export default function GantiPasswordAwalPage() {
  const router = useRouter();
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(passwordBaru)) {
      setError("Password minimal 6 karakter dan harus kombinasi huruf dan angka.");
      return;
    }
    if (passwordBaru !== konfirmasi) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ganti-password-awal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordBaru }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password.");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

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
          <ThemeToggle />
        </div>
      </header>

      {/* KONTEN */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Buat password baru</h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
            Password Anda masih menggunakan password sementara. Untuk keamanan akun, silakan buat
            password baru sebelum melanjutkan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password-baru" className="mb-1.5 block text-sm font-medium">
                Password baru
              </label>
              <input
                id="password-baru"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Password Baru"
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                aria-describedby="password-hint"
                className={INPUT}
              />
              <p id="password-hint" className="mt-1.5 text-xs text-[var(--muted)]">
                Minimal 6 karakter, kombinasi huruf dan angka.
              </p>
            </div>

            <div>
              <label htmlFor="konfirmasi" className="mb-1.5 block text-sm font-medium">
                Konfirmasi password baru
              </label>
              <input
                id="konfirmasi"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Konfirmasi Password Baru"
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                className={INPUT}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-md bg-[var(--brand)] text-sm font-medium text-[var(--on-brand)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>
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