"use client";

import { Activity, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ActivityFilters } from "@/components/activity/activity-filters";
import { ActivityTimelineItem } from "@/components/activity/activity-timeline-item";
import { ActiveDetailsDialog } from "@/components/applications/active-details-dialog";
import { ApplicationDetailDialog } from "@/components/applications/application-detail-dialog";
import { UpdateStatusDialog } from "@/components/applications/update-status-dialog";
import { Button } from "@/components/ui/button";
import { fetchActivities } from "@/lib/api/activities";
import { fetchApplications } from "@/lib/api/applications";
import { useAuth } from "@/lib/auth/auth-context";
import { ACTIVITY_FILTERS } from "@/lib/constants/activity-filters";
import type { ActivityFilterId, ActivityItem } from "@/lib/types/activity";
import type { Application, ApplicationDetail } from "@/lib/types/application";
import { groupActivityItems } from "@/lib/utils/activity";

const PAGE_SIZE = 20;

export function ActivityView() {
  const { user } = useAuth();

  if (!user) return null;

  if (!user.sync.hasSynced) {
    return (
      <EmptyState message="No activity yet. Connect Gmail and start tracking applications." />
    );
  }

  return (
    <SyncedActivityContent key={user.sync.lastSyncedAt ?? "pending"} />
  );
}

function SyncedActivityContent() {
  const { refreshUser } = useAuth();
  const [filter, setFilter] = useState<ActivityFilterId>("all");
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [applicationsById, setApplicationsById] = useState<
    Record<string, Application>
  >({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activeDetailsOpen, setActiveDetailsOpen] = useState(false);
  const [activeDetailsApp, setActiveDetailsApp] = useState<Application | null>(
    null,
  );
  const [activeDetailsMode, setActiveDetailsMode] = useState<
    "editOnly" | "statusWithDetails"
  >("editOnly");
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const loadApplications = useCallback(async () => {
    try {
      const apps = await fetchApplications();
      setApplicationsById(Object.fromEntries(apps.map((app) => [app.id, app])));
    } catch {
      // optional — detail tap simply won't work without cache
    }
  }, []);

  const fetchAndApplyPage = useCallback(
    async (
      mode: "refresh" | "more",
      activeFilter: ActivityFilterId,
      offset: number,
    ) => {
      const page = await fetchActivities({
        filter: activeFilter,
        offset,
        limit: PAGE_SIZE,
      });

      setItems((current) =>
        mode === "refresh" ? page.items : [...current, ...page.items],
      );
      offsetRef.current =
        mode === "refresh" ? page.items.length : offset + page.items.length;
      setHasMore(page.hasMore);
      setError(null);
    },
    [],
  );

  const loadPage = useCallback(
    async (mode: "refresh" | "more", activeFilter?: ActivityFilterId) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const filterToUse = activeFilter ?? filter;
      const isRefresh = mode === "refresh";
      const offset = isRefresh ? 0 : offsetRef.current;

      if (isRefresh) {
        setError(null);
        setHasMore(false);
        if (hasLoadedOnceRef.current) {
          setFilterLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      try {
        if (isRefresh) {
          await loadApplications();
        }

        await fetchAndApplyPage(mode, filterToUse, offset);
      } catch {
        setError("Failed to load activity");
      } finally {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
        setFilterLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [filter, fetchAndApplyPage, loadApplications],
  );

  useEffect(() => {
    let cancelled = false;
    offsetRef.current = 0;

    void (async () => {
      loadingRef.current = true;
      try {
        await loadApplications();
        const page = await fetchActivities({
          filter,
          offset: 0,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;

        setItems(page.items);
        offsetRef.current = page.items.length;
        setHasMore(page.hasMore);
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load activity");
      } finally {
        if (!cancelled) {
          hasLoadedOnceRef.current = true;
          setInitialLoading(false);
          loadingRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; remount key handles sync refresh
  }, []);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || filterLoading || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current) {
          void loadPage("more");
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filterLoading, initialLoading, loadPage, items.length]);

  function handleFilterChange(next: ActivityFilterId) {
    if (next === filter || filterLoading) return;
    offsetRef.current = 0;
    setFilter(next);
    void loadPage("refresh", next);
  }

  function handleApplicationUpdated(updated: ApplicationDetail) {
    setApplicationsById((current) => ({
      ...current,
      [updated.id]: updated,
    }));
    setSelectedApp((current) =>
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

  function handleActivityTap(item: ActivityItem) {
    if (!item.applicationId) return;
    const application = applicationsById[item.applicationId];
    if (!application) return;
    setSelectedApp(application);
    setDetailOpen(true);
  }

  const emptyMessage = error
    ? error
    : filter === "all"
      ? "No activity yet. Sync Gmail to start building your timeline."
      : `No ${ACTIVITY_FILTERS.find((f) => f.id === filter)?.label.toLowerCase() ?? "items"} yet.`;

  const groups = groupActivityItems(items);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 pb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              Activity
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
              Your job search timeline
            </p>
          </div>

          <ActivityFilters
            activeFilter={filter}
            disabled={filterLoading}
            onChange={handleFilterChange}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {initialLoading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filterLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error || items.length === 0 ? (
            <InlineEmpty message={emptyMessage} onRetry={error ? () => void loadPage("refresh") : undefined} />
          ) : (
            <div className="space-y-5 pb-2">
              {groups.map((group) => (
                <section key={group.label}>
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </h2>
                  <div>
                    {group.items.map((item, index) => (
                      <ActivityTimelineItem
                        key={item.id}
                        item={item}
                        isLast={index === group.items.length - 1}
                        onClick={
                          item.applicationId
                            ? () => handleActivityTap(item)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}

              {loadingMore ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : null}

              {hasMore ? <div ref={loadMoreRef} className="h-4" aria-hidden /> : null}
            </div>
          )}
        </div>
      </div>

      <ApplicationDetailDialog
        application={selectedApp}
        open={detailOpen}
        refreshKey={detailRefreshKey}
        onClose={() => setDetailOpen(false)}
        onUpdateStatus={() => {
          if (!selectedApp) return;
          setDetailOpen(false);
          setStatusDialogOpen(true);
        }}
        onEditDetails={openEditDetails}
      />

      <UpdateStatusDialog
        application={selectedApp}
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
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center px-4 py-8 text-center sm:min-h-[50vh]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 sm:h-14 sm:w-14">
        <Activity className="h-6 w-6 text-secondary/70 sm:h-7 sm:w-7" />
      </div>
      <h1 className="text-xl font-semibold sm:text-2xl">Activity</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function InlineEmpty({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center px-4 py-8 text-center">
      <Activity className="mb-3 h-10 w-10 text-secondary/45" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-4 min-h-11" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
