/** Domains that send job-platform notifications — never treat as employer domains. */
export const PLATFORM_EMAIL_DOMAINS = [
  'linkedin.com',
  'linkedinmail.com',
  'naukri.com',
  'naukri.net',
  'indeed.com',
  'indeedemail.com',
  'instahyre.com',
  'wellfound.com',
  'angel.co',
  'foundit.in',
  'monster.com',
  'glassdoor.com',
  'google.com',
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
];

/** ATS senders — classify mail but do not store as company domain. */
export const ATS_EMAIL_DOMAINS = [
  'greenhouse.io',
  'greenhouse-mail.io',
  'lever.co',
  'workday.com',
  'myworkday.com',
  'icims.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'jobvite.com',
  'bamboohr.com',
  'successfactors.com',
  'taleo.net',
];

/** Curated company name → primary email domain (lowercase). */
export const COMPANY_DOMAIN_HINTS: Record<string, string> = {
  microsoft: 'microsoft.com',
  amazon: 'amazon.com',
  google: 'google.com',
  meta: 'meta.com',
  apple: 'apple.com',
  netflix: 'netflix.com',
  payu: 'payu.in',
  flipkart: 'flipkart.com',
  swiggy: 'swiggy.in',
  zomato: 'zomato.com',
  razorpay: 'razorpay.com',
  phonepe: 'phonepe.com',
  cred: 'cred.club',
  uber: 'uber.com',
  ola: 'olacabs.com',
  walmart: 'walmart.com',
  oracle: 'oracle.com',
  ibm: 'ibm.com',
  accenture: 'accenture.com',
  tcs: 'tcs.com',
  infosys: 'infosys.com',
  wipro: 'wipro.com',
  hcl: 'hcl.com',
  cognizant: 'cognizant.com',
  capgemini: 'capgemini.com',
  deloitte: 'deloitte.com',
  goldmansachs: 'gs.com',
  jpmorgan: 'jpmorgan.com',
  salesforce: 'salesforce.com',
  adobe: 'adobe.com',
  intel: 'intel.com',
  nvidia: 'nvidia.com',
  tesla: 'tesla.com',
  spotify: 'spotify.com',
  airbnb: 'airbnb.com',
  stripe: 'stripe.com',
  shopify: 'shopify.com',
  atlassian: 'atlassian.com',
  servicenow: 'servicenow.com',
  snowflake: 'snowflake.com',
  databricks: 'databricks.com',
  freshworks: 'freshworks.com',
  zoho: 'zoho.com',
  meesho: 'meesho.io',
  byjus: 'byjus.com',
  unacademy: 'unacademy.com',
};

export function isPlatformOrPersonalDomain(domain: string): boolean {
  const lower = domain.toLowerCase();
  return (
    PLATFORM_EMAIL_DOMAINS.some(
      (d) => lower === d || lower.endsWith(`.${d}`),
    ) ||
    ATS_EMAIL_DOMAINS.some((d) => lower === d || lower.endsWith(`.${d}`))
  );
}

export function lookupDomainHint(normalizedKey: string): string | undefined {
  return COMPANY_DOMAIN_HINTS[normalizedKey];
}

export function extractEmailAddress(from: string): string | undefined {
  const match = from.match(/<([^>]+@[^>]+)>/);
  if (match?.[1]) return match[1].toLowerCase().trim();
  const bare = from.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return bare?.[0]?.toLowerCase();
}

export function extractDomainFromEmail(email: string): string | undefined {
  const at = email.lastIndexOf('@');
  if (at < 0) return undefined;
  return email.slice(at + 1).toLowerCase();
}

export function buildPlatformExclusionClause(): string {
  const tokens = PLATFORM_EMAIL_DOMAINS.map((d) => `from:${d}`);
  return tokens.join(' OR ');
}
