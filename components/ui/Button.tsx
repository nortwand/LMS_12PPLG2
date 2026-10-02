"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  const variantStyle: Record<Variant, { className: string; style?: React.CSSProperties }> = {
    primary: {
      className: "text-[var(--on-brand)] hover:opacity-90",
      style: { background: "var(--brand, #658864)", color: "var(--on-brand, #fff)" },
    },
    outline: {
      className: "border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--tint)]",
    },
    danger: {
      className: "text-[var(--bg)] hover:opacity-90",
      style: { background: "var(--danger, #9A3B2E)", color: "var(--bg, #FAF6EE)" },
    },
    ghost: {
      className: "text-[var(--muted)] hover:bg-[var(--tint)]",
    },
  };

  const v = variantStyle[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${v.className} ${className}`}
      style={{ ...v.style, ...style }}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Memproses...
        </>
      ) : (
        children
      )}
    </button>
  );
}