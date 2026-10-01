"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/*
  Palet (3 warna): Brand #658864, Bg #FAF6EE, Putih #FFFFFF.
  Token sama dengan landing page. Tambahan: --border-strong (border input),
  --link (turunan brand yang lebih gelap agar teks link terbaca), --danger (status error).
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
.lp a,.lp button,.lp input,.lp textarea{transition:background-color .12s,color .12s,border-color .12s,opacity .12s}
`;

const INPUT =
  "h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-base text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] md:text-sm";
const BTN_PRIMARY =
  "flex h-11 w-full items-center justify-center rounded-md bg-[var(--brand)] text-sm font-medium text-[var(--on-brand)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const LINK_BTN =
  "inline-flex h-10 cursor-pointer items-center text-sm font-medium text-[var(--link)] underline-offset-4 hover:underline";
const MUTED_BTN =
  "inline-flex h-10 cursor-pointer items-center text-sm text-[var(--muted)] hover:text-[var(--fg)]";

type Portal = "ADMIN" | "PETUGAS" | "SISWA";
type View = "LOGIN" | "LAPOR" | "OTP" | "PASSWORD_BARU" | "SUKSES";

const PORTAL_CONFIG: Record<
  Portal,
  { label: string; title: string; identifierLabel: string; identifierPlaceholder: string }
> = {
  ADMIN: { label: "Admin", title: "Login Sebagai Admin", identifierLabel: "Email", identifierPlaceholder: "Email" },
  PETUGAS: { label: "Petugas", title: "Login Sebagai Petugas", identifierLabel: "NIK", identifierPlaceholder: "NIK" },
  SISWA: { label: "Siswa", title: "Login Sebagai Siswa", identifierLabel: "NIS", identifierPlaceholder: "NIS" },
};

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

function Heading({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {desc && <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>}
    </div>
  );
}

function Field({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input id={id} className={INPUT} {...props} />
    </div>
  );
}

function ErrorText({ message, center }: { message: string; center?: boolean }) {
  if (!message) return null;
  return (
    <p role="alert" className={`text-sm text-[var(--danger)] ${center ? "text-center" : ""}`}>
      {message}
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("LOGIN");

  // ===== state login =====
  const [portal, setPortal] = useState<Portal>("ADMIN");
  const [loginIdentifier, setLoginIdentifier] = useState(""); // email (admin) / nik (petugas) / nis (siswa)
  const [loginPassword, setLoginPassword] = useState("");

  // ===== state lupa password =====
  const [identifier, setIdentifier] = useState(""); // NIS/NIK
  const [lupaEmail, setLupaEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alasan, setAlasan] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [passwordBaru, setPasswordBaru] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const config = PORTAL_CONFIG[portal];

  function resetLupaState() {
    setIdentifier("");
    setLupaEmail("");
    setTanggalLahir("");
    setAlasan("");
    setOtpDigits(["", "", "", ""]);
    setPasswordBaru("");
    setError("");
    setInfo("");
  }

  function handlePortalChange(newPortal: Portal) {
    setPortal(newPortal);
    setLoginIdentifier("");
    setLoginPassword("");
    setError("");
  }

  // ===== LOGIN =====
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword, portal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal, coba lagi.");
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

  // ===== LAPOR (step 1) =====
  async function handleLaporSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, email: lupaEmail, tanggalLahir, alasan }),
      });
      const data = await res.json();
      setInfo(data.message ?? "Laporan berhasil dikirim ke admin.");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ===== OTP (step 2) =====
  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return; // cuma boleh 1 digit angka
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const otp = otpDigits.join("");
    if (otp.length !== 4) {
      setError("Masukkan 4 digit kode OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kode OTP tidak valid.");
        setLoading(false);
        return;
      }
      setView("PASSWORD_BARU");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ===== PASSWORD BARU (step 3) =====
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (passwordBaru.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, passwordBaru }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password.");
        setLoading(false);
        return;
      }
      setView("SUKSES");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function kembaliKeLogin() {
    resetLupaState();
    setView("LOGIN");
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
          <Link href="/" className="text-base font-semibold tracking-tight">
            Studify
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="flex h-10 items-center rounded-md border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--tint)]"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* KONTEN */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          {/* ============ VIEW: LOGIN ============ */}
          {view === "LOGIN" && (
            <>
              <Heading
                title="Selamat datang di Studify"
                desc="Ayo belajar lebih cerdas bersama Studify."
              />

              <p className="mt-6 text-xs font-medium text-[var(--muted)]">Portal Administrasi</p>
              <div
                role="group"
                aria-label="Portal Administrasi"
                className="mt-2 grid grid-cols-3 gap-1 rounded-md border border-[var(--border)] p-1"
              >
                {(Object.keys(PORTAL_CONFIG) as Portal[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={portal === key}
                    onClick={() => handlePortalChange(key)}
                    className={`h-10 cursor-pointer rounded-[4px] text-sm font-medium ${
                      portal === key
                        ? "bg-[var(--brand)] text-[var(--on-brand)]"
                        : "text-[var(--muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    {PORTAL_CONFIG[key].label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLoginSubmit} aria-label={config.title} className="mt-5 space-y-4">
                <Field
                  id="login-identifier"
                  label={config.identifierLabel}
                  type={portal === "ADMIN" ? "email" : "text"}
                  required
                  autoComplete="username"
                  placeholder={config.identifierPlaceholder}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                />
                <Field
                  id="login-password"
                  label="Password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />

                <ErrorText message={error} />

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  {loading ? "Memproses..." : "Masuk"}
                </button>

                {portal !== "ADMIN" && (
                  <p className="text-center text-sm text-[var(--muted)]">
                    Lupa Password?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        resetLupaState();
                        setView("LAPOR");
                      }}
                      className={LINK_BTN}
                    >
                      Ubah Password
                    </button>
                  </p>
                )}
              </form>
            </>
          )}

          {/* ============ VIEW: LAPOR (step 1) ============ */}
          {view === "LAPOR" && (
            <>
              <Heading
                title="Buat laporan password"
                desc="Gunakan NIS/NIK, email, tanggal lahir, dan alasan untuk ubah password."
              />

              {info ? (
                <div role="status" className="mt-6 rounded-md border border-[var(--border)] bg-[var(--tint)] p-4">
                  <p className="text-sm leading-relaxed">{info}</p>
                  <button type="button" onClick={kembaliKeLogin} className={`${LINK_BTN} mt-2`}>
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLaporSubmit} className="mt-6 space-y-4">
                  <Field
                    id="lapor-identifier"
                    label="NIS / NIK"
                    required
                    placeholder="NIS / NIK"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <Field
                    id="lapor-email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email"
                    value={lupaEmail}
                    onChange={(e) => setLupaEmail(e.target.value)}
                  />
                  <Field
                    id="lapor-tanggal-lahir"
                    label="Tanggal lahir"
                    type="date"
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                  />
                  <div>
                    <label htmlFor="lapor-alasan" className="mb-1.5 block text-sm font-medium">
                      Alasan lupa password
                    </label>
                    <textarea
                      id="lapor-alasan"
                      required
                      placeholder="Alasan lupa password"
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] md:text-sm"
                    />
                  </div>

                  <ErrorText message={error} />

                  <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                    {loading ? "Mengirim..." : "Buat Laporan"}
                  </button>

                  <div className="flex items-center justify-between">
                    <button type="button" onClick={kembaliKeLogin} className={MUTED_BTN}>
                      Kembali ke login
                    </button>
                    <button type="button" onClick={() => setView("OTP")} className={LINK_BTN}>
                      Sudah punya kode OTP?
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ============ VIEW: OTP (step 2) ============ */}
          {view === "OTP" && (
            <>
              <Heading
                title="Ubah password"
                desc="Ketik NIS/NIK lalu masukkan kode OTP 4 digit yang dikirim admin melalui email."
              />

              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <Field
                  id="otp-identifier"
                  label="NIS / NIK"
                  required
                  placeholder="NIS / NIK"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />

                <div role="group" aria-labelledby="otp-label">
                  <span id="otp-label" className="mb-1.5 block text-sm font-medium">
                    Kode OTP
                  </span>
                  <div className="flex gap-2">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        aria-label={`Digit OTP ${i + 1}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="h-12 w-12 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] text-center text-lg font-semibold tabular-nums text-[var(--fg)] focus:border-[var(--brand)]"
                      />
                    ))}
                  </div>
                </div>

                <ErrorText message={error} />

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  {loading ? "Memverifikasi..." : "Lanjut"}
                </button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={kembaliKeLogin} className={MUTED_BTN}>
                    Kembali ke login
                  </button>
                  <button type="button" onClick={() => setView("LAPOR")} className={LINK_BTN}>
                    Belum lapor?
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ============ VIEW: PASSWORD BARU (step 3) ============ */}
          {view === "PASSWORD_BARU" && (
            <>
              <Heading title="Buat password baru" desc="Gunakan password minimal 6 karakter." />

              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                <Field
                  id="password-baru"
                  label="Password baru"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Password Baru"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                />

                <ErrorText message={error} />

                <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                  {loading ? "Menyimpan..." : "Buat Password"}
                </button>

                <div>
                  <button type="button" onClick={kembaliKeLogin} className={MUTED_BTN}>
                    Kembali ke login
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ============ VIEW: SUKSES ============ */}
          {view === "SUKSES" && (
            <div className="text-center" role="status">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand)] text-[var(--link)]">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-semibold tracking-tight">Password berhasil diubah</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">Silakan login dengan password baru Anda.</p>
              <button type="button" onClick={kembaliKeLogin} className={`${BTN_PRIMARY} mt-6`}>
                Kembali ke Login
              </button>
            </div>
          )}
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