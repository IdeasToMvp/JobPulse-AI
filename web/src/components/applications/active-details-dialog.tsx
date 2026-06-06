"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  updateApplicationDetails,
  updateApplicationStatus,
} from "@/lib/api/applications";
import type {
  Application,
  ApplicationDetail,
  ManualApplicationStatus,
} from "@/lib/types/application";
import {
  buildOptionalStatusDetailsPayload,
  buildUserDetailsPatchPayload,
  type UserDetailsFormValues,
} from "@/lib/utils/application";
import { cn } from "@/lib/utils";

export type ActiveDetailsMode = "editOnly" | "statusWithDetails";

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

interface ActiveDetailsDialogProps {
  application: Application | null;
  open: boolean;
  mode?: ActiveDetailsMode;
  targetStatus?: ManualApplicationStatus;
  onClose: () => void;
  onUpdated: (application: ApplicationDetail) => void;
}

export function ActiveDetailsDialog({
  application,
  open,
  mode = "editOnly",
  targetStatus = "active",
  onClose,
  onUpdated,
}: ActiveDetailsDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        mode === "editOnly" ? "Job details" : "Add details (optional)"
      }
      size="md"
    >
      {open && application ? (
        <ActiveDetailsForm
          key={`${application.id}-${mode}`}
          application={application}
          mode={mode}
          targetStatus={targetStatus}
          onClose={onClose}
          onUpdated={onUpdated}
        />
      ) : null}
    </Modal>
  );
}

function ActiveDetailsForm({
  application,
  mode,
  targetStatus,
  onClose,
  onUpdated,
}: {
  application: Application;
  mode: ActiveDetailsMode;
  targetStatus: ManualApplicationStatus;
  onClose: () => void;
  onUpdated: (application: ApplicationDetail) => void;
}) {
  const user = application.userDetails;
  const extracted = application.extractedDetails;
  const isEditOnly = mode === "editOnly";

  const [values, setValues] = useState<UserDetailsFormValues>(() => ({
    location: user?.location ?? extracted?.location ?? "",
    salary: user?.salary ?? extracted?.salary ?? "",
    rounds: user?.numberOfRounds?.toString() ?? "",
    workMode: user?.workMode ?? null,
    notes: user?.notes ?? "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof UserDetailsFormValues>(
    key: K,
    value: UserDetailsFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(includeDetails: boolean) {
    setSubmitting(true);
    setError(null);

    try {
      if (isEditOnly) {
        const details = buildUserDetailsPatchPayload(values);
        const result = await updateApplicationDetails(application.id, details);
        onUpdated(result.application);
        onClose();
        return;
      }

      const details = includeDetails
        ? buildOptionalStatusDetailsPayload(values)
        : undefined;
      const result = await updateApplicationStatus(
        application.id,
        targetStatus,
        details,
      );
      onUpdated(result.application);
      onClose();
    } catch {
      setError(
        isEditOnly
          ? "Failed to update details"
          : "Failed to update status",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex max-h-[min(75dvh,36rem)] flex-col px-5 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="text-sm text-muted-foreground">{application.company}</p>
      {!isEditOnly ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Help track this role — all fields are optional.
        </p>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        <FormField
          label="Location"
          value={values.location}
          placeholder="e.g. Bangalore or Remote"
          onChange={(value) => updateField("location", value)}
        />
        <FormField
          label="Salary"
          value={values.salary}
          placeholder="e.g. ₹18–22 LPA"
          onChange={(value) => updateField("salary", value)}
        />
        <FormField
          label="Number of rounds"
          value={values.rounds}
          placeholder="e.g. 3"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(value) =>
            updateField("rounds", value.replace(/\D/g, ""))
          }
        />

        <div>
          <p className="text-sm text-muted-foreground">Work mode</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WORK_MODES.map((modeOption) => {
              const selected = values.workMode === modeOption;
              return (
                <button
                  key={modeOption}
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    updateField(
                      "workMode",
                      selected ? null : modeOption,
                    )
                  }
                  className={cn(
                    "min-h-10 touch-manipulation rounded-full border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                    selected
                      ? "border-primary/45 bg-primary/10 text-primary"
                      : "border-border bg-white text-foreground hover:border-primary/25",
                  )}
                >
                  {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          label="Notes"
          value={values.notes}
          placeholder="Recruiter, next step, etc."
          multiline
          onChange={(value) => updateField("notes", value)}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-4 shrink-0 space-y-2">
        {isEditOnly ? (
          <>
            <Button
              fullWidth
              className="min-h-11"
              disabled={submitting}
              onClick={() => void submit(true)}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              className="min-h-11"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </Button>
          </>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              className="min-h-11"
              disabled={submitting}
              onClick={() => void submit(false)}
            >
              Skip
            </Button>
            <Button
              fullWidth
              className="min-h-11"
              disabled={submitting}
              onClick={() => void submit(true)}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  placeholder,
  multiline,
  inputMode,
  pattern,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  inputMode?: "numeric";
  pattern?: string;
  onChange: (value: string) => void;
}) {
  const className =
    "mt-1.5 min-h-11 w-full touch-manipulation rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, "min-h-[5.5rem] resize-y")}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </label>
  );
}
