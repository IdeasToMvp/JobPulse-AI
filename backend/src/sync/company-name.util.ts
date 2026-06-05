const SUFFIXES =
  /\b(inc|llc|ltd|limited|corp|corporation|co|company|technologies|technology|tech|solutions|services|group|international|india|pvt|private)\b\.?/gi;

export function normalizeCompanyKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.(com|in|co|io|ai|org|net|uk|us)\b/gi, '')
    .replace(SUFFIXES, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function rolesOverlap(a?: string, b?: string): boolean {
  if (!a || !b) return !a && !b;
  const na = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const nb = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}
