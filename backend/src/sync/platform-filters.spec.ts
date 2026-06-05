import {
  buildGmailQuery,
  matchesPlatform,
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

  it('rejects ranges older than one year', () => {
    expect(() =>
      resolveSyncDateRange({
        fromDate: '2020-01-01',
        toDate: '2020-12-31',
      }),
    ).toThrow();
  });

  it('defaults to one year window', () => {
    const { fromDate, toDate } = resolveSyncDateRange();
    const span = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / 86_400_000,
    );
    expect(span).toBeLessThanOrEqual(365);
  });
});
