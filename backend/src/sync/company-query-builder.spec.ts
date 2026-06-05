import {
  buildCompanyGmailQueries,
  MAX_QUERY_PARTS,
} from './company-query-builder';
import { buildPlatformExclusionClause } from './company-domain-hints';

describe('buildCompanyGmailQueries', () => {
  const fromDate = new Date('2025-01-01T00:00:00Z');
  const toDate = new Date('2025-01-31T00:00:00Z');

  it('builds from:@domain queries with date range and platform exclusion', () => {
    const queries = buildCompanyGmailQueries(
      {
        companyId: 'c1',
        canonicalName: 'Microsoft',
        domains: ['microsoft.com'],
        recruiterEmails: [],
      },
      fromDate,
      toDate,
    );

    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('from:@microsoft.com');
    expect(queries[0]).toContain('after:2025/01/01');
    expect(queries[0]).toContain('before:2025/02/01');
    expect(queries[0]).toContain(buildPlatformExclusionClause());
  });

  it('includes recruiter emails in query', () => {
    const queries = buildCompanyGmailQueries(
      {
        companyId: 'c1',
        canonicalName: 'PayU',
        domains: ['payu.in'],
        recruiterEmails: ['hr@payu.in'],
      },
      fromDate,
      toDate,
    );

    expect(queries[0]).toContain('from:@payu.in');
    expect(queries[0]).toContain('from:hr@payu.in');
  });

  it('returns empty array when no domains or recruiters', () => {
    const queries = buildCompanyGmailQueries(
      {
        companyId: 'c1',
        canonicalName: 'Unknown',
        domains: [],
        recruiterEmails: [],
      },
      fromDate,
      toDate,
    );

    expect(queries).toEqual([]);
  });

  it('batches query parts when exceeding MAX_QUERY_PARTS', () => {
    const domains = Array.from(
      { length: MAX_QUERY_PARTS + 2 },
      (_, i) => `company${i}.com`,
    );
    const queries = buildCompanyGmailQueries(
      {
        companyId: 'c1',
        canonicalName: 'BigCo',
        domains,
        recruiterEmails: [],
      },
      fromDate,
      toDate,
    );

    expect(queries.length).toBeGreaterThan(1);
  });
});
