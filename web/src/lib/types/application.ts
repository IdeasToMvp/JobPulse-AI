export type ApplicationStatus =
  | "applied"
  | "active"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected"
  | "ghosted"
  | "unknown";

export type ManualApplicationStatus =
  | "applied"
  | "active"
  | "interview"
  | "offer"
  | "rejected";

export interface ApplicationExtractedDetails {
  company?: string;
  role?: string;
  salary?: string;
  location?: string;
  employmentType?: string;
  source: string;
  confidence?: number;
}

export interface ApplicationUserDetails {
  location?: string;
  salary?: string;
  numberOfRounds?: number;
  workMode?: "remote" | "hybrid" | "onsite";
  notes?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  company: string;
  role?: string;
  status: ApplicationStatus;
  platformId: string;
  appliedAt: string;
  lastMessageAt?: string;
  updatedAt: string;
  extractedDetails?: ApplicationExtractedDetails;
  userDetails?: ApplicationUserDetails;
  companyApplyCount?: number;
  companyRoles?: string[];
}

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changedAt: string;
  source: "sync" | "user";
}

export interface CompanyApplicationSummary {
  id: string;
  role?: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ApplicationDetail extends Application {
  statusHistory: StatusHistoryEntry[];
  companyApplications?: CompanyApplicationSummary[];
}

export interface UpdateApplicationStatusResult {
  application: ApplicationDetail;
  sync: Record<string, unknown>;
}

export interface UpdateApplicationDetailsResult {
  application: ApplicationDetail;
}

export type StatusFilterId =
  | "applied"
  | "active"
  | "interview"
  | "offer"
  | "rejected"
  | "ghosted";
