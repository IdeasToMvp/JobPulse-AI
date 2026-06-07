export const NAUKRI_APPLY_FROM = 'info@naukri.com';
export const NAUKRI_STATUS_SUBJECT_QUERY = 'Status of your job application';

const STATUS_SUBJECT_PATTERN =
  /status of your job application has (?:changed|been updated)/i;

const SECTION_END =
  /(?:explore our blogs|all-in-one interview|unsubscribe|view in browser|copyright|©)/i;

const BOILERPLATE_LINE =
  /^(hi |status of your job application|view status|get app|naukri|applied on|good luck|www\.|http)/i;

const INDIAN_CITIES =
  /^(chennai|mumbai|delhi|bangalore|bengaluru|gurugram|gurgaon|hyderabad|pune|noida|kolkata|remote|hybrid|onsite)$/i;

export interface NaukriStatusApplication {
  company: string;
  role: string;
  location?: string;
  appliedAt?: Date;
}

export type NaukriStatusParseSource = 'html' | 'html-text' | 'plain-text' | 'none';

export function isNaukriApplyEmail(from: string): boolean {
  return from.toLowerCase().includes(NAUKRI_APPLY_FROM);
}

export function isNaukriStatusSubject(subject: string): boolean {
  return STATUS_SUBJECT_PATTERN.test(subject);
}

export function isNaukriStatusEmail(from: string, subject: string): boolean {
  return isNaukriApplyEmail(from) && isNaukriStatusSubject(subject);
}

export function parseNaukriStatusContent(input: {
  plainText?: string | null;
  html?: string | null;
  htmlAsText?: string | null;
  messageDate: Date;
}): { application: NaukriStatusApplication | null; source: NaukriStatusParseSource } {
  const html = input.html?.trim() ?? '';
  if (html) {
    const fromHtml = parseNaukriStatusHtml(html, input.messageDate);
    if (fromHtml) return { application: fromHtml, source: 'html' };
  }

  const htmlText = input.htmlAsText?.trim() ?? '';
  if (htmlText) {
    const fromHtmlText = parseNaukriStatusBody(htmlText, input.messageDate);
    if (fromHtmlText) return { application: fromHtmlText, source: 'html-text' };
  }

  const plainText = input.plainText?.trim() ?? '';
  if (plainText) {
    const fromPlain = parseNaukriStatusBody(plainText, input.messageDate);
    if (fromPlain) return { application: fromPlain, source: 'plain-text' };
  }

  return { application: null, source: 'none' };
}

export function parseNaukriStatusBody(
  body: string,
  messageDate: Date,
): NaukriStatusApplication | null {
  const lines = extractJobCardLines(body);
  return parseJobCardFromLines(lines, messageDate);
}

export function parseNaukriStatusHtml(
  html: string,
  messageDate: Date,
): NaukriStatusApplication | null {
  const cleaned = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const fromTable = parseNaukriStatusFromTable(cleaned, messageDate);
  if (fromTable) return fromTable;

  const structured = htmlToStructuredText(cleaned);
  return parseNaukriStatusBody(structured, messageDate);
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

function parseNaukriStatusFromTable(
  html: string,
  messageDate: Date,
): NaukriStatusApplication | null {
  const lines: string[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const rowHtml = rowMatch[1] ?? '';
    const cells = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];

    for (const cell of cells) {
      const text = stripHtmlTags((cell[1] ?? '').replace(/<br\s*\/?>/gi, '\n'));
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) lines.push(trimmed);
      }
    }
  }

  return parseJobCardFromLines(lines, messageDate);
}

function extractJobCardLines(body: string): string[] {
  const text = normalizeBodyText(body);
  if (!text) return [];

  const statusMatch = text.match(STATUS_SUBJECT_PATTERN);
  let section = text;

  if (statusMatch?.index !== undefined) {
    section = text.slice(statusMatch.index + statusMatch[0].length);
  }

  const endMatch = section.match(SECTION_END);
  if (endMatch?.index !== undefined && endMatch.index >= 0) {
    section = section.slice(0, endMatch.index);
  }

  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && !BOILERPLATE_LINE.test(line))
    .filter((line) => !/^view status$/i.test(line));
}

function parseJobCardFromLines(
  lines: string[],
  messageDate: Date,
): NaukriStatusApplication | null {
  for (let i = 0; i < lines.length - 1; i++) {
    const role = lines[i];
    const company = lines[i + 1];
    if (!looksLikeJobTitle(role) || !looksLikeCompanyName(company)) continue;

    let location: string | undefined;
    const maybeLocation = lines[i + 2];
    if (maybeLocation && looksLikeLocation(maybeLocation)) {
      location = maybeLocation;
    }

    return {
      role: cleanTitle(role),
      company: company.trim(),
      location,
      appliedAt: findAppliedDate(lines.join('\n'), messageDate),
    };
  }

  return null;
}

function looksLikeJobTitle(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 120) return false;
  if (INDIAN_CITIES.test(trimmed)) return false;
  if (/applied\s+\d/i.test(trimmed)) return false;
  if (/^view status$/i.test(trimmed)) return false;
  if (looksLikeCompanyName(trimmed) && !isLikelyJobTitle(trimmed)) return false;
  return isLikelyJobTitle(trimmed);
}

function isLikelyJobTitle(line: string): boolean {
  return /developer|engineer|manager|analyst|lead|consultant|intern|designer|architect|specialist|executive|associate|director|coordinator|administrator|tester|\bqa\b|scientist|programmer|architect|support|sales|marketing|hr\b|recruiter|writer|editor|product|data|devops|sre\b|fullstack|full stack|front end|frontend|back end|backend|mobile|android|ios|cloud|security|finance|accountant|lawyer|nurse|doctor|teacher|trainer|operator|technician|supervisor|head\b|vp\b|chief/i.test(
    line,
  );
}

function looksLikeCompanyName(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  if (INDIAN_CITIES.test(trimmed)) return false;
  if (/applied/i.test(trimmed)) return false;
  if (/^view status$/i.test(trimmed)) return false;
  if (isLikelyJobTitle(trimmed) && !/solutions|systems|technologies|services|labs|corp|inc|ltd|pvt|consulting|group|company|studio|global|digital|software|infotech|tech\b/i.test(trimmed)) {
    return false;
  }
  return /^[A-Za-z0-9][A-Za-z0-9\s.&'-]{1,79}$/.test(trimmed);
}

function looksLikeLocation(line: string): boolean {
  return INDIAN_CITIES.test(line.trim());
}

function findAppliedDate(text: string, messageDate: Date): Date | undefined {
  const agoMatch = text.match(/applied\s+(\d+)\s*d(?:ay)?s?\s*ago/i);
  if (agoMatch?.[1]) {
    const days = Number(agoMatch[1]);
    if (Number.isFinite(days) && days >= 0 && days <= 365) {
      const applied = new Date(messageDate);
      applied.setUTCDate(applied.getUTCDate() - days);
      return startOfUtcDay(applied);
    }
  }

  const onMatch = text.match(
    /applied on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/i,
  );
  if (onMatch?.[1]) {
    const parsed = new Date(onMatch[1].trim());
    if (!Number.isNaN(parsed.getTime())) return startOfUtcDay(parsed);
  }

  return undefined;
}

function cleanTitle(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}
