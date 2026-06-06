import { ACTIVITY_FILTERS } from "@/lib/constants/activity-filters";
import type { ActivityFilterId } from "@/lib/types/activity";
import { cn } from "@/lib/utils";

interface ActivityFiltersProps {
  activeFilter: ActivityFilterId;
  disabled?: boolean;
  onChange: (filter: ActivityFilterId) => void;
}

export function ActivityFilters({
  activeFilter,
  disabled,
  onChange,
}: ActivityFiltersProps) {
  return (
    <div className="relative -mx-4 overflow-hidden sm:mx-0">
      <div
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0"
        role="tablist"
        aria-label="Filter activity by type"
      >
        {ACTIVITY_FILTERS.map((filter) => {
          const selected = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onChange(filter.id)}
              className={cn(
                "min-h-11 shrink-0 snap-start touch-manipulation rounded-full border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0",
                selected
                  ? "border-secondary/50 bg-secondary/15 text-secondary"
                  : "border-border bg-white text-muted-foreground hover:border-primary/20 hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-dashboard to-transparent sm:hidden"
      />
    </div>
  );
}
