export type ClassFeedType = "ALL" | "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";

const FILTERS: { value: ClassFeedType; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENGUMUMAN", label: "Pengumuman" },
  { value: "MATERI", label: "Materi" },
  { value: "TUGAS", label: "Tugas" },
  { value: "ASESMEN", label: "Asesmen" },
];

export function filterClassFeed<T extends { tipe: string }>(items: T[], filter: ClassFeedType) {
  return filter === "ALL" ? items : items.filter((item) => item.tipe === filter);
}

export default function ClassFeedFilter({
  value,
  onChange,
  themed = false,
}: {
  value: ClassFeedType;
  onChange: (value: ClassFeedType) => void;
  themed?: boolean;
}) {
  return (
    <div aria-label="Filter aktivitas kelas" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`min-h-10 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors sm:w-auto ${
            themed
              ? value === filter.value
                ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]"
                : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--tint)]"
              : value === filter.value
                ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]"
                : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--brand)] hover:bg-[var(--tint)]"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
