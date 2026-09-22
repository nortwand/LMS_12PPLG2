"use client";

import Link from "next/link";

const BRAND = "#658864";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#111827]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#FAF6EE]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Studify
            </span>
          </div>

          <Link
            href="/login"
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: BRAND }}
          >
            Login
          </Link>
        </div>
      </header>

      {/* HERO - ganti background di style bawah dengan foto gedung sekolah lu sendiri (taro di /public) */}
      <section
        className="relative flex min-h-[700px] items-center justify-center bg-cover bg-center text-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(17,24,39,0.35), rgba(17,24,39,0.55)), url('/hero-sekolah.jpg')",
          backgroundColor: "#1F2937",
        }}
      >
        <div className="px-6">
          <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ayo Belajar Lebih Cerdas Bersama Studify
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/90 md:text-base">
            &quot;Platform pembelajaran digital yang membantu guru dan siswa belajar,
            mengajar, dan berkembang dalam satu tempat.&quot;
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: BRAND }}
          >
            Login
          </Link>
        </div>
      </section>

      <footer className="py-12 text-center text-white" style={{ background: BRAND }}>
        <p className="text-lg font-bold">Studify</p>
        <p className="mt-10 border-t border-white/20 pt-6 text-xs text-white/80">
          © 2026 Studify. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
