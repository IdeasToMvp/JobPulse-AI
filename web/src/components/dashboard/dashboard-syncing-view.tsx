"use client";

import { Check, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSync } from "@/lib/sync/sync-context";
import {
  SYNC_PROGRESS_STEPS,
  getSyncProgressFraction,
  getSyncProgressStepIndex,
  getSyncTaskLabel,
} from "@/lib/sync/sync-types";

export function DashboardSyncingView() {
  const {
    syncButtonState,
    syncStep,
    syncStepDetail,
    cancelSync,
  } = useSync();

  const isSyncing = syncButtonState === "syncing";
  const isDone =
    syncStep === "complete" || syncButtonState === "success";
  const stepIndex = getSyncProgressStepIndex(syncStep);
  const progress = getSyncProgressFraction(syncStep);
  const progressPercent = Math.round(Math.min(progress, 1) * 100);
  const taskLabel = getSyncTaskLabel(syncStep, syncButtonState);

  return (
    <div className="space-y-5 pb-2 sm:space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        JobPulseAI is scanning your inbox in two phases: job platforms first,
        then company and recruiter mail.
      </p>

      <Card padding="md">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Current task
        </p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground">{taskLabel}</h2>
            {syncStepDetail ? (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {syncStepDetail}
              </p>
            ) : null}
          </div>
          {isSyncing && !isDone ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-secondary" />
          ) : (
            <span className="text-2xl font-bold text-secondary">
              {progressPercent}%
            </span>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full bg-secondary transition-all ${
              isSyncing && !isDone ? "animate-pulse" : ""
            }`}
            style={{ width: `${isDone ? 100 : progressPercent}%` }}
          />
        </div>
      </Card>

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Sync progress
        </p>
        <div className="space-y-2">
          {SYNC_PROGRESS_STEPS.map((step, index) => {
            const done = isDone || index < stepIndex;
            const active = !isDone && index === stepIndex && isSyncing;

            return (
              <Card key={step.title} padding="sm">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      done || active
                        ? "border-secondary/35 bg-secondary/10"
                        : "border-border bg-muted"
                    }`}
                  >
                    {done ? (
                      <Check className="h-4 w-4 text-secondary" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/60" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        done || active
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {isSyncing && !isDone ? (
        <div className="space-y-2">
          <Button
            variant="outline"
            fullWidth
            className="border-error text-error hover:bg-error/5"
            onClick={() => void cancelSync()}
          >
            Stop sync
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Stopping tells the server to halt immediately and saves whatever
            was processed so far.
          </p>
        </div>
      ) : null}
    </div>
  );
}
