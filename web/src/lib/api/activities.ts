import { apiRequest } from "@/lib/api/client";
import type { ActivityFilterId, ActivityPage } from "@/lib/types/activity";

export async function fetchActivities(params: {
  filter?: ActivityFilterId;
  offset?: number;
  limit?: number;
}): Promise<ActivityPage> {
  const search = new URLSearchParams();
  search.set("type", params.filter ?? "all");
  search.set("offset", String(params.offset ?? 0));
  search.set("limit", String(params.limit ?? 20));

  return apiRequest<ActivityPage>(`/activities?${search.toString()}`);
}
