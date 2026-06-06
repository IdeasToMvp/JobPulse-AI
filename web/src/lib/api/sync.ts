import { apiRequest, ApiError } from "@/lib/api/client";
import type {
  CompanySyncResult,
  PlatformSyncResult,
} from "@/lib/sync/sync-types";
import type { UserSyncState } from "@/lib/types/user";

export class SyncCancelledError extends Error {
  constructor() {
    super("Sync cancelled");
    this.name = "SyncCancelledError";
  }
}

let abortController: AbortController | null = null;
let cancelRequested = false;

function toDatePayload(fromDate?: Date, toDate?: Date, incrementalOnly?: boolean) {
  const payload: Record<string, string | boolean> = {};
  if (fromDate) payload.fromDate = fromDate.toISOString().substring(0, 10);
  if (toDate) payload.toDate = toDate.toISOString().substring(0, 10);
  if (incrementalOnly) payload.incrementalOnly = true;
  return payload;
}

async function postSync<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      method: "POST",
      body,
      signal: abortController?.signal,
    });
  } catch (error) {
    if (cancelRequested) throw new SyncCancelledError();
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new SyncCancelledError();
    }
    if (error instanceof ApiError && error.status === 409) {
      throw new SyncCancelledError();
    }
    throw error;
  }
}

export async function beginSyncSession(): Promise<void> {
  cancelRequested = false;
  abortController = new AbortController();
  try {
    await apiRequest("/sync/begin", {
      method: "POST",
      signal: abortController.signal,
    });
  } catch {
    // begin is best-effort
  }
}

export function endSyncSession(): void {
  abortController = null;
  cancelRequested = false;
}

export async function cancelSyncRequest(): Promise<void> {
  cancelRequested = true;
  abortController?.abort();
  try {
    await apiRequest("/sync/cancel", { method: "POST" });
  } catch {
    // ignore
  }
}

export async function runPlatformSync(options: {
  fromDate?: Date;
  toDate?: Date;
  incrementalOnly?: boolean;
}): Promise<PlatformSyncResult> {
  const data = await postSync<PlatformSyncResult>(
    "/sync/platform",
    toDatePayload(options.fromDate, options.toDate, options.incrementalOnly),
  );
  return {
    newMessages: data.newMessages ?? 0,
    skippedProcessed: data.skippedProcessed ?? 0,
    aiCalls: data.aiCalls ?? 0,
    companiesDiscovered: data.companiesDiscovered ?? 0,
    maxInternalDate: data.maxInternalDate,
    fromDate: data.fromDate ?? "",
    toDate: data.toDate ?? "",
  };
}

export async function runCompanySync(options: {
  fromDate?: Date;
  toDate?: Date;
  incrementalOnly?: boolean;
}): Promise<CompanySyncResult> {
  const data = await postSync<CompanySyncResult>(
    "/sync/companies",
    toDatePayload(options.fromDate, options.toDate, options.incrementalOnly),
  );
  return {
    companyEmailsProcessed: data.companyEmailsProcessed ?? 0,
    skippedProcessed: data.skippedProcessed ?? 0,
    aiCalls: data.aiCalls ?? 0,
    companiesScanned: data.companiesScanned ?? 0,
    fromDate: data.fromDate ?? "",
    toDate: data.toDate ?? "",
  };
}

export async function finalizeSync(input: {
  fromDate: string;
  toDate: string;
  maxInternalDate?: string;
  newMessages?: number;
  skippedProcessed?: number;
  aiCalls?: number;
  companyEmailsProcessed?: number;
  companiesDiscovered?: number;
  companiesScanned?: number;
}): Promise<UserSyncState> {
  return postSync<UserSyncState>("/sync/finalize", input);
}

export async function finalizeSyncStats(): Promise<UserSyncState> {
  return postSync<UserSyncState>("/sync/finalize", {});
}
