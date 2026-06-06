"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ConnectGmailView } from "@/components/dashboard/connect-gmail-view";
import { DashboardSyncingView } from "@/components/dashboard/dashboard-syncing-view";
import { SyncedDashboardView } from "@/components/dashboard/synced-dashboard-view";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { isSyncing } = useSync();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSyncing) {
    return <DashboardSyncingView />;
  }

  if (!user.sync.hasSynced) {
    return <ConnectGmailView user={user} />;
  }

  return <SyncedDashboardView user={user} />;
}
