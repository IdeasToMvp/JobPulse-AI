export interface SyncFrequencyOption {
  label: string;
  minutes: number;
}

export const SYNC_FREQUENCY_OPTIONS: SyncFrequencyOption[] = [
  { label: "Every 30 Minutes", minutes: 30 },
  { label: "Every Hour", minutes: 60 },
  { label: "Every 6 Hours", minutes: 360 },
  { label: "Every 12 Hours", minutes: 720 },
  { label: "Every 24 Hours", minutes: 1440 },
  { label: "Manual Only", minutes: 0 },
];

export function syncFrequencyFromMinutes(minutes: number): SyncFrequencyOption {
  return (
    SYNC_FREQUENCY_OPTIONS.find((option) => option.minutes === minutes) ??
    SYNC_FREQUENCY_OPTIONS[0]
  );
}
