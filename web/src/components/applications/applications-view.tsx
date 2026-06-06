"use client";

import { Briefcase, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ApplicationCard } from "@/components/applications/application-card";
import { ApplicationDetailDialog } from "@/components/applications/application-detail-dialog";
import { ApplicationStatusFilters } from "@/components/applications/application-status-filters";
import { UpdateStatusDialog } from "@/components/applications/update-status-dialog";
import { DashboardSyncButton } from "@/components/dashboard/dashboard-sync-button";
import { SyncOptionsDialog } from "@/components/dashboard/sync-options-dialog";
import { SyncPrepareDialog } from "@/components/dashboard/sync-prepare-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchApplications } from "@/lib/api/applications";
import { useAuth } from "@/lib/auth/auth-context";
import { STATUS_FILTERS } from "@/lib/constants/application-status";
import type { Application, StatusFilterId } from "@/lib/types/application";
import type { UserProfile } from "@/lib/types/user";
import { filterApplications } from "@/lib/utils/application";
import { formatLastSync } from "@/lib/utils/dashboard";

export function ApplicationsView() {
  const { user, refreshUser } = useAuth();

  if (!user) return null;

  if (!user.sync.hasSynced) {
    return (
      <EmptyState message="Sync Gmail to start tracking your job applications." />
    );
  }

  return (
    <SyncedApplicationsContent user={user} refreshUser={refreshUser} />
  );
}

function SyncedApplicationsContent({
  user,
  refreshUser,
}: {
  user: UserProfile;
  refreshUser: () => Promise<void>;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("applied");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Application | null>(null);
  const [syncOptionsOpen, setSyncOptionsOpen] = useState(false);
  const [syncPrepareOpen, setSyncPrepareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchApplications()
      .then((apps) => {
        if (!cancelled) {
          setApplications(apps);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load applications");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user.sync.lastSyncedAt]);

  function reloadApplications() {
    setIsLoading(true);
    setError(null);

    void fetchApplications()
      .then(setApplications)
      .catch(() => setError("Failed to load applications"))
      .finally(() => setIsLoading(false));
  }

  function handleApplicationUpdated(updated: Application) {
    setApplications((current) =>
      current.map((app) => (app.id === updated.id ? updated : app)),
    );
    setSelectedApp((current) =>
      current?.id === updated.id ? updated : current,
    );
    void refreshUser();
  }

  function openDetail(app: Application) {
    setSelectedApp(app);
    setDetailOpen(true);
  }

  function openStatusUpdate(app: Application) {
    setStatusTarget(app);
    setStatusDialogOpen(true);
  }

  const dialogs = (
    <>
      <ApplicationDetailDialog
        application={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdateStatus={() => {
          if (!selectedApp) return;
          setDetailOpen(false);
          openStatusUpdate(selectedApp);
        }}
      />

      <UpdateStatusDialog
        application={statusTarget}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onUpdated={handleApplicationUpdated}
      />

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

  if (isLoading) {
    return (
      <>
        <ApplicationsPageShell
          user={user}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          applicationsCount={0}
          onSyncClick={() => setSyncOptionsOpen(true)}
        >
          <div className="flex min-h-[12rem] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </ApplicationsPageShell>
        {dialogs}
      </>
    );
  }

  if (error) {
    return (
      <>
        <EmptyState message={error} onRetry={reloadApplications} />
        {dialogs}
      </>
    );
  }

  if (applications.length === 0) {
    return (
      <>
        <EmptyState message="No applications found for your selected sources." />
        {dialogs}
      </>
    );
  }

  const filtered = filterApplications(applications, statusFilter);
  const activeFilterLabel =
    STATUS_FILTERS.find((filter) => filter.id === statusFilter)?.label ?? "";

  return (
    <>
      <ApplicationsPageShell
        user={user}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        applicationsCount={applications.length}
        onSyncClick={() => setSyncOptionsOpen(true)}
      >
        {filtered.length === 0 ? (
          <Card padding="md" className="text-center">
            <p className="text-sm text-muted-foreground">
              No applications with status &quot;{activeFilterLabel}&quot;.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 pb-1 sm:gap-3 md:grid-cols-2">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onClick={() => openDetail(app)}
                onStatusClick={() => openStatusUpdate(app)}
              />
            ))}
          </div>
        )}
      </ApplicationsPageShell>

      {dialogs}
    </>
  );
}

function ApplicationsPageShell({
  user,
  statusFilter,
  onFilterChange,
  applicationsCount,
  onSyncClick,
  children,
}: {
  user: UserProfile;
  statusFilter: StatusFilterId;
  onFilterChange: (filter: StatusFilterId) => void;
  applicationsCount: number;
  onSyncClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-4 pb-4 sm:space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              Applications
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
              {applicationsCount} total · filter by pipeline stage
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <DashboardSyncButton onClick={onSyncClick} />
            <p className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-[11px]">
              Last sync: {formatLastSync(user.sync.lastSyncedAt)}
            </p>
          </div>
        </div>

        <ApplicationStatusFilters
          activeFilter={statusFilter}
          sync={user.sync}
          onChange={onFilterChange}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}

function EmptyState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center px-4 py-8 text-center sm:min-h-[50vh] sm:px-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 sm:h-14 sm:w-14">
        <Briefcase className="h-6 w-6 text-secondary/70 sm:h-7 sm:w-7" />
      </div>
      <h1 className="text-xl font-semibold sm:text-2xl">Applications</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-4 min-h-11" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
