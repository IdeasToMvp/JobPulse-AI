import { Check } from "lucide-react";

import type { JobPlatform } from "@/lib/constants/job-platforms";
import { cn } from "@/lib/utils";

interface PlatformCardProps {
  platform: JobPlatform;
  selected: boolean;
  onToggle: (id: string) => void;
  compact?: boolean;
}

export function PlatformCard({
  platform,
  selected,
  onToggle,
  compact,
}: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(platform.id)}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl border text-left transition-all",
        compact ? "min-h-[52px] px-3 py-2.5" : "min-h-14 gap-3 px-4 py-3",
        selected
          ? "border-primary bg-platforms-selected shadow-sm ring-1 ring-primary/20"
          : "border-border bg-white hover:border-primary/30 hover:bg-muted/40",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-colors",
          compact ? "h-8 w-8" : "h-10 w-10",
          selected
            ? "bg-primary text-white"
            : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        <platform.icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </div>

      <span
        className={cn(
          "min-w-0 flex-1 font-semibold text-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {platform.label}
      </span>

      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border transition-all",
          compact ? "h-4 w-4" : "h-5 w-5",
          selected
            ? "border-primary bg-primary text-white"
            : "border-border bg-white",
        )}
      >
        {selected ? (
          <Check className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} strokeWidth={3} />
        ) : null}
      </div>
    </button>
  );
}

interface PlatformGridProps {
  platforms: JobPlatform[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  compact?: boolean;
}

export function PlatformGrid({
  platforms,
  selectedIds,
  onToggle,
  compact,
}: PlatformGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-2.5",
        compact
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {platforms.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          selected={selectedIds.has(platform.id)}
          onToggle={onToggle}
          compact={compact}
        />
      ))}
    </div>
  );
}
