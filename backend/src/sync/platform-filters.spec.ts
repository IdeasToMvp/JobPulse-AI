import {
  buildGmailQuery,
  formatGmailAfterInstant,
  isAfterSyncCursor,
  matchesPlatform,
  resolveAutoSyncDateRange,
  resolveSyncDateRange,
} from './platform-filters';

describe('platform-filters', () => {
  it('builds includes-style Gmail query for naukri', () => {
    const query = buildGmailQuery(
      'naukri',
      new Date('2024-06-05'),
      new Date('2025-06-05'),
    );
    expect(query).toContain('from:naukri');
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
    expect(isAfterSyncCursor(new Date('2026-06-05T18:55:39.000Z'), cursor)).toBe(
      false,
    );
    expect(isAfterSyncCursor(new Date('2026-06-05T10:00:00.000Z'), cursor)).toBe(
      false,
    );
    expect(isAfterSyncCursor(new Date('2026-06-05T19:00:00.000Z'), cursor)).toBe(
      true,
    );
  });

  it('matches platform using includes check', () => {
    expect(
      matchesPlatform(
        'Naukri Alerts <noreply@naukri.com>',
        'Your application',
        'naukri',
      ),
    ).toBe(true);
    expect(
      matchesPlatform('Amazon <no-reply@amazon.com>', 'Your order', 'naukri'),
    ).toBe(false);
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
