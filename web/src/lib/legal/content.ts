export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSection[];
}

const CONTACT_EMAIL = "jaswindersingh@iitdalumni.com";
const APP_NAME = "JobPulseAI";

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "June 8, 2026",
  summary:
    `${APP_NAME} helps you track job applications by syncing job-related emails from your Gmail account. This policy explains what we collect, how we use it, and the choices you have.`,
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      paragraphs: [
        `${APP_NAME} ("we", "us", or "our") is a job application tracking service available on Android and the web.`,
        `If you have questions about this policy, contact us at ${CONTACT_EMAIL}.`,
      ],
    },
    {
      id: "what-we-collect",
      title: "Information we collect",
      paragraphs: [
        "When you sign in with Google, we receive basic profile information such as your name, email address, and profile picture.",
        "With your permission, we access Gmail using read-only scopes. We process messages that appear related to your job search, including applications, interview updates, and recruiter correspondence from platforms you select.",
        "We do not read, store, or analyze unrelated personal emails.",
      ],
      bullets: [
        "Google account profile information (name, email, avatar)",
        "Job-related email metadata and content needed to detect applications and status changes",
        "Application records you create or edit in the app (company, role, status, notes)",
        "Sync settings and selected job platforms",
        "Activity history generated from sync and manual updates",
      ],
    },
    {
      id: "how-we-use",
      title: "How we use your information",
      paragraphs: [
        "We use your information solely to provide and improve the job tracking experience.",
      ],
      bullets: [
        "Authenticate you and maintain your session",
        "Sync and organize job applications from Gmail",
        "Display dashboard stats, timelines, and application status",
        "Run optional automated background sync based on your settings",
        "Send local notifications on your device when new applications are detected",
      ],
    },
    {
      id: "ai-processing",
      title: "Automated and AI-assisted processing",
      paragraphs: [
        "Some emails may be classified using automated rules and AI-assisted tools to identify job platforms, application events, and status changes.",
        "AI processing is limited to job-search-related content required for sync. We do not use your Gmail data to train public AI models.",
      ],
    },
    {
      id: "storage-security",
      title: "Storage and security",
      paragraphs: [
        "Application data and sync results are stored in secure cloud infrastructure. Google OAuth tokens are encrypted at rest.",
        "We apply access controls so your data is available only to your authenticated account.",
        "No method of transmission or storage is completely secure, but we work to protect your information using industry-standard safeguards.",
      ],
    },
    {
      id: "sharing",
      title: "How we share information",
      paragraphs: [
        "We do not sell your personal information.",
        "We share data only with service providers that help us operate the product, such as hosting, database, and authentication infrastructure, and only as needed to deliver the service.",
        "We may disclose information if required by law or to protect the rights, safety, and security of our users and service.",
      ],
    },
    {
      id: "retention",
      title: "Data retention",
      paragraphs: [
        "We retain synced job tracking data while your account is active and as needed to provide the service.",
        "You can delete synced data at any time from the Account screen. Signing out revokes active access tokens on our servers.",
        "You can disconnect Gmail access at any time through your Google Account security settings.",
      ],
    },
    {
      id: "your-rights",
      title: "Your choices and rights",
      paragraphs: ["You control how JobPulseAI uses your data."],
      bullets: [
        "Revoke Gmail access from your Google Account",
        "Delete all synced data from within the app or web dashboard",
        "Adjust auto-sync frequency or turn sync off",
        "Sign out to end your session",
        "Contact us to request access, correction, or deletion assistance",
      ],
    },
    {
      id: "children",
      title: "Children's privacy",
      paragraphs: [
        `${APP_NAME} is not intended for users under 16. We do not knowingly collect personal information from children.`,
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. We will revise the \"Last updated\" date at the top of this page when changes are posted.",
        "Continued use of the service after changes become effective means you accept the updated policy.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [`For privacy questions or requests, email ${CONTACT_EMAIL}.`],
    },
  ],
};

export const termsOfService: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "June 8, 2026",
  summary:
    `These Terms govern your use of ${APP_NAME} on Android and the web. By creating an account or using the service, you agree to these Terms.`,
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of terms",
      paragraphs: [
        `By accessing or using ${APP_NAME}, you agree to these Terms of Service and our Privacy Policy.`,
        "If you do not agree, do not use the service.",
      ],
    },
    {
      id: "service",
      title: "The service",
      paragraphs: [
        `${APP_NAME} provides tools to sync job-related Gmail messages and organize them into an application tracking workflow.`,
        "Features may change over time. We may add, modify, or discontinue functionality with reasonable notice when practical.",
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility",
      paragraphs: [
        "You must be at least 16 years old and able to form a binding contract to use the service.",
        "You are responsible for ensuring your use complies with applicable laws and with Google's terms for Gmail access.",
      ],
    },
    {
      id: "account",
      title: "Account and Google sign-in",
      paragraphs: [
        "You sign in using Google OAuth. You are responsible for maintaining control of your Google account and for activity that occurs through your JobPulseAI account.",
        "You agree to provide accurate information and to notify us if you believe your account has been compromised.",
      ],
    },
    {
      id: "gmail-access",
      title: "Gmail access and acceptable use",
      paragraphs: [
        "You grant us permission to access Gmail with read-only scopes solely to provide job tracking features you request.",
        "You agree not to misuse the service, attempt unauthorized access, interfere with system integrity, or use the product for unlawful purposes.",
      ],
      bullets: [
        "Do not use the service to access accounts you do not own or control",
        "Do not attempt to reverse engineer, scrape, or overload the platform",
        "Do not upload malicious content or abuse support channels",
      ],
    },
    {
      id: "your-content",
      title: "Your content",
      paragraphs: [
        "You retain ownership of your email content and application data.",
        "You grant us a limited license to process that content only as needed to operate, maintain, and improve the service for you.",
      ],
    },
    {
      id: "availability",
      title: "Service availability",
      paragraphs: [
        "We strive to keep JobPulseAI available and reliable, but the service is provided on an \"as is\" and \"as available\" basis.",
        "Sync results depend on email content, third-party platforms, and network availability. We do not guarantee that every application or status change will be detected.",
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimer of warranties",
      paragraphs: [
        "To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
        `${APP_NAME} is an organizational tool and does not provide legal, career, or employment advice.`,
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, or opportunities arising from your use of the service.",
        "Our total liability for any claim related to the service is limited to the greater of the amount you paid us in the twelve months before the claim or USD $100.",
      ],
    },
    {
      id: "termination",
      title: "Suspension and termination",
      paragraphs: [
        "You may stop using the service at any time by signing out, deleting your synced data, and revoking Google access.",
        "We may suspend or terminate access if you violate these Terms, create risk for other users, or are required to do so by law.",
      ],
    },
    {
      id: "changes-terms",
      title: "Changes to these Terms",
      paragraphs: [
        "We may update these Terms from time to time. Material changes will be reflected by updating the date above.",
        "Continued use after updated Terms are posted constitutes acceptance.",
      ],
    },
    {
      id: "contact-terms",
      title: "Contact",
      paragraphs: [
        `Questions about these Terms can be sent to ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};
