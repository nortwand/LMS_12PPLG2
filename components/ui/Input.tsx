"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

const baseField = "w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">{label}</label>}
      <input ref={ref} className={`${baseField} ${error ? "border-[var(--danger)]" : ""} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={`${baseField} resize-none ${error ? "border-[var(--danger)]" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, className = "", children, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">{label}</label>}
      <select ref={ref} className={`${baseField} ${error ? "border-[var(--danger)]" : ""} ${className}`} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";