"use client";

import {
  ArrowRight,
  Globe,
  Smartphone,
  Download,
  Apple,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ApplicationPipelinePreview } from "@/components/marketing/application-pipeline-preview";
import { FeatureList, TrustBadges } from "@/components/marketing/feature-list";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";
import { getAndroidApkDownloadUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

export function LandingView() {
  const androidApkUrl = getAndroidApkDownloadUrl();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <MarketingHeader />

      <div className="grid flex-1 lg:grid-cols-2">
        {/* Hero — desktop */}
        <section className="relative hidden min-h-0 overflow-hidden bg-[linear-gradient(145deg,#1a1a72_0%,#0f0f3d_45%,#14141f_100%)] lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-10 xl:px-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col justify-center gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Job application manager
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-[2.75rem] xl:leading-tight">
                Track every application from your inbox
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 xl:text-base">
                JobPulseAI syncs Gmail into a structured pipeline — on mobile
                or web. Install the app or sign in from your browser.
              </p>
            </div>

            <ApplicationPipelinePreview compact />
          </div>
        </section>

        {/* Main content */}
        <section className="flex flex-col px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              JobPulseAI
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Track every application from your inbox
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Install on Android or use the web dashboard — no spam, just your
              job search.
            </p>
          </div>

          <div className="mt-8 lg:mt-0">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Get JobPulseAI
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how you want to use it.
            </p>

            <div className="mt-5 space-y-3">
              <InstallOption
                icon={Smartphone}
                iconClassName="bg-[#3DDC84]/15 text-[#1B8D4E]"
                title="Android app"
                description={
                  androidApkUrl
                    ? "Download the APK and install on your device."
                    : "APK download link will be available here soon."
                }
                action={
                  androidApkUrl ? (
                    <a
                      href={androidApkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#1B8D4E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#167A43] sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download APK
                    </a>
                  ) : (
                    <Button
                      disabled
                      className="min-h-11 w-full bg-[#1B8D4E]/40 sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download APK
                    </Button>
                  )
                }
              />

              <InstallOption
                icon={Apple}
                iconClassName="bg-muted text-muted-foreground"
                title="iOS app"
                description="App Store release coming soon."
                action={
                  <Button
                    variant="outline"
                    disabled
                    className="min-h-11 w-full sm:w-auto"
                  >
                    Coming soon
                  </Button>
                }
                muted
              />

              <InstallOption
                icon={Globe}
                iconClassName="bg-primary/10 text-primary"
                title="Web dashboard"
                description="Sign in with Google and sync Gmail in your browser."
                action={
                  <Link href="/login" className="block sm:inline-block">
                    <Button className="min-h-11 w-full sm:w-auto">
                      Sign in on web
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                }
                highlighted
              />
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Why JobPulseAI
            </h2>
            <FeatureList compact className="mt-5" />
            <TrustBadges className="mt-6" />
          </div>

          <p className="mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground lg:text-left">
            Free to start · Gmail OAuth · Job-related emails only
          </p>
        </section>
      </div>
    </div>
  );
}

function InstallOption({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  highlighted,
  muted,
}: {
  icon: typeof Smartphone;
  iconClassName: string;
  title: string;
  description: string;
  action: ReactNode;
  highlighted?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        highlighted
          ? "border-primary/25 bg-primary/[0.03] ring-1 ring-primary/10"
          : "border-border bg-white",
        muted && "opacity-80",
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-2">{action}</div>
    </div>
  );
}
