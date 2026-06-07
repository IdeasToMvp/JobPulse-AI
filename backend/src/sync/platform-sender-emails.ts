import { JobPlatformId } from '../users/job-platforms';

/**
 * Known sender addresses per job source. Add new emails here as they are confirmed.
 * When non-empty, Gmail sync uses `from:` filters instead of broad subject/domain matching.
 */
export const PLATFORM_SENDER_EMAILS: Record<
  JobPlatformId,
  readonly string[]
> = {
  linkedin: ['jobs-noreply@linkedin.com'],
  naukri: ['info@naukri.com'],
  indeed: ['indeedapply@indeed.com'],
  instahyre: [],
  wellfound: [],
  foundit: [],
  glassdoor: [],
  career_pages: [],
  referrals: [],
};

/** Apply-confirmation keywords — checked on subject (sender sources) or subject+body. */
export const PLATFORM_APPLY_KEYWORDS: Record<
  JobPlatformId,
  readonly string[]
> = {
  linkedin: [
    'your application was sent',
    'application was sent to',
    'you applied to',
  ],
  naukri: ['status of your job application'],
  indeed: ['indeed application:'],
  instahyre: [
    'application submitted',
    'successfully applied',
    'thank you for applying',
    'your application',
  ],
  wellfound: [
    'application submitted',
    'successfully applied',
    'thank you for applying',
    'your application',
  ],
  foundit: [
    'application received',
    'successfully applied',
    'thank you for applying',
  ],
  glassdoor: [
    'application received',
    'successfully applied',
    'thank you for applying',
  ],
  career_pages: [
    'application received',
    'thank you for applying',
    'your application',
    'successfully applied',
  ],
  referrals: ['referral', 'referred you', 'employee referral'],
};

/** Skip emails that match these even if apply keywords hit. */
export const PLATFORM_EXCLUDE_KEYWORDS: Record<
  JobPlatformId,
  readonly string[]
> = {
  linkedin: [
    'job alert',
    'jobs for you',
    'recommended for you',
    'viewed your profile',
    'new jobs matching',
  ],
  naukri: [],
  indeed: ['verification code to apply', 'confirm your email'],
  instahyre: ['newsletter', 'digest'],
  wellfound: ['digest', 'newsletter'],
  foundit: ['job alert'],
  glassdoor: ['job alert', 'salary estimate', 'company review'],
  career_pages: ['newsletter', 'unsubscribe'],
  referrals: [],
};

/** Fallback subject phrases when no sender emails are configured yet. */
export const PLATFORM_SUBJECT_PHRASES: Record<
  JobPlatformId,
  readonly string[]
> = {
  linkedin: [],
  naukri: [],
  indeed: [],
  instahyre: ['instahyre'],
  wellfound: ['wellfound', 'angel.co'],
  foundit: ['foundit', 'monster'],
  glassdoor: ['glassdoor'],
  career_pages: [
    'application received',
    'thank you for applying',
    'your application',
  ],
  referrals: ['referral', 'referred you', 'employee referral'],
};

export function matchesPlatformSender(
  from: string,
  platformId: JobPlatformId,
): boolean {
  const emails = PLATFORM_SENDER_EMAILS[platformId];
  if (emails.length === 0) return false;

  const fromLower = from.toLowerCase();
  return emails.some((email) => fromLower.includes(email.toLowerCase()));
}

export function buildSenderFromClause(platformId: JobPlatformId): string | null {
  const emails = PLATFORM_SENDER_EMAILS[platformId];
  if (emails.length === 0) return null;

  return emails.map((email) => `from:${email}`).join(' OR ');
}

export function usesSenderEmailFilter(platformId: JobPlatformId): boolean {
  return PLATFORM_SENDER_EMAILS[platformId].length > 0;
}

export function isExcludedPlatformEmail(
  subject: string,
  body: string,
  platformId: JobPlatformId,
): boolean {
  const haystack = `${subject} ${body}`.toLowerCase();
  return PLATFORM_EXCLUDE_KEYWORDS[platformId].some((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );
}

export function matchesPlatformApplyKeywords(
  subject: string,
  body: string,
  platformId: JobPlatformId,
): boolean {
  if (isExcludedPlatformEmail(subject, body, platformId)) {
    return false;
  }

  const keywords = PLATFORM_APPLY_KEYWORDS[platformId];
  if (keywords.length === 0) {
    return true;
  }

  const haystack = `${subject} ${body}`.toLowerCase();
  return keywords.some((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );
}

export function matchesPlatformApplyKeywordsSubject(
  subject: string,
  platformId: JobPlatformId,
): boolean {
  return matchesPlatformApplyKeywords(subject, '', platformId);
}
