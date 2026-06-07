import {
  PLATFORM_SENDER_EMAILS,
  buildSenderFromClause,
  matchesPlatformApplyKeywords,
  matchesPlatformApplyKeywordsSubject,
  matchesPlatformSender,
} from './platform-sender-emails';

describe('platform-sender-emails', () => {
  it('defines static sender lists for configured platforms', () => {
    expect(PLATFORM_SENDER_EMAILS.linkedin).toEqual([
      'jobs-noreply@linkedin.com',
    ]);
    expect(PLATFORM_SENDER_EMAILS.naukri).toEqual(['info@naukri.com']);
    expect(PLATFORM_SENDER_EMAILS.indeed).toEqual(['indeedapply@indeed.com']);
  });

  it('matches sender addresses case-insensitively', () => {
    expect(
      matchesPlatformSender(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'linkedin',
      ),
    ).toBe(true);
    expect(
      matchesPlatformSender('LinkedIn <jobs@linkedin.com>', 'linkedin'),
    ).toBe(false);
  });

  it('builds Gmail from clauses for single and multiple senders', () => {
    expect(buildSenderFromClause('linkedin')).toBe(
      'from:jobs-noreply@linkedin.com',
    );
    expect(buildSenderFromClause('instahyre')).toBeNull();
  });

  it('matches apply keywords and excludes noise', () => {
    expect(
      matchesPlatformApplyKeywordsSubject(
        'Suresh, your application was sent to Synechron',
        'linkedin',
      ),
    ).toBe(true);
    expect(
      matchesPlatformApplyKeywordsSubject(
        'New jobs matching Software Engineer',
        'linkedin',
      ),
    ).toBe(false);
    expect(
      matchesPlatformApplyKeywords(
        'Indeed Application: Help Desk Support Specialist',
        'You applied to Help Desk at Acme',
        'indeed',
      ),
    ).toBe(true);
    expect(
      matchesPlatformApplyKeywords(
        '590802 is the verification code to apply for: Desk Support',
        '',
        'indeed',
      ),
    ).toBe(false);
  });
});
