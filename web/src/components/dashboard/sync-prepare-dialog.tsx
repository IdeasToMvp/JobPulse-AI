"use client";

import { Clock, Info } from "lucide-react";
import { useState } from "react";

import { PlatformGrid } from "@/components/platforms/platform-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/auth-context";
import { jobPlatforms } from "@/lib/constants/job-platforms";
import { getPlatformLabel } from "@/lib/constants/platform-labels";
import { useSync } from "@/lib/sync/sync-context";
import {
  MVP_SYNC_RANGE_DAYS,
  formatSyncDate,
  getMvpSyncDateRange,
} from "@/lib/sync/sync-types";

interface SyncPrepareDialogProps {
  open: boolean;
  onClose: () => void;
  initialPlatformIds?: string[];
  skipSourcesStep?: boolean;
}

export function SyncPrepareDialog({
  open,
  onClose,
  initialPlatformIds,
  skipSourcesStep = false,
}: SyncPrepareDialogProps) {
  const { user } = useAuth();
  const { runHistorySync } = useSync();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(
        initialPlatformIds?.length
          ? initialPlatformIds
          : (user?.jobSources ?? []),
      ),
  );
  const { fromDate, toDate } = getMvpSyncDateRange();

  function togglePlatform(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    onClose();
  }

  function handleStartSync() {
    if (selectedIds.size === 0) return;
    onClose();
    void runHistorySync({
      platformIds: [...selectedIds],
      fromDate,
      toDate,
    }).catch(() => {
      // sync context resets; user can retry from dashboard
    });
  }

  const selectedLabels = [...selectedIds].map(getPlatformLabel).join(", ");

  return (
    <Modal open={open} onClose={handleClose} size="lg" className="sm:max-w-xl">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {!skipSourcesStep ? (
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Select job sources
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We only scan emails related to the platforms you choose.
              </p>
              <p className="mt-2 text-xs font-medium text-secondary">
                {selectedIds.size} selected
              </p>
              <div className="mt-4">
                <PlatformGrid
                  platforms={jobPlatforms}
                  selectedIds={selectedIds}
                  onToggle={togglePlatform}
                  compact
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Ready to sync
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We&apos;ll scan your selected sources for job-related emails
                from the last {MVP_SYNC_RANGE_DAYS} days.
              </p>
            </div>
          )}

          <Card padding="md" className="mt-5 border-secondary/20 bg-secondary/5">
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Last {MVP_SYNC_RANGE_DAYS} days only (MVP)
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatSyncDate(fromDate)} → {formatSyncDate(toDate)}
                </p>
                {selectedIds.size > 0 ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {selectedIds.size} source
                    {selectedIds.size === 1 ? "" : "s"}: {selectedLabels}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>

          <div className="mt-3 flex gap-2 rounded-xl border border-border bg-purple-50 px-3.5 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Longer scan windows are disabled for now to keep sync fast and
              reduce AI usage. Use &quot;Sync new emails&quot; after your first
              sync for ongoing updates.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          <Button
            fullWidth
            size="lg"
            disabled={selectedIds.size === 0}
            onClick={handleStartSync}
          >
            Start Sync
          </Button>
        </div>
      </div>
    </Modal>
  );
}
