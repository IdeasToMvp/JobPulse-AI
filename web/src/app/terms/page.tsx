import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { termsOfService } from "@/lib/legal/content";
import { getTermsOfServiceUrl } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service · JobPulseAI",
  description: termsOfService.summary,
  alternates: {
    canonical: getTermsOfServiceUrl(),
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell>
      <LegalDocumentView document={termsOfService} />
    </LegalPageShell>
  );
}
