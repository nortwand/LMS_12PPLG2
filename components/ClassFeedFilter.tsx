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
}: {
  value: ClassFeedType;
  onChange: (value: ClassFeedType) => void;
}) {
  return (
    <div aria-label="Filter aktivitas kelas" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`min-h-10 border px-3 py-2 text-left text-xs font-semibold transition-colors sm:w-auto ${
            value === filter.value
              ? "border-[#365C3A] bg-[#365C3A] text-white"
              : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#365C3A]"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
