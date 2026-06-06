import { STATUS_FILTERS } from "@/lib/constants/application-status";
import type { StatusFilterId } from "@/lib/types/application";
import type { UserSyncState } from "@/lib/types/user";
import { cn } from "@/lib/utils";

interface ApplicationStatusFiltersProps {
  activeFilter: StatusFilterId;
  sync: UserSyncState;
  onChange: (filter: StatusFilterId) => void;
}

function countForStatus(sync: UserSyncState, statusId: StatusFilterId): number {
  switch (statusId) {
    case "applied":
      return sync.appliedCount;
    case "active":
      return sync.activeCount;
    case "interview":
      return sync.interviewsCount;
    case "offer":
      return sync.offersCount;
    case "rejected":
      return sync.rejectedCount;
    case "ghosted":
      return sync.ghostedCount;
    default:
      return 0;
  }
}

export function ApplicationStatusFilters({
  activeFilter,
  sync,
  onChange,
}: ApplicationStatusFiltersProps) {
  return (
    <div className="relative -mx-4 overflow-hidden sm:mx-0">
      <div
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0"
        role="tablist"
        aria-label="Filter applications by status"
      >
        {STATUS_FILTERS.map((filter) => {
          const selected = activeFilter === filter.id;
          const count = countForStatus(sync, filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(filter.id)}
              className={cn(
                "min-h-11 shrink-0 snap-start touch-manipulation rounded-full border px-3.5 py-2 text-sm font-medium transition-colors sm:min-h-0",
                selected
                  ? "border-secondary/50 bg-secondary/15 text-secondary"
                  : "border-border bg-white text-muted-foreground hover:border-primary/20 hover:text-foreground",
              )}
            >
              {filter.label} ({count})
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
