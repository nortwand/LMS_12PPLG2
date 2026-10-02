"use client";

import { ReactNode } from "react";

type Tone = "brand" | "gray" | "green" | "red" | "amber";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: "bg-[var(--tint)] text-[var(--link)]",
  gray: "bg-[var(--tint)] text-[var(--muted)]",
  green: "bg-[var(--tint)] text-[var(--link)]",
  red: "bg-[var(--tint)] text-[var(--danger)]",
  amber: "border border-[var(--border-strong)] bg-[var(--tint)] text-[var(--fg)]",
};

export default function Badge({ children, tone = "brand", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}