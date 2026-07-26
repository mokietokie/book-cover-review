import type { BookStatus } from "@/lib/types";

const STATUS_ORDER: BookStatus[] = ["wishlist", "passed"];
const FULL_LABELS: Record<BookStatus, string> = {
  wishlist: "사고싶음",
  passed: "패스",
};
const SHORT_LABELS: Record<BookStatus, string> = {
  wishlist: "찜",
  passed: "패스",
};

export function StatusToggle({
  status,
  onChange,
  compact = false,
}: {
  status: BookStatus;
  onChange: (status: BookStatus) => void;
  compact?: boolean;
}) {
  const labels = compact ? SHORT_LABELS : FULL_LABELS;
  return (
    <div
      className={`inline-flex overflow-hidden rounded-md border border-neutral-300 ${
        compact ? "text-[11px]" : "text-sm"
      }`}
    >
      {STATUS_ORDER.map((value, i) => (
        <button
          key={value}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (value !== status) onChange(value);
          }}
          className={`px-2 py-1 font-medium transition-colors ${
            status === value
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-600 hover:bg-neutral-100"
          } ${i > 0 ? "border-l border-neutral-300" : ""}`}
        >
          {labels[value]}
        </button>
      ))}
    </div>
  );
}
