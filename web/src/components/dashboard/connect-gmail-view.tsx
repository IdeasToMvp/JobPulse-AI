"use client";

import Image from "next/image";
import { Info, Mail, Shield } from "lucide-react";
import { useState } from "react";

import { InitialConnectDialog } from "@/components/dashboard/initial-connect-dialog";
import { SyncPrepareDialog } from "@/components/dashboard/sync-prepare-dialog";
import { StatGrid } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserProfile } from "@/lib/types/user";
import { getGreetingPeriod } from "@/lib/utils/dashboard";
import { buildStatCards } from "@/lib/utils/dashboard-stats";

interface ConnectGmailViewProps {
  user: UserProfile;
}

export function ConnectGmailView({ user }: ConnectGmailViewProps) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [importPlatformIds, setImportPlatformIds] = useState<string[]>([]);

  return (
    <>
      <div className="space-y-4 pb-2 sm:space-y-5">
        <ConnectDashboardHeader
          user={user}
          onConnect={() => setConnectOpen(true)}
        />

        <div className="opacity-90">
          <StatGrid stats={buildStatCards(user.sync)} />
        </div>

        <Card padding="md" className="border-secondary/20 bg-secondary/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  Connect Gmail to populate your dashboard
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Import past applications or track new emails only. We scan
                  job-related messages from LinkedIn, Indeed, Naukri, and your
                  other sources — personal mail stays private.
                </p>
              </div>
            </div>
            <Button
              size="md"
              className="h-11 shrink-0 sm:px-5"
              onClick={() => setConnectOpen(true)}
            >
              <Mail className="h-4 w-4" />
              Connect Gmail
            </Button>
          </div>
        </Card>
      </div>

      <InitialConnectDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onImportHistory={(platformIds) => {
          setImportPlatformIds(platformIds);
          setPrepareOpen(true);
        }}
      />

      <SyncPrepareDialog
        key={importPlatformIds.join(",")}
        open={prepareOpen}
        onClose={() => setPrepareOpen(false)}
        initialPlatformIds={importPlatformIds}
        skipSourcesStep
      />
    </>
  );
}

function ConnectDashboardHeader({
  user,
  onConnect,
}: {
  user: UserProfile;
  onConnect: () => void;
}) {
  const firstName = user.name.split(" ")[0] || "there";
  const period = getGreetingPeriod();

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

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <Button size="md" className="h-10 gap-1.5 px-3.5" onClick={onConnect}>
          <Mail className="h-3.5 w-3.5" />
          Connect Gmail
        </Button>
        <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Shield className="h-3 w-3" />
          OAuth 2.0
        </p>
      </div>
    </div>
  );
}
