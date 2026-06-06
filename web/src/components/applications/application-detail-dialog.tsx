"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { Button } from "@/components/ui/button";
import { fetchApplication } from "@/lib/api/applications";
import { formatStatusLabel } from "@/lib/constants/application-status";
import { getPlatformLabel } from "@/lib/constants/platform-labels";
import type { Application, ApplicationDetail } from "@/lib/types/application";
import {
  formatApplicationDate,
  formatSalaryDisplay,
  formatWorkMode,
  hasExtractedDetails,
  hasUserDetails,
} from "@/lib/utils/application";

interface ApplicationDetailContentProps {
  application: Application;
  onUpdateStatus: () => void;
  onEditDetails: () => void;
}

function ApplicationDetailContent({
  application,
  onUpdateStatus,
  onEditDetails,
}: ApplicationDetailContentProps) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchApplication(application.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load application details.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [application.id]);

  const data = detail ?? application;
  const userDetails = data.userDetails;
  const showUserSection = hasUserDetails(userDetails);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-error">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {data.role ? (
            <p className="text-base font-semibold leading-snug break-words text-foreground sm:text-lg">
              {data.role}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {getPlatformLabel(data.platformId)}
          </p>
        </div>
        <ApplicationStatusBadge status={data.status} className="self-start" />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        <DetailField label="Source" value={getPlatformLabel(data.platformId)} />
        <DetailField
          label="Applied"
          value={formatApplicationDate(data.appliedAt)}
        />
        <DetailField
          label="Last updated"
          value={formatApplicationDate(data.updatedAt)}
        />
      </div>

      {showUserSection ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              Your details
            </p>
            <button
              type="button"
              onClick={onEditDetails}
              className="min-h-10 touch-manipulation text-sm font-semibold text-secondary hover:underline"
            >
              Edit details
            </button>
          </div>
          <div className="space-y-2">
            {userDetails?.location ? (
              <DetailField label="Location" value={userDetails.location} />
            ) : null}
            {userDetails?.salary ? (
              <DetailField
                label="Salary"
                value={formatSalaryDisplay(userDetails.salary)}
              />
            ) : null}
            {userDetails?.numberOfRounds != null ? (
              <DetailField
                label="Rounds"
                value={String(userDetails.numberOfRounds)}
              />
            ) : null}
            {userDetails?.workMode ? (
              <DetailField
                label="Work mode"
                value={formatWorkMode(userDetails.workMode)}
              />
            ) : null}
            {userDetails?.notes ? (
              <DetailField label="Notes" value={userDetails.notes} />
            ) : null}
          </div>
        </section>
      ) : (
        <Button
          variant="ghost"
          className="min-h-11 px-0 text-secondary hover:bg-transparent hover:underline"
          onClick={onEditDetails}
        >
          Add details
        </Button>
      )}

      {hasExtractedDetails(data.extractedDetails) ? (
        <section>
          <p className="mb-2 text-sm font-semibold text-foreground">
            From email
          </p>
          <div className="space-y-2">
            {data.extractedDetails?.role ? (
              <DetailField label="Role" value={data.extractedDetails.role} />
            ) : null}
            {data.extractedDetails?.salary ? (
              <DetailField
                label="Salary"
                value={formatSalaryDisplay(data.extractedDetails.salary)}
              />
            ) : null}
            {data.extractedDetails?.location ? (
              <DetailField
                label="Location"
                value={data.extractedDetails.location}
              />
            ) : null}
            {data.extractedDetails?.employmentType ? (
              <DetailField
                label="Type"
                value={data.extractedDetails.employmentType}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {(data.companyApplyCount ?? 0) > 1 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            At this company
          </p>
          <p className="mt-1 text-sm font-semibold">
            {data.companyApplyCount} applications tracked
          </p>
          {data.companyRoles?.length ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {data.companyRoles.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {detail?.statusHistory?.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status history
          </p>
          <div className="space-y-2">
            {detail.statusHistory.map((entry) => (
              <div
                key={`${entry.changedAt}-${entry.status}`}
                className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-2"
              >
                <span className="font-medium">
                  {formatStatusLabel(entry.status)}
                </span>
                <span className="text-xs text-muted-foreground sm:text-right">
                  {formatApplicationDate(entry.changedAt)} · {entry.source}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Button fullWidth className="min-h-11" onClick={onUpdateStatus}>
        Update status
      </Button>
    </div>
  );
}

interface ApplicationDetailDialogProps {
  application: Application | null;
  open: boolean;
  refreshKey?: number;
  onClose: () => void;
  onUpdateStatus: () => void;
  onEditDetails: (application: Application) => void;
}

export function ApplicationDetailDialog({
  application,
  open,
  refreshKey = 0,
  onClose,
  onUpdateStatus,
  onEditDetails,
}: ApplicationDetailDialogProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={application?.company ?? "Application"}
    >
      {application ? (
        <ApplicationDetailContent
          key={`${application.id}-${refreshKey}`}
          application={application}
          onUpdateStatus={onUpdateStatus}
          onEditDetails={() => onEditDetails(application)}
        />
      ) : null}
    </ModalShell>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[85dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 flex-col items-center border-b border-border px-5 pt-3 pb-0 sm:pt-0">
          <div
            aria-hidden
            className="mb-3 h-1 w-10 rounded-full bg-border sm:hidden"
          />
          <div className="flex w-full items-center justify-between gap-3 py-3 sm:py-4">
            <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 shrink-0 touch-manipulation rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Close
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
