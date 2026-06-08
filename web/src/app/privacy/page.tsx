import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { privacyPolicy } from "@/lib/legal/content";
import { getPrivacyPolicyUrl } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy · JobPulseAI",
  description: privacyPolicy.summary,
  alternates: {
    canonical: getPrivacyPolicyUrl(),
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <LegalDocumentView document={privacyPolicy} />
    </LegalPageShell>
  );
}
