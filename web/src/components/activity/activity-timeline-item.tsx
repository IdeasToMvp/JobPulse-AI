import {
  ArrowLeftRight,
  Briefcase,
  RefreshCw,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import type { ActivityItem, ActivityType } from "@/lib/types/activity";
import {
  companyAvatarStyle,
  formatRelativeTimestamp,
  getActivityTypeColor,
  parseActivityDescription,
} from "@/lib/utils/activity";
import { cn } from "@/lib/utils";

interface ActivityTimelineItemProps {
  item: ActivityItem;
  isLast: boolean;
  onClick?: () => void;
}

const TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  application: Briefcase,
  status_update: ArrowLeftRight,
  suggestion: Sparkles,
  sync: RefreshCw,
  user_action: User,
};

export function ActivityTimelineItem({
  item,
  isLast,
  onClick,
}: ActivityTimelineItemProps) {
  const color = getActivityTypeColor(item.type);
  const Icon = TYPE_ICONS[item.type];
  const displayName = item.company ?? item.title;
  const { subtitle, detail } = parseActivityDescription(item.description);
  const isSync = item.type === "sync";

  return (
    <div className="flex gap-2.5 sm:gap-3">
      <div className="flex w-7 shrink-0 flex-col items-center">
        <div
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 1px ${color}40, 0 2px 6px ${color}55`,
          }}
          aria-hidden
        />
        {!isLast ? (
          <div className="my-1 w-0.5 flex-1 rounded-full bg-border" aria-hidden />
        ) : null}
      </div>

      <div className={cn("min-w-0 flex-1", !isLast && "pb-3.5 sm:pb-4")}>
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={cn(
            "w-full rounded-xl border border-border bg-white p-3.5 text-left shadow-sm transition-colors sm:p-4",
            onClick
              ? "touch-manipulation hover:border-primary/20 hover:bg-muted/20 active:bg-muted/30"
              : "cursor-default",
          )}
        >
          <div className="flex items-start gap-3">
            {isSync ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={companyAvatarStyle(displayName)}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatRelativeTimestamp(item.timestamp)}
                </span>
              </div>

              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {subtitle}
              </p>

              {detail ? (
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              ) : null}

              {onClick ? (
                <p className="mt-2 text-xs font-semibold text-secondary">
                  View application
                </p>
              ) : null}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
