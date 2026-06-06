import { apiRequest } from "@/lib/api/client";
import type {
  Application,
  ApplicationDetail,
  ManualApplicationStatus,
  UpdateApplicationStatusResult,
} from "@/lib/types/application";

export async function fetchApplications(): Promise<Application[]> {
  return apiRequest<Application[]>("/applications");
}

export async function fetchApplication(id: string): Promise<ApplicationDetail> {
  return apiRequest<ApplicationDetail>(`/applications/${id}`);
}

export async function updateApplicationStatus(
  id: string,
  status: ManualApplicationStatus,
  details?: Record<string, unknown>,
): Promise<UpdateApplicationStatusResult> {
  return apiRequest<UpdateApplicationStatusResult>(`/applications/${id}/status`, {
    method: "PATCH",
    body: { status, ...(details ? { details } : {}) },
  });
}
