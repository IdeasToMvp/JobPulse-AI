"use client";

import {
  CheckCircle2,
  Circle,
  History,
  Loader2,
  Mail,
} from "lucide-react";
import { useState } from "react";

import { PlatformGrid } from "@/components/platforms/platform-grid";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { setupNewOnlySync, markImportHistorySync, saveJobSources } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { jobPlatforms } from "@/lib/constants/job-platforms";
import { cn } from "@/lib/utils";

type ConnectMode = "trackNew" | "importHistory";
type Step = "mode" | "sources";

interface InitialConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onImportHistory: (platformIds: string[]) => void;
}

export function InitialConnectDialog({
  open,
  onClose,
  onImportHistory,
}: InitialConnectDialogProps) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<ConnectMode | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(user?.jobSources ?? []),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (isSaving) return;
    setStep("mode");
    setMode(null);
    setError(null);
    onClose();
  }

  function togglePlatform(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinueFromSources() {
    if (selectedIds.size === 0 || !mode || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const platformIds = [...selectedIds];

      if (mode === "trackNew") {
        await setupNewOnlySync(platformIds);
        await refreshUser();
        handleClose();
        return;
      }

      await markImportHistorySync();
      await saveJobSources(platformIds);
      handleClose();
      onImportHistory(platformIds);
    } catch {
      setError("Setup failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Connect Gmail" size="lg">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2 pb-4">
          {step === "mode" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  How should we start?
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Import past applications or only track new emails going
                  forward.
                </p>
              </div>

              <ModeOption
                title="Track new emails only"
                subtitle="Start from today. Future job emails sync on your schedule."
                icon={Mail}
                selected={mode === "trackNew"}
                onSelect={() => setMode("trackNew")}
              />
              <ModeOption
                title="Import existing job history"
                subtitle="Scan past emails from LinkedIn, Indeed, and your other sources."
                icon={History}
                selected={mode === "importHistory"}
                onSelect={() => setMode("importHistory")}
              />
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                Select job sources
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "trackNew"
                  ? "We will watch these platforms for new job-related emails."
                  : "We only scan emails related to the platforms you choose."}
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
          )}

          {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === "mode" ? (
            <Button
              fullWidth
              size="lg"
              disabled={!mode}
              onClick={() => setStep("sources")}
            >
              Continue
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="min-h-12 flex-1"
                disabled={isSaving}
                onClick={() => setStep("mode")}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="min-h-12 flex-[2]"
                disabled={isSaving || selectedIds.size === 0}
                onClick={() => void handleContinueFromSources()}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === "trackNew" ? (
                  "Start tracking"
                ) : (
                  "Choose scan range"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ModeOption({
  title,
  subtitle,
  icon: Icon,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  icon: typeof Mail;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full touch-manipulation items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-secondary bg-secondary/5 ring-1 ring-secondary/20"
          : "border-border bg-white hover:border-primary/20",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-secondary/15" : "bg-purple-100",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            selected ? "text-secondary" : "text-primary",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {selected ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
      )}
    </button>
  );
}
