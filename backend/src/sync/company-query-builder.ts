import { formatGmailDate, addDays, formatGmailAfterInstant } from './platform-filters';
import { buildPlatformExclusionClause } from './company-domain-hints';

export const MAX_COMPANIES_PER_SYNC = 50;
export const MAX_MESSAGES_PER_COMPANY = 100;
export const MAX_QUERY_PARTS = 12;

export interface CompanySearchTarget {
  companyId: string;
  canonicalName: string;
  domains: string[];
  recruiterEmails: string[];
}

export function buildCompanyGmailQueries(
  target: CompanySearchTarget,
  fromDate: Date,
  toDate: Date,
  options?: { afterCursor?: Date },
): string[] {
  const parts: string[] = [];
  for (const domain of target.domains) {
    parts.push(`from:@${domain}`);
  }
  for (const email of target.recruiterEmails) {
    parts.push(`from:${email}`);
  }

  if (parts.length === 0) return [];

  const after = options?.afterCursor
    ? formatGmailAfterInstant(options.afterCursor)
    : `after:${formatGmailDate(fromDate)}`;
  const before = formatGmailDate(addDays(toDate, 1));
  const queries: string[] = [];

  for (let i = 0; i < parts.length; i += MAX_QUERY_PARTS) {
    const batch = parts.slice(i, i + MAX_QUERY_PARTS);
    const exclusion = buildPlatformExclusionClause();
    queries.push(
      `(${batch.join(' OR ')}) after:${after} before:${before} -(${exclusion})`,
    );
  }

  return queries;
}
