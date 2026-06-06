"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  SyncCancelledError,
  beginSyncSession,
  cancelSyncRequest,
  endSyncSession,
  finalizeSync,
  finalizeSyncStats,
  runCompanySync,
  runPlatformSync,
} from "@/lib/api/sync";
import { markImportHistorySync, saveJobSources } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import type {
  RunSyncOptions,
  SyncButtonState,
  SyncStep,
} from "@/lib/sync/sync-types";
import { hasUsableSyncData } from "@/lib/utils/dashboard";

interface SyncContextValue {
  syncButtonState: SyncButtonState;
  syncStep: SyncStep;
  syncStepDetail: string | null;
  isSyncing: boolean;
  canRunIncrementalSync: boolean;
  runSync: (options?: RunSyncOptions) => Promise<void>;
  runIncrementalSync: () => Promise<void>;
  runHistorySync: (input: {
    platformIds: string[];
    fromDate: Date;
    toDate: Date;
  }) => Promise<void>;
  cancelSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser, mergeUserSync } = useAuth();
  const [syncButtonState, setSyncButtonState] =
    useState<SyncButtonState>("idle");
  const [syncStep, setSyncStep] = useState<SyncStep>("idle");
  const [syncStepDetail, setSyncStepDetail] = useState<string | null>(null);

  const canRunIncrementalSync = Boolean(
    user && hasUsableSyncData(user.sync) && user.sync.lastSyncedAt,
  );

  const setStep = useCallback((step: SyncStep, detail?: string) => {
    setSyncStep(step);
    setSyncStepDetail(detail ?? null);
  }, []);

  const resetSyncUi = useCallback(() => {
    setSyncButtonState("idle");
    setSyncStep("idle");
    setSyncStepDetail(null);
  }, []);

  const runSync = useCallback(
    async (options: RunSyncOptions = {}) => {
      if (syncButtonState === "syncing") return;

      const incrementalOnly = options.incrementalOnly ?? false;
      setSyncButtonState("syncing");
      setStep(
        "connecting",
        incrementalOnly
          ? "Checking for new emails since last sync"
          : "Verifying secure access",
      );

      await beginSyncSession();

      try {
        setStep(
          "scanningPlatforms",
          "LinkedIn, Naukri, Indeed, and your other sources",
        );
        const platformResult = await runPlatformSync({
          fromDate: options.fromDate,
          toDate: options.toDate,
          incrementalOnly,
        });

        setStep(
          "discoveringCompanies",
          platformResult.companiesDiscovered > 0
            ? `${platformResult.companiesDiscovered} companies identified`
            : "Identifying employers from platform emails",
        );

        setStep(
          "searchingCompanyEmails",
          "Recruiter replies and company domain mail",
        );
        const companyResult = await runCompanySync({
          fromDate: options.fromDate,
          toDate: options.toDate,
          incrementalOnly,
        });

        if (companyResult.companiesScanned === 0) {
          setStep("searchingCompanyEmails", "No company domains to search yet");
        } else {
          setStep(
            "searchingCompanyEmails",
            `Scanned ${companyResult.companiesScanned} companies`,
          );
        }

        setStep("finalizing", "Computing stats and updates");
        const syncResult = await finalizeSync({
          fromDate: platformResult.fromDate,
          toDate: platformResult.toDate,
          maxInternalDate: platformResult.maxInternalDate,
          newMessages: platformResult.newMessages,
          skippedProcessed:
            platformResult.skippedProcessed + companyResult.skippedProcessed,
          aiCalls: platformResult.aiCalls + companyResult.aiCalls,
          companyEmailsProcessed: companyResult.companyEmailsProcessed,
          companiesDiscovered: platformResult.companiesDiscovered,
          companiesScanned: companyResult.companiesScanned,
        });

        mergeUserSync(syncResult);
        setStep("complete");
        setSyncButtonState("success");

        try {
          await refreshUser();
        } catch {
          // finalize already persisted; merged sync keeps dashboard in synced state
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
        resetSyncUi();
      } catch (error) {
        if (error instanceof SyncCancelledError) {
          setSyncButtonState("syncing");
          setStep("finalizing", "Saving progress…");
          try {
            try {
              const syncResult = await finalizeSyncStats();
              mergeUserSync(syncResult);
            } catch {
              // Server may have finalized when the sync request was cancelled.
            }
            await refreshUser();
          } catch {
            try {
              await refreshUser();
            } catch {
              // ignore
            }
          }
          resetSyncUi();
          return;
        }

        const wasInitialSync = !user?.sync.hasSynced;
        if (wasInitialSync) {
          setSyncButtonState("syncing");
          setStep("finalizing", "Saving progress…");
          try {
            try {
              const syncResult = await finalizeSyncStats();
              mergeUserSync(syncResult);
            } catch {
              // ignore
            }
            await refreshUser();
          } catch {
            try {
              await refreshUser();
            } catch {
              // ignore
            }
          }
          resetSyncUi();
          return;
        }

        resetSyncUi();
        throw error;
      } finally {
        endSyncSession();
      }
    },
    [mergeUserSync, refreshUser, resetSyncUi, setStep, syncButtonState, user?.sync.hasSynced],
  );

  const runIncrementalSync = useCallback(async () => {
    await runSync({ incrementalOnly: true });
  }, [runSync]);

  const runHistorySync = useCallback(
    async (input: {
      platformIds: string[];
      fromDate: Date;
      toDate: Date;
    }) => {
      await markImportHistorySync();
      await saveJobSources(input.platformIds);
      await refreshUser();
      await runSync({
        fromDate: input.fromDate,
        toDate: input.toDate,
      });
    },
    [refreshUser, runSync],
  );

  const cancelSync = useCallback(async () => {
    await cancelSyncRequest();
  }, []);

  const value = useMemo<SyncContextValue>(
    () => ({
      syncButtonState,
      syncStep,
      syncStepDetail,
      isSyncing:
        syncButtonState === "syncing" || syncButtonState === "success",
      canRunIncrementalSync,
      runSync,
      runIncrementalSync,
      runHistorySync,
      cancelSync,
    }),
    [
      syncButtonState,
      syncStep,
      syncStepDetail,
      canRunIncrementalSync,
      runSync,
      runIncrementalSync,
      runHistorySync,
      cancelSync,
    ],
  );

  return (
    <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
