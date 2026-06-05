export const VALID_JOB_PLATFORM_IDS = [
  'linkedin',
  'naukri',
  'indeed',
  'instahyre',
  'wellfound',
  'foundit',
  'glassdoor',
  'career_pages',
  'referrals',
] as const;

export type JobPlatformId = (typeof VALID_JOB_PLATFORM_IDS)[number];

export function assertValidPlatformIds(ids: string[]): void {
  const invalid = ids.filter(
    (id) => !VALID_JOB_PLATFORM_IDS.includes(id as JobPlatformId),
  );
  if (invalid.length > 0) {
    throw new Error(`Invalid platform ids: ${invalid.join(', ')}`);
  }
}
