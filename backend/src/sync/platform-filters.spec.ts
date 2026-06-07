import {
  buildGmailQuery,
  formatGmailAfterInstant,
  isAfterSyncCursor,
  matchesPlatform,
  resolveAutoSyncDateRange,
  resolveSyncDateRange,
  sortPlatformsForSync,
} from './platform-filters';

describe('platform-filters', () => {
  it('builds includes-style Gmail query for naukri', () => {
    const query = buildGmailQuery(
      'naukri',
      new Date('2024-06-05'),
      new Date('2025-06-05'),
    );
    expect(query).toContain('from:info@naukri.com');
    expect(query).toContain('subject:"Status of your job application"');
    expect(query).toContain('after:2024/06/05');
  });

  it('builds sender-only Gmail query for indeed', () => {
    const query = buildGmailQuery(
      'indeed',
      new Date('2024-06-05'),
      new Date('2025-06-05'),
    );
    expect(query).toContain('from:indeedapply@indeed.com');
    expect(query).not.toContain('subject:indeed');
    expect(query).toContain('after:2024/06/05');
  });

  it('builds sender-only Gmail query for linkedin', () => {
    const query = buildGmailQuery(
      'linkedin',
      new Date('2024-06-05'),
      new Date('2025-06-05'),
    );
    expect(query).toContain('from:jobs-noreply@linkedin.com');
    expect(query).not.toContain('subject:linkedin');
    expect(query).toContain('after:2024/06/05');
  });

  it('uses epoch after filter when afterCursor is provided', () => {
    const cursor = new Date('2026-06-05T18:55:39.000Z');
    const query = buildGmailQuery(
      'linkedin',
      new Date('2026-06-05'),
      new Date('2026-06-05'),
      { afterCursor: cursor },
    );
    expect(query).toContain(formatGmailAfterInstant(cursor));
    expect(query).not.toContain('after:2026/06/04');
  });

  it('resolveAutoSyncDateRange uses cursor day without going back a full day', () => {
    const cursor = new Date('2026-06-05T18:55:39.000Z');
    const { fromDate } = resolveAutoSyncDateRange(cursor);
    expect(fromDate.toISOString()).toBe('2026-06-05T00:00:00.000Z');
  });

  it('isAfterSyncCursor rejects messages at or before cursor', () => {
    const cursor = new Date('2026-06-05T18:55:39.000Z');
    expect(
      isAfterSyncCursor(new Date('2026-06-05T18:55:39.000Z'), cursor),
    ).toBe(false);
    expect(
      isAfterSyncCursor(new Date('2026-06-05T10:00:00.000Z'), cursor),
    ).toBe(false);
    expect(
      isAfterSyncCursor(new Date('2026-06-05T19:00:00.000Z'), cursor),
    ).toBe(true);
  });

  it('matches platform using includes check', () => {
    expect(
      matchesPlatform(
        'Naukri <info@naukri.com>',
        'Status of your job application has changed',
        'naukri',
      ),
    ).toBe(true);
    expect(
      matchesPlatform(
        'Naukri <info@naukri.com>',
        'You applied for 6 jobs on 01 Jun',
        'naukri',
      ),
    ).toBe(false);
    expect(
      matchesPlatform(
        'Naukri Alerts <noreply@naukri.com>',
        'Status of your job application has changed',
        'naukri',
      ),
    ).toBe(false);
    expect(
      matchesPlatform('Amazon <no-reply@amazon.com>', 'Your order', 'naukri'),
    ).toBe(false);
  });

  it('matches indeed only for indeedapply application subjects', () => {
    expect(
      matchesPlatform(
        'Indeed Apply <indeedapply@indeed.com>',
        'Indeed Application: Help Desk Support Specialist',
        'indeed',
      ),
    ).toBe(true);
    expect(
      matchesPlatform(
        'Indeed <noreply@indeed.com>',
        'Indeed Application: Help Desk Support Specialist',
        'indeed',
      ),
    ).toBe(false);
    expect(
      matchesPlatform(
        'Indeed Apply <indeedapply@indeed.com>',
        '590802 is the verification code to apply for: Desk Support',
        'indeed',
      ),
    ).toBe(false);
  });

  it('matches linkedin only for jobs-noreply sender', () => {
    expect(
      matchesPlatform(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'Suresh, your application was sent to Synechron',
        'linkedin',
      ),
    ).toBe(true);
    expect(
      matchesPlatform(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'New jobs matching Software Engineer',
        'linkedin',
      ),
    ).toBe(false);
    expect(
      matchesPlatform(
        'LinkedIn <jobs@linkedin.com>',
        'Suresh, your application was sent to Synechron',
        'linkedin',
      ),
    ).toBe(false);
  });

  it('prefers job boards over career_pages for overlapping subjects', () => {
    expect(
      matchesPlatform(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'Suresh, your application was sent to Synechron',
        'career_pages',
      ),
    ).toBe(false);
    expect(
      matchesPlatform(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'Suresh, your application was sent to Synechron',
        'linkedin',
      ),
    ).toBe(true);
  });

  it('sorts sync platforms with job boards before career_pages', () => {
    expect(
      sortPlatformsForSync(['career_pages', 'linkedin', 'naukri']),
    ).toEqual(['linkedin', 'naukri', 'career_pages']);
  });

  it('rejects ranges older than the MVP window', () => {
    expect(() =>
      resolveSyncDateRange({
        fromDate: '2020-01-01',
        toDate: '2020-12-31',
      }),
    ).toThrow();
  });

  it('defaults to the MVP sync window', () => {
    const { fromDate, toDate } = resolveSyncDateRange();
    const span = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / 86_400_000,
    );
    expect(span).toBeLessThanOrEqual(10);
  });
});
