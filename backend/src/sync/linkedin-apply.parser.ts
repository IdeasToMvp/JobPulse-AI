import { matchesPlatformSender } from './platform-sender-emails';

const NON_APPLICATION_SUBJECT =
  /job alert|jobs for you|recommended for you|viewed your profile|new jobs matching/i;

const SUBJECT_SENT_TO =
  /your application was sent to\s+(.+)$/i;

const BODY_HEADING_SENT_TO =
  /your application was sent to\s+(.+?)(?:\n|$)/i;

const BODY_COMPANY_LOCATION = /^(.+?)\s·\s*(.+)$/;

const BODY_APPLIED_ON =
  /applied on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i;

const BOILERPLATE_LINE =
  /^(linkedin|view job|view similar|now, take these|http|www\.|©|unsubscribe|privacy)/i;

export interface LinkedInApplyApplication {
  company: string;
  role: string;
  location?: string;
  appliedAt?: Date;
}

export type LinkedInApplyParseSource =
  | 'subject'
  | 'subject-body'
  | 'html'
  | 'html-text'
  | 'plain-text'
  | 'none';

export function isLinkedInApplyEmail(from: string): boolean {
  return matchesPlatformSender(from, 'linkedin');
}

export function isLinkedInApplicationSubject(subject: string): boolean {
  if (NON_APPLICATION_SUBJECT.test(subject)) return false;
  return SUBJECT_SENT_TO.test(subject.trim());
}

export function isLinkedInApplyMessage(from: string, subject: string): boolean {
  return isLinkedInApplyEmail(from) && isLinkedInApplicationSubject(subject);
}

export function parseLinkedInApplyContent(input: {
  subject: string;
  plainText?: string | null;
  html?: string | null;
  htmlAsText?: string | null;
  messageDate: Date;
}): {
  application: LinkedInApplyApplication | null;
  source: LinkedInApplyParseSource;
} {
  const fromSubject = parseLinkedInApplySubject(input.subject);
  const bodyText =
    input.htmlAsText?.trim() ||
    input.plainText?.trim() ||
    (input.html ? htmlToStructuredText(input.html) : '');

  const fromBody = bodyText
    ? parseLinkedInApplyBody(bodyText, input.messageDate)
    : null;

  const bodySource: LinkedInApplyParseSource = input.html?.trim()
    ? 'html'
    : bodyText
      ? 'plain-text'
      : 'none';

  if (fromBody?.company && fromBody.role) {
    return {
      application: {
        company: fromBody.company,
        role: fromBody.role,
        location: fromBody.location,
        appliedAt: fromBody.appliedAt,
      },
      source: fromSubject?.company ? 'subject-body' : bodySource,
    };
  }

  if (fromSubject?.company && fromBody?.role) {
    return {
      application: {
        company: fromSubject.company,
        role: fromBody.role,
        location: fromBody.location,
        appliedAt: fromBody.appliedAt,
      },
      source: 'subject-body',
    };
  }

  if (fromSubject?.company && fromSubject.role) {
    return {
      application: {
        company: fromSubject.company,
        role: fromSubject.role,
        appliedAt: startOfUtcDay(input.messageDate),
      },
      source: 'subject',
    };
  }

  return { application: null, source: 'none' };
}

export function parseLinkedInApplySubject(
  subject: string,
): Partial<LinkedInApplyApplication> | null {
  if (!isLinkedInApplicationSubject(subject)) return null;

  const match = subject.trim().match(SUBJECT_SENT_TO);
  if (match?.[1]) {
    return { company: cleanText(match[1]) };
  }

  return null;
}

export function parseLinkedInApplyBody(
  body: string,
  messageDate: Date,
): LinkedInApplyApplication | null {
  const text = normalizeBodyText(body);
  if (!text) return null;

  let company: string | undefined;
  const headingMatch = text.match(BODY_HEADING_SENT_TO);
  if (headingMatch?.[1]) {
    company = cleanText(headingMatch[1]);
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && !BOILERPLATE_LINE.test(line));

  let role: string | undefined;
  let location: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const companyLocation = line.match(BODY_COMPANY_LOCATION);
    if (companyLocation?.[1] && companyLocation?.[2]) {
      if (!company) company = cleanText(companyLocation[1]);
      location = cleanText(companyLocation[2]);
      continue;
    }

    if (!role && looksLikeJobTitle(line) && !looksLikeCompanyOnly(line)) {
      role = cleanText(line);
      continue;
    }
  }

  if (!company) return null;
  if (!role) {
    for (const line of lines) {
      if (looksLikeJobTitle(line) && line.toLowerCase() !== company.toLowerCase()) {
        role = cleanText(line);
        break;
      }
    }
  }

  if (!role) return null;

  const appliedAt = findAppliedDate(text, messageDate);

  return {
    company,
    role,
    location,
    appliedAt,
  };
}

function looksLikeJobTitle(line: string): boolean {
  if (line.length < 3 || line.length > 120) return false;
  if (/^your application was sent/i.test(line)) return false;
  if (BODY_COMPANY_LOCATION.test(line)) return false;
  return /developer|engineer|manager|analyst|lead|consultant|intern|designer|architect|specialist|executive|associate|director|coordinator|administrator|tester|\bqa\b|representative|support|sales|marketing|recruiter|technician|supervisor|assistant|intelligence|risk|product|data|business|software|full stack|front end|backend|devops|hr\b|human resources/i.test(
    line,
  );
}

function looksLikeCompanyOnly(line: string): boolean {
  return /^[A-Z][A-Za-z0-9\s.&',-]{1,60}$/.test(line) &&
    !looksLikeJobTitle(line);
}

function findAppliedDate(text: string, messageDate: Date): Date {
  const match = text.match(BODY_APPLIED_ON);
  if (match?.[1]) {
    const parsed = parseMonthDayYearUtc(match[1]);
    if (parsed) return parsed;
  }
  return startOfUtcDay(messageDate);
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseMonthDayYearUtc(value: string): Date | null {
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!match?.[1] || !match?.[2] || !match?.[3]) return null;

  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null;
  }

  return new Date(Date.UTC(year, month, day));
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeBodyText(body: string): string {
  return body
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function htmlToStructuredText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\t+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
