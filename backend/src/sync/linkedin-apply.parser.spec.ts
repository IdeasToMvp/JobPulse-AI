import {
  isLinkedInApplyMessage,
  parseLinkedInApplyBody,
  parseLinkedInApplyContent,
  parseLinkedInApplySubject,
} from './linkedin-apply.parser';

const MESSAGE_DATE = new Date('2026-06-01T06:24:00.000Z');

describe('linkedin-apply.parser', () => {
  it('matches jobs-noreply application confirmation emails', () => {
    expect(
      isLinkedInApplyMessage(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'Bhawna, your application was sent to Indifi',
      ),
    ).toBe(true);
    expect(
      isLinkedInApplyMessage(
        'LinkedIn <jobs-noreply@linkedin.com>',
        'New jobs matching Software Engineer',
      ),
    ).toBe(false);
  });

  it('parses company from subject', () => {
    expect(
      parseLinkedInApplySubject(
        'Bhawna, your application was sent to Indifi',
      ),
    ).toEqual({ company: 'Indifi' });
    expect(
      parseLinkedInApplySubject(
        'Bhawna, your application was sent to Crescendo Global',
      ),
    ).toEqual({ company: 'Crescendo Global' });
  });

  it('parses role, company, location, and applied date from body', () => {
    const body = `
Your application was sent to Indifi
Manager Risk Management
Indifi · Gurugram (On-site)
Applied on June 1, 2026
Now, take these next steps for more success
`;

    expect(parseLinkedInApplyBody(body, MESSAGE_DATE)).toEqual({
      company: 'Indifi',
      role: 'Manager Risk Management',
      location: 'Gurugram (On-site)',
      appliedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
  });

  it('parses Crescendo Global application from body', () => {
    const body = `
Your application was sent to Crescendo Global
Business Intelligence Analyst
Crescendo Global · Gurugram (On-site)
Applied on June 1, 2026
`;

    expect(parseLinkedInApplyBody(body, MESSAGE_DATE)).toEqual({
      company: 'Crescendo Global',
      role: 'Business Intelligence Analyst',
      location: 'Gurugram (On-site)',
      appliedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
  });

  it('combines subject company with body role', () => {
    const result = parseLinkedInApplyContent({
      subject: 'Bhawna, your application was sent to Indifi',
      plainText: `
Your application was sent to Indifi
Manager Risk Management
Indifi · Gurugram (On-site)
Applied on June 1, 2026
`,
      messageDate: MESSAGE_DATE,
    });

    expect(result.application).toEqual({
      company: 'Indifi',
      role: 'Manager Risk Management',
      location: 'Gurugram (On-site)',
      appliedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
    expect(result.source).toBe('subject-body');
  });
});
