import { ApplicationStatus } from '../applications/application.entity';

export interface DiscoveredCompanyRecord {
  id: string;
  userId: string;
  canonicalName: string;
  normalizedKey: string;
  primaryPlatformId?: string;
  applicationStatus?: ApplicationStatus;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface CompanyDomainRecord {
  id: string;
  userId: string;
  companyId: string;
  domain: string;
  source: string;
  confidence: number;
}

export interface CompanyRecruiterRecord {
  id: string;
  userId: string;
  companyId: string;
  email: string;
  displayName?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface CompanyForPhase2 {
  id: string;
  canonicalName: string;
  applicationStatus?: string;
  domains: string[];
  recruiterEmails: string[];
}

export interface PlatformSyncResponse {
  newMessages: number;
  skippedProcessed: number;
  aiCalls: number;
  companiesDiscovered: number;
  maxInternalDate?: string;
  fromDate: string;
  toDate: string;
}

export interface CompanySyncResponse {
  companyEmailsProcessed: number;
  skippedProcessed: number;
  aiCalls: number;
  companiesScanned: number;
  fromDate: string;
  toDate: string;
}

export interface FinalizeSyncDto {
  fromDate?: string;
  toDate?: string;
  maxInternalDate?: string;
  newMessages?: number;
  skippedProcessed?: number;
  aiCalls?: number;
  companyEmailsProcessed?: number;
  companiesDiscovered?: number;
  companiesScanned?: number;
}

export interface SyncCursorState {
  maxInternalDate?: Date;
  fromDate: Date;
  toDate: Date;
  newMessages: number;
  skippedProcessed: number;
  aiCalls: number;
  companyEmailsProcessed: number;
  companiesDiscovered: number;
  companiesScanned: number;
}
