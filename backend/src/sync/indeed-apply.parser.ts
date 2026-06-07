import { matchesPlatformSender } from './platform-sender-emails';

export const INDEED_APPLY_FROM = 'indeedapply@indeed.com';

const NON_APPLICATION_SUBJECT =
  /verification code to apply|confirm your email|unsubscribe/i;

const SUBJECT_ROLE_PATTERN = /^Indeed Application:\s*(.+)$/i;
const SUBJECT_ROLE_AT_COMPANY =
  /^Indeed Application:\s*(.+?)\s+(?:at|@)\s+(.+)$/i;

const BODY_APPLIED_TO =
  /you applied to\s+(.+?)\s+(?:at|@)\s+(.+?)(?:[.\n]|$)/i;
const BODY_APPLICATION_FOR =
  /your application (?:to|for)\s+(.+?)\s+(?:at|for)\s+(.+?)(?:[.\n]|$)/i;
const BODY_SENT_TO =
  /your application (?:was sent|has been sent) to\s+(.+?)(?:[.\n]|$)/i;
const BODY_SUCCESSFULLY_APPLIED =
  /successfully applied to(?: the following job)?/i;

const LABELLED_ROLE = /^(?:job title|position|role|job)[:\s]+(.+)$/i;
const LABELLED_COMPANY = /^(?:company|employer|hiring company)[:\s]+(.+)$/i;
const LABELLED_LOCATION = /^(?:location|city)[:\s]+(.+)$/i;

const BOILERPLATE_LINE =
  /^(indeed|view job|manage applications|unsubscribe|http|www\.|©|copyright|privacy)/i;

export interface IndeedApplyApplication {
  company: string;
  role: string;
  location?: string;
  appliedAt?: Date;
}

export type IndeedApplyParseSource =
  | 'subject'
  | 'subject-body'
  | 'html'
  | 'html-text'
  | 'plain-text'
  | 'none';

export function isIndeedApplyEmail(from: string): boolean {
  return matchesPlatformSender(from, 'indeed');
}

export function isIndeedApplicationSubject(subject: string): boolean {
  if (NON_APPLICATION_SUBJECT.test(subject)) return false;
  return SUBJECT_ROLE_PATTERN.test(subject.trim());
}

export function isIndeedApplyMessage(from: string, subject: string): boolean {
  return isIndeedApplyEmail(from) && isIndeedApplicationSubject(subject);
}

export function parseIndeedApplyContent(input: {
  subject: string;
  plainText?: string | null;
  html?: string | null;
  htmlAsText?: string | null;
  messageDate: Date;
}): {
  application: IndeedApplyApplication | null;
  source: IndeedApplyParseSource;
} {
  const fromSubject = parseIndeedApplySubject(input.subject);
  const bodyText =
    input.htmlAsText?.trim() ||
    input.plainText?.trim() ||
    (input.html ? htmlToStructuredText(input.html) : '');

  const fromBody = bodyText
    ? parseIndeedApplyBody(bodyText, input.messageDate)
    : null;

  const bodySource: IndeedApplyParseSource = input.html?.trim()
    ? 'html'
    : bodyText
      ? 'plain-text'
      : 'none';

  if (fromSubject?.role && fromBody?.company) {
    const application = mergeApplications(
      {
        role: fromSubject.role,
        company: fromBody.company,
        location: fromBody.location,
        appliedAt: fromBody.appliedAt,
      },
      fromSubject,
      input.messageDate,
    );
    if (application) {
      return {
        application,
        source: fromSubject.company ? 'subject-body' : 'subject-body',
      };
    }
  }

  if (fromSubject?.role && fromSubject.company) {
    const application = mergeApplications(
      fromSubject,
      fromBody,
      input.messageDate,
    );
    if (application) {
      return {
        application,
        source: fromBody ? 'subject-body' : 'subject',
      };
    }
  }

  if (fromBody?.company && fromBody.role) {
    return {
      application: {
        role: fromSubject?.role ?? fromBody.role,
        company: fromBody.company,
        location: fromBody.location,
        appliedAt: fromBody.appliedAt,
      },
      source: fromSubject?.role ? 'subject-body' : bodySource,
    };
  }

  return { application: null, source: 'none' };
}

export function parseIndeedApplySubject(
  subject: string,
): Partial<IndeedApplyApplication> | null {
  if (!isIndeedApplicationSubject(subject)) return null;

  const atMatch = subject.trim().match(SUBJECT_ROLE_AT_COMPANY);
  if (atMatch?.[1] && atMatch?.[2]) {
    return {
      role: cleanText(atMatch[1]),
      company: cleanText(atMatch[2]),
    };
  }

  const roleMatch = subject.trim().match(SUBJECT_ROLE_PATTERN);
  if (roleMatch?.[1]) {
    return { role: cleanText(roleMatch[1]) };
  }

  return null;
}

export function parseIndeedApplyBody(
  body: string,
  messageDate: Date,
): IndeedApplyApplication | null {
  const text = normalizeBodyText(body);
  if (!text) return null;

  const appliedTo = text.match(BODY_APPLIED_TO);
  if (appliedTo?.[1] && appliedTo?.[2]) {
    return {
      role: cleanText(appliedTo[1]),
      company: cleanText(appliedTo[2]),
      appliedAt: findAppliedDate(text, messageDate),
    };
  }

  const applicationFor = text.match(BODY_APPLICATION_FOR);
  if (applicationFor?.[1] && applicationFor?.[2]) {
    return {
      role: cleanText(applicationFor[1]),
      company: cleanText(applicationFor[2]),
      appliedAt: findAppliedDate(text, messageDate),
    };
  }

  const sentTo = text.match(BODY_SENT_TO);
  if (sentTo?.[1]) {
    const labelled = parseLabelledLines(text);
    if (labelled.role) {
      return {
        role: labelled.role,
        company: cleanText(sentTo[1]),
        location: labelled.location,
        appliedAt: findAppliedDate(text, messageDate),
      };
    }
  }

  if (BODY_SUCCESSFULLY_APPLIED.test(text)) {
    const labelled = parseLabelledLines(text);
    if (labelled.role && labelled.company) {
      return {
        role: labelled.role,
        company: labelled.company,
        location: labelled.location,
        appliedAt: findAppliedDate(text, messageDate),
      };
    }
  }

  const labelled = parseLabelledLines(text);
  if (labelled.role && labelled.company) {
    return {
      role: labelled.role,
      company: labelled.company,
      location: labelled.location,
      appliedAt: findAppliedDate(text, messageDate),
    };
  }

  const stacked = parseStackedRoleCompany(text);
  if (stacked) {
    return {
      ...stacked,
      appliedAt: findAppliedDate(text, messageDate),
    };
  }

  return null;
}

function parseLabelledLines(text: string): {
  role?: string;
  company?: string;
  location?: string;
} {
  const result: { role?: string; company?: string; location?: string } = {};

  for (const line of text.split('\n').map((entry) => entry.trim())) {
    if (!line || BOILERPLATE_LINE.test(line)) continue;

    const roleMatch = line.match(LABELLED_ROLE);
    if (roleMatch?.[1]) {
      result.role = cleanText(roleMatch[1]);
      continue;
    }

    const companyMatch = line.match(LABELLED_COMPANY);
    if (companyMatch?.[1]) {
      result.company = cleanText(companyMatch[1]);
      continue;
    }

    const locationMatch = line.match(LABELLED_LOCATION);
    if (locationMatch?.[1]) {
      result.location = cleanText(locationMatch[1]);
    }
  }

  return result;
}

function parseStackedRoleCompany(
  text: string,
): { role: string; company: string; location?: string } | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && !BOILERPLATE_LINE.test(line));

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (looksLikeJobTitle(line) && looksLikeCompanyName(next)) {
      const location = lines[i + 2] && looksLikeLocation(lines[i + 2])
        ? lines[i + 2]
        : undefined;
      return {
        role: cleanText(line),
        company: cleanText(next),
        location,
      };
    }
  }

  return null;
}

function mergeApplications(
  primary: Partial<IndeedApplyApplication>,
  secondary: Partial<IndeedApplyApplication> | null,
  messageDate: Date,
): IndeedApplyApplication | null {
  const role = primary.role ?? secondary?.role;
  const company = primary.company ?? secondary?.company;
  if (!role || !company) return null;

  return {
    role,
    company,
    location: primary.location ?? secondary?.location,
    appliedAt:
      primary.appliedAt ?? secondary?.appliedAt ?? startOfUtcDay(messageDate),
  };
}

function looksLikeJobTitle(line: string): boolean {
  if (line.length < 3 || line.length > 120) return false;
  if (/^indeed application:/i.test(line)) return false;
  return /developer|engineer|manager|analyst|lead|consultant|intern|designer|architect|specialist|executive|associate|director|coordinator|administrator|tester|\bqa\b|representative|support|sales|marketing|recruiter|technician|supervisor|assistant|clerk|operator|nurse|driver|cashier|specialist|customer service|help desk|front end|backend|full stack/i.test(
    line,
  );
}

function looksLikeCompanyName(line: string): boolean {
  if (line.length < 2 || line.length > 80) return false;
  if (looksLikeLocation(line)) return false;
  if (/^indeed$/i.test(line)) return false;
  return /^[A-Za-z0-9][A-Za-z0-9\s.&',-]{1,79}$/.test(line);
}

function looksLikeLocation(line: string): boolean {
  return /^(remote|hybrid|onsite|[A-Za-z .,-]{2,60},\s*[A-Z]{2})$/i.test(line);
}

function findAppliedDate(text: string, messageDate: Date): Date {
  const agoMatch = text.match(/applied\s+(\d+)\s*(?:day|days|d)\s*ago/i);
  if (agoMatch?.[1]) {
    const days = Number(agoMatch[1]);
    if (Number.isFinite(days) && days >= 0 && days <= 365) {
      const applied = new Date(messageDate);
      applied.setUTCDate(applied.getUTCDate() - days);
      return startOfUtcDay(applied);
    }
  }

  return startOfUtcDay(messageDate);
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
