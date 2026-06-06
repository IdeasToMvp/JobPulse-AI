export const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  naukri: "Naukri",
  indeed: "Indeed",
  instahyre: "Instahyre",
  wellfound: "Wellfound",
  foundit: "Foundit",
  glassdoor: "Glassdoor",
  career_pages: "Career Pages",
  referrals: "Referrals",
  company_direct: "Company email",
};

export function getPlatformLabel(id: string): string {
  return platformLabels[id] ?? id.replace(/_/g, " ");
}
