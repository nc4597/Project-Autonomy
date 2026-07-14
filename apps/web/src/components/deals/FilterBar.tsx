import { Search } from "lucide-react";
import { DEAL_TYPES, SECTORS } from "@/lib/marketplace/constants";
import type { DealType, Sector } from "@/lib/marketplace/types";

type StatusFilter = "all" | "live" | "closed";

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sector,
  onSectorChange,
  dealType,
  onDealTypeChange,
  resultCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  sector: Sector | "all";
  onSectorChange: (value: Sector | "all") => void;
  dealType: DealType | "all";
  onDealTypeChange: (value: DealType | "all") => void;
  resultCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-card px-6 py-5">
      <div className="relative min-w-[220px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search offerings..."
          className="w-full border border-hairline bg-page py-3 pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-navy-800 focus:outline-none"
        />
      </div>

      <div className="flex border border-hairline">
        {(["all", "live", "closed"] as StatusFilter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onStatusChange(option)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
              status === option
                ? "bg-navy-950 text-white"
                : "bg-card text-ink-secondary hover:text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <select
        value={sector}
        onChange={(e) => onSectorChange(e.target.value as Sector | "all")}
        className="border border-hairline bg-page px-4 py-3 text-sm text-ink focus:border-navy-800 focus:outline-none"
      >
        <option value="all">All Sectors</option>
        {SECTORS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={dealType}
        onChange={(e) => onDealTypeChange(e.target.value as DealType | "all")}
        className="border border-hairline bg-page px-4 py-3 text-sm text-ink focus:border-navy-800 focus:outline-none"
      >
        <option value="all">All Deal Types</option>
        {DEAL_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <span className="ml-auto text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {resultCount} Results
      </span>
    </div>
  );
}
