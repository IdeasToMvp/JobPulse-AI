import { apiRequest } from "@/lib/api/client";
import type {
  Application,
  ApplicationDetail,
  ApplicationUserDetails,
  ManualApplicationStatus,
  UpdateApplicationDetailsResult,
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
  details?: ApplicationUserDetails,
): Promise<UpdateApplicationStatusResult> {
  return apiRequest<UpdateApplicationStatusResult>(`/applications/${id}/status`, {
    method: "PATCH",
    body: { status, ...(details ? { details } : {}) },
  });
}

export async function updateApplicationDetails(
  id: string,
  details: ApplicationUserDetails,
): Promise<UpdateApplicationDetailsResult> {
  return apiRequest<UpdateApplicationDetailsResult>(`/applications/${id}/details`, {
    method: "PATCH",
    body: { details },
  });
}
