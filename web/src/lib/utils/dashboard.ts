import type { PlatformSyncStats, UserProfile, UserSyncState } from "@/lib/types/user";

export function getGreetingPeriod(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function formatLastSync(lastSyncedAt?: string): string {
  if (!lastSyncedAt) return "Never";

  const last = new Date(lastSyncedAt);
  const minutesAgo = Math.floor((Date.now() - last.getTime()) / 60000);

  if (minutesAgo <= 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function hasStatsData(sync: UserSyncState): boolean {
  return (
    sync.emailsProcessed > 0 ||
    sync.applicationsCount > 0 ||
    sync.interviewsCount > 0 ||
    sync.offersCount > 0
  );
}

export function showNoResultsMessage(user: UserProfile): boolean {
  return (
    user.sync.hasSynced &&
    !hasStatsData(user.sync) &&
    user.syncSettings.initialSyncMode === "import_history"
  );
}

export function getPlatformEntries(
  byPlatform: Record<string, PlatformSyncStats>,
): Array<[string, PlatformSyncStats]> {
  return Object.entries(byPlatform).filter(
    ([, stats]) =>
      stats.emailsProcessed > 0 || stats.applicationsCount > 0,
  );
}
