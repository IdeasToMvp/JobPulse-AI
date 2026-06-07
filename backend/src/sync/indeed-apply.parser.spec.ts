import {
  isIndeedApplyEmail,
  isIndeedApplyMessage,
  parseIndeedApplyBody,
  parseIndeedApplyContent,
  parseIndeedApplySubject,
} from './indeed-apply.parser';

const MESSAGE_DATE = new Date('2026-06-02T15:27:00.000Z');

describe('indeed-apply.parser', () => {
  it('matches only indeedapply@indeed.com application emails', () => {
    expect(isIndeedApplyEmail('Indeed Apply <indeedapply@indeed.com>')).toBe(
      true,
    );
    expect(
      isIndeedApplyMessage(
        'Indeed Apply <indeedapply@indeed.com>',
        'Indeed Application: Help Desk Support Specialist',
      ),
    ).toBe(true);
    expect(
      isIndeedApplyMessage(
        'Indeed <noreply@indeed.com>',
        'Indeed Application: Help Desk Support Specialist',
      ),
    ).toBe(false);
    expect(
      isIndeedApplyMessage(
        'Indeed Apply <indeedapply@indeed.com>',
        '590802 is the verification code to apply for: Desk Support',
      ),
    ).toBe(false);
  });

  it('parses role from subject', () => {
    expect(
      parseIndeedApplySubject(
        'Indeed Application: Help Desk Support Specialist',
      ),
    ).toEqual({
      role: 'Help Desk Support Specialist',
    });
  });

  it('parses role and company from subject when present', () => {
    expect(
      parseIndeedApplySubject(
        'Indeed Application: Software Engineer at Acme Corp',
      ),
    ).toEqual({
      role: 'Software Engineer',
      company: 'Acme Corp',
    });
  });

  it('parses company and role from body', () => {
    const body = `
You applied to Help Desk Support Specialist at Hiringeye Solutions.
View job
`;

    expect(parseIndeedApplyBody(body, MESSAGE_DATE)).toEqual({
      role: 'Help Desk Support Specialist',
      company: 'Hiringeye Solutions',
      appliedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
  });

  it('combines subject role with body company', () => {
    const result = parseIndeedApplyContent({
      subject: 'Indeed Application: Front End Developer',
      plainText: `
You successfully applied to the following job:
Job title: Front End Developer
Company: Hiringeye Solutions
Location: Chennai
`,
      messageDate: MESSAGE_DATE,
    });

    expect(result.source).toBe('subject-body');
    expect(result.application).toEqual({
      role: 'Front End Developer',
      company: 'Hiringeye Solutions',
      location: 'Chennai',
      appliedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
  });
});
