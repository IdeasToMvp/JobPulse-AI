"use client";

import {
  Check,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/account/confirm-dialog";
import { EditJobSourcesDialog } from "@/components/account/edit-job-sources-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  clearAllData,
  saveJobSources,
  updateSyncSettings,
} from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { getPlatformLabel } from "@/lib/constants/platform-labels";
import {
  SYNC_FREQUENCY_OPTIONS,
  syncFrequencyFromMinutes,
} from "@/lib/constants/sync-frequency";
import { formatNextScheduledSync } from "@/lib/utils/account";
import { formatLastSync } from "@/lib/utils/dashboard";
import { cn } from "@/lib/utils";

type Banner = { type: "success" | "error"; message: string };

export function AccountView() {
  const router = useRouter();
  const { user, refreshUser, signOut } = useAuth();

  const [banner, setBanner] = useState<Banner | null>(null);
  const [savingSync, setSavingSync] = useState(false);
  const [savingSources, setSavingSources] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const syncFrequency = syncFrequencyFromMinutes(
    user.syncSettings.syncFrequencyMinutes,
  );
  const isGmailConnected = true;
  const nextSyncLabel = formatNextScheduledSync(
    user.syncSettings.autoSyncEnabled,
    user.syncSettings.syncFrequencyMinutes,
    user.sync.lastSyncedAt,
  );

  async function persistSyncSettings(
    autoSyncEnabled: boolean,
    syncFrequencyMinutes: number,
  ) {
    setSavingSync(true);
    try {
      await updateSyncSettings({ autoSyncEnabled, syncFrequencyMinutes });
      await refreshUser();
    } catch {
      setBanner({ type: "error", message: "Failed to save sync settings" });
    } finally {
      setSavingSync(false);
    }
  }

  async function handleAutoSyncChange(enabled: boolean) {
    await persistSyncSettings(enabled, user!.syncSettings.syncFrequencyMinutes);
  }

  async function handleFrequencyChange(minutes: number) {
    await persistSyncSettings(user!.syncSettings.autoSyncEnabled, minutes);
  }

  async function handleSaveSources(platformIds: string[]) {
    setSavingSources(true);
    try {
      await saveJobSources(platformIds);
      await refreshUser();
      setSourcesOpen(false);
      setBanner({ type: "success", message: "Job sources updated" });
    } catch {
      setBanner({ type: "error", message: "Failed to save job sources" });
    } finally {
      setSavingSources(false);
    }
  }

  async function handleDeleteData() {
    setClearingData(true);
    try {
      await clearAllData();
      await refreshUser();
      setDeleteStep(0);
      setBanner({ type: "success", message: "All synced data has been cleared" });
    } catch {
      setBanner({ type: "error", message: "Failed to clear data" });
    } finally {
      setClearingData(false);
    }
  }

  async function handleSignOut() {
    setSignOutOpen(false);
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-4 pb-8 sm:space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Account
          </h1>
        </div>

        {banner ? (
          <div
            role="status"
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              banner.type === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error",
            )}
          >
            {banner.message}
          </div>
        ) : null}

        <Card>
          <div className="flex items-center gap-4">
            {user.picture ? (
              <Image
                src={user.picture}
                alt={user.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/30 text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
              {user.memberSince ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Member since {user.memberSince}
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <AccountSection title="Gmail Connection">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <span className="text-lg font-extrabold text-[#EA4335]">M</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground">
                  {isGmailConnected ? "Connected" : "Not connected"}
                </p>
                {isGmailConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </AccountSection>

        <AccountSection title="Sync Settings">
          <div className="space-y-4">
            <ToggleRow
              title="Auto Sync"
              subtitle="Automatically scan Gmail for new job updates."
              checked={user.syncSettings.autoSyncEnabled}
              disabled={savingSync}
              onChange={(value) => void handleAutoSyncChange(value)}
            />

            <div className="border-t border-border pt-4">
              <label
                htmlFor="sync-frequency"
                className="text-sm text-muted-foreground"
              >
                Sync Frequency
              </label>
              <select
                id="sync-frequency"
                value={syncFrequency.minutes}
                disabled={savingSync}
                onChange={(event) =>
                  void handleFrequencyChange(Number(event.target.value))
                }
                className="mt-2 min-h-11 w-full touch-manipulation rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {SYNC_FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.minutes} value={option.minutes}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <InfoRow label="Last Sync" value={formatLastSync(user.sync.lastSyncedAt)} />
            <InfoRow label="Next Scheduled Sync" value={nextSyncLabel} />
          </div>
        </AccountSection>

        <AccountSection title="Job Sources">
          <div className="space-y-3">
            {user.jobSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No job sources selected yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {user.jobSources.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span className="text-sm font-medium text-foreground">
                      {getPlatformLabel(id)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="outline"
              fullWidth
              className="min-h-11 border-secondary/40 text-secondary hover:bg-secondary/5"
              onClick={() => setSourcesOpen(true)}
            >
              Edit Sources
            </Button>
          </div>
        </AccountSection>

        <AccountSection title="Privacy">
          <Button
            variant="outline"
            fullWidth
            className="min-h-11 border-error/50 text-error hover:bg-error/5"
            onClick={() => setDeleteStep(1)}
          >
            Delete All Data
          </Button>
        </AccountSection>

        <AccountSection title="Session">
          <Button
            variant="outline"
            fullWidth
            className="min-h-11 border-error/50 text-error hover:bg-error/5"
            onClick={() => setSignOutOpen(true)}
          >
            Sign Out
          </Button>
        </AccountSection>
      </div>

      <EditJobSourcesDialog
        open={sourcesOpen}
        selectedIds={user.jobSources}
        saving={savingSources}
        onClose={() => setSourcesOpen(false)}
        onSave={(ids) => void handleSaveSources(ids)}
      />

      <ConfirmDialog
        open={signOutOpen}
        title="Sign out?"
        description="You will need to sign in with Google again to access your dashboard."
        confirmLabel="Sign Out"
        destructive
        onConfirm={() => void handleSignOut()}
        onCancel={() => setSignOutOpen(false)}
      />

      <ConfirmDialog
        open={deleteStep === 1}
        title="Delete all synced data?"
        description={
          "This permanently removes everything JobPulse AI has synced from your Gmail:\n\n" +
          "• Processed emails\n" +
          "• Job applications and their statuses\n" +
          "• Dashboard stats and platform breakdowns\n\n" +
          "Your Google sign-in and job source preferences are kept. This action cannot be undone."
        }
        confirmLabel="Delete all data"
        destructive
        onConfirm={() => setDeleteStep(2)}
        onCancel={() => setDeleteStep(0)}
      />

      <ConfirmDialog
        open={deleteStep === 2}
        title="Are you sure?"
        description="All synced job tracking data will be erased from your account."
        confirmLabel="Yes, delete everything"
        cancelLabel="Keep data"
        destructive
        loading={clearingData}
        onConfirm={() => void handleDeleteData()}
        onCancel={() => setDeleteStep(0)}
      />
    </>
  );
}

function AccountSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h2>
      <Card>{children}</Card>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  subtitle?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 touch-manipulation rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-secondary/35" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full shadow transition-transform",
            checked
              ? "translate-x-5 bg-secondary"
              : "bg-white",
          )}
        />
      </button>
    </div>
  );
}
