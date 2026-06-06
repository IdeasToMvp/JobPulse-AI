import { syncFrequencyFromMinutes } from "@/lib/constants/sync-frequency";

export function formatNextScheduledSync(
  autoSyncEnabled: boolean,
  syncFrequencyMinutes: number,
  lastSyncedAt?: string,
): string {
  const frequency = syncFrequencyFromMinutes(syncFrequencyMinutes);

  if (!autoSyncEnabled || frequency.minutes === 0) {
    return "Manual only";
  }

  if (!lastSyncedAt) {
    return "After first sync";
  }

  const minutesAgo = Math.floor(
    (Date.now() - new Date(lastSyncedAt).getTime()) / 60000,
  );
  const remaining = frequency.minutes - minutesAgo;

  if (remaining <= 0) return "Due now";
  if (remaining < 60) return `In ${remaining} minutes`;

  const hours = Math.ceil(remaining / 60);
  return `In ${hours} hour${hours === 1 ? "" : "s"}`;
}
