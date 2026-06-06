"use client";

import {
  Calendar,
  CalendarDays,
  History,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PlatformGrid } from "@/components/platforms/platform-grid";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/auth-context";
import { jobPlatforms } from "@/lib/constants/job-platforms";
import { getPlatformLabel } from "@/lib/constants/platform-labels";
import { useSync } from "@/lib/sync/sync-context";
import {
  type DateRangePreset,
  formatSyncDate,
  getDateRangeFromPreset,
} from "@/lib/sync/sync-types";

interface SyncPrepareDialogProps {
  open: boolean;
  onClose: () => void;
  initialPlatformIds?: string[];
  skipSourcesStep?: boolean;
}

type Step = "sources" | "dateRange";

export function SyncPrepareDialog({
  open,
  onClose,
  initialPlatformIds,
  skipSourcesStep = false,
}: SyncPrepareDialogProps) {
  const { user } = useAuth();
  const { runHistorySync } = useSync();
  const [step, setStep] = useState<Step>(
    skipSourcesStep ? "dateRange" : "sources",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(
        initialPlatformIds?.length
          ? initialPlatformIds
          : (user?.jobSources ?? []),
      ),
  );
  const [preset, setPreset] = useState<DateRangePreset>("last30Days");
  const [isSaving, setIsSaving] = useState(false);

  const { fromDate, toDate } = useMemo(
    () => getDateRangeFromPreset(preset),
    [preset],
  );

  function togglePlatform(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    if (isSaving) return;
    setStep(skipSourcesStep ? "dateRange" : "sources");
    onClose();
  }

  async function handleStartSync() {
    if (selectedIds.size === 0 || isSaving) return;
    setIsSaving(true);
    onClose();

    try {
      await runHistorySync({
        platformIds: [...selectedIds],
        fromDate,
        toDate,
      });
    } catch {
      // sync context resets; user can retry from dashboard
    } finally {
      setIsSaving(false);
    }
  }

  const stepIndex = step === "sources" ? 1 : 2;
  const selectedLabels = [...selectedIds].map(getPlatformLabel).join(", ");

  return (
    <Modal open={open} onClose={handleClose} size="lg" className="sm:max-w-xl">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-5 pt-5">
          <div className="mb-4 flex items-center gap-2">
            <StepDot active={stepIndex >= 1} label="1" />
            <div
              className={`h-0.5 flex-1 ${stepIndex >= 2 ? "bg-secondary" : "bg-border"}`}
            />
            <StepDot active={stepIndex >= 2} label="2" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
          {step === "sources" ? (
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
                Choose scan range
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                How far back should we look for job-related emails?
              </p>

              <div className="mt-5 space-y-2.5">
                <DateOption
                  title="Last 30 days"
                  subtitle="Quick scan of recent activity"
                  icon={Calendar}
                  selected={preset === "last30Days"}
                  onSelect={() => setPreset("last30Days")}
                />
                <DateOption
                  title="Last 3 months"
                  subtitle="Good for an active job search"
                  icon={CalendarDays}
                  selected={preset === "last3Months"}
                  onSelect={() => setPreset("last3Months")}
                />
                <DateOption
                  title="Last 1 year"
                  subtitle="Maximum allowed scan window"
                  icon={History}
                  selected={preset === "last1Year"}
                  onSelect={() => setPreset("last1Year")}
                />
              </div>

              <div className="mt-5 rounded-xl border border-border bg-purple-50 p-3.5">
                <p className="text-xs text-muted-foreground">Scanning period</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatSyncDate(fromDate)} → {formatSyncDate(toDate)}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {selectedIds.size} source
                  {selectedIds.size === 1 ? "" : "s"}: {selectedLabels}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          {step === "sources" ? (
            <Button
              fullWidth
              size="lg"
              disabled={selectedIds.size === 0}
              onClick={() => setStep("dateRange")}
            >
              Continue
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={isSaving}
                onClick={() => setStep("sources")}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="flex-[2]"
                disabled={isSaving}
                onClick={() => void handleStartSync()}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Start Sync"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
        active ? "bg-primary text-white" : "bg-border text-muted-foreground"
      }`}
    >
      {label}
    </div>
  );
}

function DateOption({
  title,
  subtitle,
  icon: Icon,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  icon: typeof Calendar;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-colors ${
        selected
          ? "border-secondary bg-secondary/5 ring-1 ring-secondary/20"
          : "border-border hover:border-primary/30"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-secondary/15" : "bg-purple-100"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${selected ? "text-secondary" : "text-primary"}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div
        className={`h-5 w-5 rounded-full border-2 ${
          selected ? "border-secondary bg-secondary" : "border-border"
        }`}
      />
    </button>
  );
}
