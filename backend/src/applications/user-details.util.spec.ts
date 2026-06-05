import {
  hasUserDetailsContent,
  mergeUserDetails,
  parseUserDetails,
  userDetailsToDb,
} from './user-details.util';

describe('user-details.util', () => {
  describe('parseUserDetails', () => {
    it('returns undefined for empty object', () => {
      expect(parseUserDetails({})).toBeUndefined();
      expect(parseUserDetails(null)).toBeUndefined();
    });

    it('parses stored user details', () => {
      expect(
        parseUserDetails({
          location: 'Remote',
          salary: '₹20 LPA',
          numberOfRounds: 3,
          workMode: 'hybrid',
          notes: 'HR round next week',
          updatedAt: '2026-06-01T00:00:00.000Z',
        }),
      ).toEqual({
        location: 'Remote',
        salary: '₹20 LPA',
        numberOfRounds: 3,
        workMode: 'hybrid',
        notes: 'HR round next week',
        updatedAt: '2026-06-01T00:00:00.000Z',
      });
    });

    it('ignores invalid work mode', () => {
      expect(
        parseUserDetails({
          location: 'Mumbai',
          workMode: 'flexible',
          updatedAt: '2026-06-01T00:00:00.000Z',
        }),
      ).toEqual({
        location: 'Mumbai',
        updatedAt: '2026-06-01T00:00:00.000Z',
      });
    });
  });

  describe('mergeUserDetails', () => {
    const updatedAt = '2026-06-05T12:00:00.000Z';

    it('merges partial updates without dropping existing fields', () => {
      const merged = mergeUserDetails(
        {
          location: 'Bangalore',
          salary: '₹18 LPA',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
        { salary: '₹22 LPA' },
        updatedAt,
      );

      expect(merged).toEqual({
        location: 'Bangalore',
        salary: '₹22 LPA',
        updatedAt,
      });
    });

    it('clears string fields when empty string is provided', () => {
      const merged = mergeUserDetails(
        {
          location: 'Bangalore',
          notes: 'Follow up Monday',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
        { location: '  ', notes: '' },
        updatedAt,
      );

      expect(merged).toBeUndefined();
    });

    it('returns undefined when merged result has no content', () => {
      expect(mergeUserDetails(undefined, {}, updatedAt)).toBeUndefined();
    });
  });

  describe('hasUserDetailsContent', () => {
    it('detects meaningful content', () => {
      expect(hasUserDetailsContent({ numberOfRounds: 2 })).toBe(true);
      expect(hasUserDetailsContent({ notes: 'Recruiter call' })).toBe(true);
      expect(hasUserDetailsContent({ updatedAt: '2026-06-01' })).toBe(false);
    });
  });

  describe('userDetailsToDb', () => {
    it('serializes only populated fields', () => {
      expect(
        userDetailsToDb({
          location: 'Remote',
          numberOfRounds: 4,
          updatedAt: '2026-06-05T12:00:00.000Z',
        }),
      ).toEqual({
        location: 'Remote',
        numberOfRounds: 4,
        updatedAt: '2026-06-05T12:00:00.000Z',
      });
    });

    it('returns empty object when details are undefined', () => {
      expect(userDetailsToDb(undefined)).toEqual({});
    });
  });
});
