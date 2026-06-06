"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  MANUAL_APPLICATION_STATUSES,
  formatStatusLabel,
} from "@/lib/constants/application-status";
import { updateApplicationStatus } from "@/lib/api/applications";
import type {
  Application,
  ApplicationDetail,
  ManualApplicationStatus,
} from "@/lib/types/application";

interface UpdateStatusDialogProps {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (application: ApplicationDetail) => void;
  onMoveToActive: (application: Application) => void;
}

export function UpdateStatusDialog({
  application,
  open,
  onClose,
  onUpdated,
  onMoveToActive,
}: UpdateStatusDialogProps) {
  const [pendingStatus, setPendingStatus] =
    useState<ManualApplicationStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application) return null;

  async function handleSelect(status: ManualApplicationStatus) {
    if (!application || status === application.status || isSubmitting) return;

    const confirmed = window.confirm(
      `Change status from ${formatStatusLabel(application.status)} to ${formatStatusLabel(status)}?`,
    );
    if (!confirmed) return;

    if (status === "active" && application.status === "applied") {
      onClose();
      onMoveToActive(application);
      return;
    }

    setPendingStatus(status);
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateApplicationStatus(application.id, status);
      onUpdated(result.application);
      onClose();
    } catch {
      setError("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
      setPendingStatus(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Update status" size="sm">
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-semibold">{application.company}</p>
            {application.role ? (
              <p className="truncate text-sm text-muted-foreground">
                {application.role}
              </p>
            ) : null}
          </div>
          <ApplicationStatusBadge
            status={application.status}
            className="self-start sm:self-auto"
          />
        </div>

        <div className="space-y-2">
          {MANUAL_APPLICATION_STATUSES.map((status) => {
            const isCurrent = application.status === status;
            const isLoading = isSubmitting && pendingStatus === status;

            return (
              <button
                key={status}
                type="button"
                disabled={isCurrent || isSubmitting}
                onClick={() => void handleSelect(status)}
                className="flex min-h-12 w-full touch-manipulation items-center justify-between rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/40 active:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-sm font-medium">
                  {formatStatusLabel(status)}
                </span>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isCurrent ? (
                  <span className="text-xs text-muted-foreground">Current</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

        <Button variant="outline" fullWidth className="mt-4 min-h-11" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
