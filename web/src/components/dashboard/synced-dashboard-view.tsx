"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import { useState } from "react";

import { DashboardSyncButton } from "@/components/dashboard/dashboard-sync-button";
import { PlatformBreakdown } from "@/components/dashboard/platform-breakdown";
import { StatGrid } from "@/components/dashboard/stat-card";
import { SyncOptionsDialog } from "@/components/dashboard/sync-options-dialog";
import { SyncPrepareDialog } from "@/components/dashboard/sync-prepare-dialog";
import { Card } from "@/components/ui/card";
import type { UserProfile } from "@/lib/types/user";
import {
  formatLastSync,
  getGreetingPeriod,
  showNoResultsMessage,
} from "@/lib/utils/dashboard";
import { buildStatCards } from "@/lib/utils/dashboard-stats";

function NoResultsCard() {
  return (
    <Card padding="md" className="border-secondary/20 bg-secondary/5">
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sync completed. No job-related emails were found for your selected
          sources in the last 10 days. Try different sources or use Sync new
          emails after more mail arrives.
        </p>
      </div>
    </Card>
  );
}

interface DashboardHeaderProps {
  user: UserProfile;
  onSyncClick: () => void;
}

function DashboardHeader({ user, onSyncClick }: DashboardHeaderProps) {
  const firstName = user.name.split(" ")[0] || "there";
  const period = getGreetingPeriod();
  const lastSync = formatLastSync(user.sync.lastSyncedAt);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {user.picture ? (
          <Image
            src={user.picture}
            alt={user.name}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/10"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Good {period}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your job search snapshot.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <DashboardSyncButton onClick={onSyncClick} />
        <p className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-[11px]">
          Last sync: {lastSync}
        </p>
      </div>
    </div>
  );
}

interface SyncedDashboardViewProps {
  user: UserProfile;
}

export function SyncedDashboardView({ user }: SyncedDashboardViewProps) {
  const [syncOptionsOpen, setSyncOptionsOpen] = useState(false);
  const [syncPrepareOpen, setSyncPrepareOpen] = useState(false);
  const noResults = showNoResultsMessage(user);

  return (
    <>
      <div className="space-y-5 pb-2 sm:space-y-6">
        <DashboardHeader
          user={user}
          onSyncClick={() => setSyncOptionsOpen(true)}
        />

        {noResults ? (
          <NoResultsCard />
        ) : (
          <>
            <StatGrid stats={buildStatCards(user.sync)} />
            <PlatformBreakdown sync={user.sync} />
          </>
        )}
      </div>

      <SyncOptionsDialog
        open={syncOptionsOpen}
        onClose={() => setSyncOptionsOpen(false)}
        onRescanHistory={() => setSyncPrepareOpen(true)}
      />

      <SyncPrepareDialog
        open={syncPrepareOpen}
        onClose={() => setSyncPrepareOpen(false)}
      />
    </>
  );
}
