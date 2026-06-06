import { apiRequest } from "@/lib/api/client";
import type { UserProfile } from "@/lib/types/user";

export async function saveJobSources(
  platformIds: string[],
): Promise<UserProfile> {
  const data = await apiRequest<{ user: UserProfile }>("/users/job-sources", {
    method: "PUT",
    body: { platformIds },
  });
  return data.user;
}

export async function markImportHistorySync(): Promise<void> {
  await apiRequest("/users/initial-sync/import-history", { method: "POST" });
}

export async function setupNewOnlySync(
  platformIds: string[],
): Promise<UserProfile> {
  const data = await apiRequest<{ user: UserProfile }>(
    "/users/initial-sync/new-only",
    {
      method: "POST",
      body: { platformIds },
    },
  );
  return data.user;
}
