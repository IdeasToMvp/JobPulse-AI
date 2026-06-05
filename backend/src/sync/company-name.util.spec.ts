import { normalizeCompanyKey, rolesOverlap } from './company-name.util';

describe('normalizeCompanyKey', () => {
  it('lowercases and strips suffixes', () => {
    expect(normalizeCompanyKey('Microsoft Corp.')).toBe('microsoft');
    expect(normalizeCompanyKey('PayU Technologies Ltd')).toBe('payu');
  });

  it('removes non-alphanumeric characters', () => {
    expect(normalizeCompanyKey('Goldman Sachs & Co.')).toBe('goldmansachs');
  });

  it('deduplicates equivalent names', () => {
    expect(normalizeCompanyKey('Amazon.com Inc')).toBe(
      normalizeCompanyKey('Amazon'),
    );
  });
});

describe('rolesOverlap', () => {
  it('matches identical roles', () => {
    expect(rolesOverlap('Software Engineer', 'Software Engineer')).toBe(true);
  });

  it('matches when one role contains the other', () => {
    expect(rolesOverlap('Senior Software Engineer', 'Software Engineer')).toBe(
      true,
    );
  });

  it('returns true when both roles are undefined', () => {
    expect(rolesOverlap(undefined, undefined)).toBe(true);
  });

  it('returns false when only one role is defined', () => {
    expect(rolesOverlap('Engineer', undefined)).toBe(false);
  });
});
