"use client";

import { Briefcase, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ActiveDetailsDialog } from "@/components/applications/active-details-dialog";
import { AddApplicationDialog } from "@/components/applications/add-application-dialog";
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
import type { Application, ApplicationDetail, StatusFilterId } from "@/lib/types/application";
import type { UserProfile, UserSyncState } from "@/lib/types/user";
import { filterApplications } from "@/lib/utils/application";
import { formatLastSync } from "@/lib/utils/dashboard";

export function ApplicationsView() {
  const { user, refreshUser, mergeUserSync } = useAuth();

  if (!user) return null;

  return (
    <SyncedApplicationsContent
      user={user}
      refreshUser={refreshUser}
      mergeUserSync={mergeUserSync}
    />
  );
}

function SyncedApplicationsContent({
  user,
  refreshUser,
  mergeUserSync,
}: {
  user: UserProfile;
  refreshUser: () => Promise<void>;
  mergeUserSync: (sync: UserSyncState) => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("applied");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Application | null>(null);
  const [activeDetailsOpen, setActiveDetailsOpen] = useState(false);
  const [activeDetailsApp, setActiveDetailsApp] = useState<Application | null>(
    null,
  );
  const [activeDetailsMode, setActiveDetailsMode] = useState<
    "editOnly" | "statusWithDetails"
  >("editOnly");
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [syncOptionsOpen, setSyncOptionsOpen] = useState(false);
  const [syncPrepareOpen, setSyncPrepareOpen] = useState(false);
  const [addApplicationOpen, setAddApplicationOpen] = useState(false);

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
  }, [user.sync.lastSyncedAt, user.sync.appliedCount]);

  function reloadApplications() {
    setIsLoading(true);
    setError(null);

    void fetchApplications()
      .then(setApplications)
      .catch(() => setError("Failed to load applications"))
      .finally(() => setIsLoading(false));
  }

  function handleApplicationCreated(
    created: ApplicationDetail,
    sync: UserSyncState,
  ) {
    setApplications((current) => [created, ...current]);
    mergeUserSync(sync);
    void refreshUser();
  }

  function handleApplicationUpdated(updated: ApplicationDetail) {
    setApplications((current) =>
      current.map((app) => (app.id === updated.id ? updated : app)),
    );
    setSelectedApp((current) =>
      current?.id === updated.id ? updated : current,
    );
    setStatusTarget((current) =>
      current?.id === updated.id ? updated : current,
    );
    setDetailRefreshKey((current) => current + 1);
    void refreshUser();
  }

  function openEditDetails(app: Application) {
    setActiveDetailsApp(app);
    setActiveDetailsMode("editOnly");
    setActiveDetailsOpen(true);
  }

  function openActiveStatusDetails(app: Application) {
    setActiveDetailsApp(app);
    setActiveDetailsMode("statusWithDetails");
    setActiveDetailsOpen(true);
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
        refreshKey={detailRefreshKey}
        onClose={() => setDetailOpen(false)}
        onUpdateStatus={() => {
          if (!selectedApp) return;
          setDetailOpen(false);
          openStatusUpdate(selectedApp);
        }}
        onEditDetails={openEditDetails}
      />

      <UpdateStatusDialog
        application={statusTarget}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onUpdated={handleApplicationUpdated}
        onMoveToActive={openActiveStatusDetails}
      />

      <ActiveDetailsDialog
        application={activeDetailsApp}
        open={activeDetailsOpen}
        mode={activeDetailsMode}
        onClose={() => setActiveDetailsOpen(false)}
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

      <AddApplicationDialog
        open={addApplicationOpen}
        onClose={() => setAddApplicationOpen(false)}
        onCreated={handleApplicationCreated}
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
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          applicationsCount={0}
          onSyncClick={() => setSyncOptionsOpen(true)}
          onAddClick={() => setAddApplicationOpen(true)}
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

  const filtered = filterApplications(applications, statusFilter, searchQuery);
  const activeFilterLabel =
    STATUS_FILTERS.find((filter) => filter.id === statusFilter)?.label ?? "";
  const countsAheadOfList =
    user.sync.appliedCount > 0 && applications.length === 0;

  if (applications.length === 0) {
    return (
      <>
        <ApplicationsPageShell
          user={user}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          applicationsCount={0}
          onSyncClick={() => setSyncOptionsOpen(true)}
          onAddClick={() => setAddApplicationOpen(true)}
        >
          <Card padding="md" className="text-center">
            <p className="text-sm text-muted-foreground">
              {countsAheadOfList
                ? "Sync was stopped before the list finished loading. Tap refresh to load applications found so far."
                : "No applications yet. Add one manually or sync Gmail to import from your inbox."}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {!countsAheadOfList ? (
                <Button
                  className="min-h-11"
                  onClick={() => setAddApplicationOpen(true)}
                >
                  Add application
                </Button>
              ) : null}
              {countsAheadOfList ? (
                <Button className="min-h-11" onClick={reloadApplications}>
                  Refresh list
                </Button>
              ) : null}
            </div>
          </Card>
        </ApplicationsPageShell>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <ApplicationsPageShell
        user={user}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        applicationsCount={applications.length}
        onSyncClick={() => setSyncOptionsOpen(true)}
        onAddClick={() => setAddApplicationOpen(true)}
      >
        {filtered.length === 0 ? (
          <Card padding="md" className="text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `No results for "${searchQuery}".`
                : `No applications with status "${activeFilterLabel}".`}
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
  searchQuery,
  onSearchChange,
  applicationsCount,
  onSyncClick,
  onAddClick,
  children,
}: {
  user: UserProfile;
  statusFilter: StatusFilterId;
  onFilterChange: (filter: StatusFilterId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  applicationsCount: number;
  onSyncClick: () => void;
  onAddClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              Applications
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
              {applicationsCount} total · filter by pipeline stage
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-10 gap-1.5 px-3"
                onClick={onAddClick}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <DashboardSyncButton onClick={onSyncClick} />
            </div>
            <p className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-[11px]">
              Last sync: {formatLastSync(user.sync.lastSyncedAt)}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company or role…"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          {searchQuery.length > 0 ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
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
