export type SyncButtonState = "idle" | "syncing" | "success";

export type SyncStep =
  | "idle"
  | "connecting"
  | "scanningPlatforms"
  | "discoveringCompanies"
  | "searchingCompanyEmails"
  | "finalizing"
  | "complete";

export interface PlatformSyncResult {
  newMessages: number;
  skippedProcessed: number;
  aiCalls: number;
  companiesDiscovered: number;
  maxInternalDate?: string;
  fromDate: string;
  toDate: string;
}

export interface CompanySyncResult {
  companyEmailsProcessed: number;
  skippedProcessed: number;
  aiCalls: number;
  companiesScanned: number;
  fromDate: string;
  toDate: string;
}

export interface RunSyncOptions {
  fromDate?: Date;
  toDate?: Date;
  incrementalOnly?: boolean;
}

export type DateRangePreset = "last30Days" | "last3Months" | "last1Year";

export function getDateRangeFromPreset(preset: DateRangePreset): {
  fromDate: Date;
  toDate: Date;
} {
  const toDate = new Date();
  const fromDate = new Date(toDate);

  switch (preset) {
    case "last30Days":
      fromDate.setDate(fromDate.getDate() - 30);
      break;
    case "last3Months":
      fromDate.setDate(fromDate.getDate() - 90);
      break;
    case "last1Year":
      fromDate.setDate(fromDate.getDate() - 365);
      break;
  }

  return { fromDate, toDate };
}

export function formatSyncDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getSyncProgressStepIndex(step: SyncStep): number {
  switch (step) {
    case "connecting":
      return 0;
    case "scanningPlatforms":
      return 1;
    case "discoveringCompanies":
      return 2;
    case "searchingCompanyEmails":
      return 3;
    case "finalizing":
    case "complete":
      return 4;
    default:
      return 0;
  }
}

export function getSyncProgressFraction(step: SyncStep): number {
  if (step === "complete") return 1;
  if (step === "idle") return 0;
  return (getSyncProgressStepIndex(step) + 0.5) / 5;
}

export const SYNC_PROGRESS_STEPS = [
  {
    title: "Connecting to Gmail",
    subtitle: "Verifying secure access",
  },
  {
    title: "Scanning job platforms",
    subtitle: "LinkedIn, Naukri, Indeed, and your other sources",
  },
  {
    title: "Building company list",
    subtitle: "Identifying employers from platform emails",
  },
  {
    title: "Searching company emails",
    subtitle: "Recruiter replies and company domain mail",
  },
  {
    title: "Updating dashboard",
    subtitle: "Computing stats and refreshing snapshot",
  },
] as const;

export function getSyncTaskLabel(
  step: SyncStep,
  buttonState: SyncButtonState,
): string {
  if (step === "complete" || buttonState === "success") {
    return "Sync complete";
  }

  switch (step) {
    case "connecting":
      return "Connecting to Gmail…";
    case "scanningPlatforms":
      return "Scanning job platforms…";
    case "discoveringCompanies":
      return "Building company list…";
    case "searchingCompanyEmails":
      return "Searching company emails…";
    case "finalizing":
      return "Updating dashboard…";
    default:
      return "Preparing sync…";
  }
}
