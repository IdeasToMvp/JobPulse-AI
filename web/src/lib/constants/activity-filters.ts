import type { ActivityFilterId } from "@/lib/types/activity";

export const ACTIVITY_FILTERS: Array<{ id: ActivityFilterId; label: string }> =
  [
    { id: "all", label: "All" },
    { id: "application", label: "Applications" },
    { id: "status_update", label: "Status Updates" },
    { id: "suggestion", label: "Suggestions" },
    { id: "sync", label: "Syncs" },
  ];
