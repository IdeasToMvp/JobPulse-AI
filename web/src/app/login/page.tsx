"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import { ApplicationPipelinePreview } from "@/components/marketing/application-pipeline-preview";
import { TrustBadges } from "@/components/marketing/feature-list";
import { MarketingHeader } from "@/components/marketing/marketing-header";

const loginBenefits = [
  "Sync applications from Gmail automatically",
  "Organize roles by status — applied, interview, offer",
  "See activity and updates as your inbox syncs",
];

export default function LoginPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#fafafa]">
      <MarketingHeader />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]">
        {/* Product preview — desktop only */}
        <section className="relative hidden min-h-0 overflow-hidden bg-[linear-gradient(145deg,#1a1a72_0%,#0f0f3d_45%,#14141f_100%)] lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-10">
          <div
            className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-secondary/15 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Your dashboard awaits
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white xl:text-4xl">
              Pick up right where your job search left off
            </h1>
            <p className="mt-3 max-w-lg text-base text-white/65">
              Sign in to view your application pipeline, recent activity, and
              sync settings — all in one workspace.
            </p>

            <ApplicationPipelinePreview className="mt-8" />
          </div>
        </section>

        {/* Sign-in panel */}
        <section className="flex min-h-0 flex-col justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:border-l lg:border-border lg:bg-white lg:px-10 lg:py-10 xl:px-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Sign in to JobPulseAI
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use your Google account to connect Gmail and start tracking
                applications.
              </p>
            </div>

            <GoogleSignInButton className="h-12 border-border bg-white text-base shadow-sm hover:bg-muted/30" />

            <ul className="mt-8 space-y-3">
              {loginBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <TrustBadges className="mt-8" />

            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
              We only read emails related to your job search. Personal messages
              are never accessed. By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <LegalFooterLinks className="mt-4" />
          </div>
        </section>
      </div>
    </div>
  );
}
