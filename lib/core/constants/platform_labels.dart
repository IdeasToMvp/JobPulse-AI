/// Display labels for job sources — keep in sync with web `platform-labels.ts`.
const platformLabels = <String, String>{
  'linkedin': 'LinkedIn',
  'naukri': 'Naukri',
  'indeed': 'Indeed',
  'instahyre': 'Instahyre',
  'wellfound': 'Wellfound',
  'foundit': 'Foundit',
  'glassdoor': 'Glassdoor',
  'career_pages': 'Career Pages',
  'referrals': 'Referrals',
  'company_direct': 'Company email',
};

String platformLabel(String id) {
  return platformLabels[id] ?? id.replaceAll('_', ' ');
}
