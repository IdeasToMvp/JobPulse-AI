"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createManualApplication } from "@/lib/api/applications";
import { MANUAL_APPLICATION_STATUSES } from "@/lib/constants/application-status";
import { jobPlatforms } from "@/lib/constants/job-platforms";
import type {
  ApplicationDetail,
  ManualApplicationStatus,
} from "@/lib/types/application";
import type { UserSyncState } from "@/lib/types/user";
import {
  buildUserDetailsPatchPayload,
  type UserDetailsFormValues,
} from "@/lib/utils/application";
import { cn } from "@/lib/utils";

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

interface AddApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (application: ApplicationDetail, sync: UserSyncState) => void;
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddApplicationDialog({
  open,
  onClose,
  onCreated,
}: AddApplicationDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Add application" size="md">
      {open ? (
        <AddApplicationForm
          key="add-application-form"
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </Modal>
  );
}

function AddApplicationForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (application: ApplicationDetail, sync: UserSyncState) => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [platformId, setPlatformId] = useState(jobPlatforms[0]?.id ?? "linkedin");
  const [status, setStatus] = useState<ManualApplicationStatus>("applied");
  const [appliedAt, setAppliedAt] = useState(todayInputValue);
  const [details, setDetails] = useState<UserDetailsFormValues>({
    location: "",
    salary: "",
    rounds: "",
    workMode: null,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      company.trim().length > 0 &&
      role.trim().length > 0 &&
      platformId.length > 0 &&
      appliedAt.length > 0,
    [appliedAt, company, platformId, role],
  );

  function updateDetail<K extends keyof UserDetailsFormValues>(
    key: K,
    value: UserDetailsFormValues[K],
  ) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const optionalDetails = buildUserDetailsPatchPayload(details);
      const hasDetails =
        optionalDetails.location ||
        optionalDetails.salary ||
        optionalDetails.notes ||
        optionalDetails.numberOfRounds != null ||
        optionalDetails.workMode;

      const result = await createManualApplication({
        company: company.trim(),
        role: role.trim(),
        platformId,
        status,
        appliedAt,
        details: hasDetails ? optionalDetails : undefined,
      });

      onCreated(result.application, result.sync);
      onClose();
    } catch {
      setError("Could not save application. Check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex max-h-[min(80dvh,40rem)] flex-col px-5 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="text-sm text-muted-foreground">
        Track a role you applied to outside Gmail sync.
      </p>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        <FormField
          label="Company"
          required
          value={company}
          placeholder="e.g. Acme Corp"
          onChange={setCompany}
        />
        <FormField
          label="Role"
          required
          value={role}
          placeholder="e.g. Senior Product Manager"
          onChange={setRole}
        />

        <div>
          <p className="text-sm text-muted-foreground">
            Source <span className="text-error">*</span>
          </p>
          <select
            value={platformId}
            onChange={(event) => setPlatformId(event.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/40"
          >
            {jobPlatforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Status <span className="text-error">*</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MANUAL_APPLICATION_STATUSES.map((option) => {
              const selected = status === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={submitting}
                  onClick={() => setStatus(option)}
                  className={cn(
                    "min-h-10 touch-manipulation rounded-full border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                    selected
                      ? "border-primary/45 bg-primary/10 text-primary"
                      : "border-border bg-white text-foreground hover:border-primary/25",
                  )}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          label="Applied date"
          required
          type="date"
          value={appliedAt}
          max={todayInputValue()}
          onChange={setAppliedAt}
        />

        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground">Optional details</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Location, compensation, and notes help you compare roles later.
          </p>
        </div>

        <FormField
          label="Location"
          value={details.location}
          placeholder="e.g. Bangalore or Remote"
          onChange={(value) => updateDetail("location", value)}
        />
        <FormField
          label="Salary"
          value={details.salary}
          placeholder="e.g. ₹18–22 LPA"
          onChange={(value) => updateDetail("salary", value)}
        />
        <FormField
          label="Number of rounds"
          value={details.rounds}
          placeholder="e.g. 3"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(value) =>
            updateDetail("rounds", value.replace(/\D/g, ""))
          }
        />

        <div>
          <p className="text-sm text-muted-foreground">Work mode</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WORK_MODES.map((modeOption) => {
              const selected = details.workMode === modeOption;
              return (
                <button
                  key={modeOption}
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    updateDetail(
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
          value={details.notes}
          placeholder="Recruiter, referral, next step, etc."
          multiline
          onChange={(value) => updateDetail("notes", value)}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-4 shrink-0 space-y-2">
        <Button
          fullWidth
          className="min-h-11"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save application"
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
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  placeholder,
  required,
  multiline,
  type = "text",
  max,
  inputMode,
  pattern,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  type?: "text" | "date";
  max?: string;
  inputMode?: "numeric";
  pattern?: string;
  onChange: (value: string) => void;
}) {
  const className =
    "mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/40";

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </p>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, "min-h-[5.5rem] resize-none")}
        />
      ) : (
        <input
          type={type}
          value={value}
          max={max}
          inputMode={inputMode}
          pattern={pattern}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, "min-h-11")}
        />
      )}
    </div>
  );
}
