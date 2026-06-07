import { BadRequestException } from '@nestjs/common';
import { JobPlatformId } from '../users/job-platforms';
import {
  NAUKRI_APPLY_FROM,
  NAUKRI_STATUS_SUBJECT_QUERY,
  isNaukriStatusSubject,
} from './naukri-status.parser';

export { NAUKRI_APPLY_FROM };

export const PLATFORM_INCLUDES: Record<JobPlatformId, string[]> = {
  linkedin: ['linkedin'],
  naukri: [NAUKRI_APPLY_FROM],
  indeed: ['indeed'],
  instahyre: ['instahyre'],
  wellfound: ['wellfound', 'angel.co'],
  foundit: ['foundit', 'monster'],
  glassdoor: ['glassdoor'],
  career_pages: ['application received', 'thank you for applying', 'your application'],
  referrals: ['referral', 'referred you', 'employee referral'],
};

/** Job boards win over generic career-page subject matches (e.g. LinkedIn apply mail). */
export const JOB_BOARD_PLATFORM_IDS: JobPlatformId[] = [
  'linkedin',
  'naukri',
  'indeed',
  'instahyre',
  'wellfound',
  'foundit',
  'glassdoor',
];

/** Sync processes specific senders before broad subject-only sources. */
export const PLATFORM_SYNC_ORDER: JobPlatformId[] = [
  ...JOB_BOARD_PLATFORM_IDS,
  'referrals',
  'career_pages',
];

export function sortPlatformsForSync(platformIds: string[]): JobPlatformId[] {
  const selected = new Set(platformIds);
  const ordered = PLATFORM_SYNC_ORDER.filter((id) => selected.has(id));
  for (const id of platformIds) {
    if (!ordered.includes(id as JobPlatformId)) {
      ordered.push(id as JobPlatformId);
    }
  }
  return ordered;
}

function matchesJobBoardPlatform(from: string, subject: string): boolean {
  const haystack = `${from} ${subject}`.toLowerCase();
  return JOB_BOARD_PLATFORM_IDS.some((platformId) =>
    PLATFORM_INCLUDES[platformId].some((token) =>
      haystack.includes(token.toLowerCase()),
    ),
  );
}

/** MVP cap — limits history sync window to reduce Gmail + AI volume. */
export const MAX_SYNC_RANGE_DAYS = 10;
export const GMAIL_OVERLAP_DAYS = 1;

export function buildGmailQuery(
  platformId: JobPlatformId,
  fromDate: Date,
  toDate: Date,
  options?: { afterCursor?: Date },
): string {
  const after = options?.afterCursor
    ? formatGmailAfterInstant(options.afterCursor)
    : `after:${formatGmailDate(fromDate)}`;
  const before = formatGmailDate(addDays(toDate, 1));

  if (platformId === 'naukri') {
    return `(from:${NAUKRI_APPLY_FROM} subject:"${NAUKRI_STATUS_SUBJECT_QUERY}") ${after} before:${before}`;
  }

  const tokens = PLATFORM_INCLUDES[platformId];
  const includesClause = tokens
    .map((token) => {
      if (token.includes(' ')) {
        return `subject:"${token}"`;
      }
      return `(from:${token} OR subject:${token})`;
    })
    .join(' OR ');

  return `(${includesClause}) ${after} before:${before}`;
}

export function matchesPlatform(
  from: string,
  subject: string,
  platformId: JobPlatformId,
): boolean {
  if (platformId === 'naukri') {
    return (
      from.toLowerCase().includes(NAUKRI_APPLY_FROM) &&
      isNaukriStatusSubject(subject)
    );
  }

  const haystack = `${from} ${subject}`.toLowerCase();

  if (platformId === 'career_pages' && matchesJobBoardPlatform(from, subject)) {
    return false;
  }

  return PLATFORM_INCLUDES[platformId].some((token) =>
    haystack.includes(token.toLowerCase()),
  );
}

export function resolveSyncDateRange(input?: {
  fromDate?: string;
  toDate?: string;
}): { fromDate: Date; toDate: Date } {
  const today = startOfUtcDay(new Date());
  const defaultFrom = addDays(today, -MAX_SYNC_RANGE_DAYS);

  const toDate = input?.toDate
    ? startOfUtcDay(new Date(input.toDate))
    : today;

  const fromDate = input?.fromDate
    ? startOfUtcDay(new Date(input.fromDate))
    : defaultFrom;

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new BadRequestException('Invalid date range');
  }

  if (fromDate > toDate) {
    throw new BadRequestException('fromDate must be on or before toDate');
  }

  if (toDate > today) {
    throw new BadRequestException('toDate cannot be in the future');
  }

  const earliestAllowed = addDays(today, -MAX_SYNC_RANGE_DAYS);
  if (fromDate < earliestAllowed) {
    throw new BadRequestException(
      `Sync is limited to the last ${MAX_SYNC_RANGE_DAYS} days`,
    );
  }

  const spanDays = Math.floor(
    (toDate.getTime() - fromDate.getTime()) / 86_400_000,
  );
  if (spanDays > MAX_SYNC_RANGE_DAYS) {
    throw new BadRequestException(
      `Date range cannot exceed ${MAX_SYNC_RANGE_DAYS} days`,
    );
  }

  return { fromDate, toDate };
}

export function resolveIncrementalFromDate(
  cursor: Date | undefined,
  rangeFrom: Date,
): Date {
  if (!cursor) return rangeFrom;
  const overlap = addDays(cursor, -GMAIL_OVERLAP_DAYS);
  return overlap > rangeFrom ? overlap : rangeFrom;
}

export function resolveAutoSyncDateRange(cursor: Date): {
  fromDate: Date;
  toDate: Date;
} {
  const today = startOfUtcDay(new Date());
  return {
    fromDate: startOfUtcDay(cursor),
    toDate: today,
  };
}

/** Gmail after: with date only ignores time — use epoch seconds for incremental sync. */
export function formatGmailAfterInstant(instant: Date): string {
  return `after:${Math.floor(instant.getTime() / 1000)}`;
}

export function isAfterSyncCursor(
  messageDate: Date,
  cursor: Date,
): boolean {
  return messageDate.getTime() > cursor.getTime();
}

export function formatGmailDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
