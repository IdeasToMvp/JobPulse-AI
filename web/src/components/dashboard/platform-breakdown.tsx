import { Card } from "@/components/ui/card";
import { getPlatformLabel } from "@/lib/constants/platform-labels";
import { getPlatformEntries } from "@/lib/utils/dashboard";
import type { UserSyncState } from "@/lib/types/user";

interface PlatformBreakdownProps {
  sync: UserSyncState;
}

export function PlatformBreakdown({ sync }: PlatformBreakdownProps) {
  const entries = getPlatformEntries(sync.byPlatform);

  if (entries.length === 0) return null;

  return (
    <Card padding="md" className="overflow-hidden">
      <h2 className="text-base font-semibold text-foreground sm:text-lg">
        By job source
      </h2>

      <div className="mt-4 divide-y divide-border">
        {entries.map(([platformId, stats]) => (
          <div
            key={platformId}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm font-semibold text-foreground">
              {getPlatformLabel(platformId)}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
              <span>{stats.emailsProcessed} emails</span>
              <span>{stats.applicationsCount} apps</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
