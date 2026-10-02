"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string; // contoh: "max-w-md", "max-w-lg"
  dismissible?: boolean;
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-md", dismissible = true }: ModalProps) {
  // kunci scroll body pas modal kebuka
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      className="lp fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 text-[var(--fg)] animate-[fadeIn_0.15s_ease-out]"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] animate-[fadeUp_0.2s_ease-out]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--fg)]">{title}</h3>
          {dismissible && (
            <button
              onClick={onClose}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--tint)] hover:text-[var(--fg)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );

  // portal ke body biar gak ke-trap sama overflow/z-index parent
  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}