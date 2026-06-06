"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ApplicationPipelinePreview } from "@/components/marketing/application-pipeline-preview";
import { FeatureList } from "@/components/marketing/feature-list";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <MarketingHeader />

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        {/* Hero panel — desktop only */}
        <section className="relative hidden min-h-0 overflow-hidden bg-[linear-gradient(145deg,#1a1a72_0%,#0f0f3d_45%,#14141f_100%)] lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-8 xl:px-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"
            aria-hidden
          />

          <div className="relative flex min-h-0 flex-col justify-center gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Job application manager
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
                Manage every application in one place
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                JobPulseAI syncs your job search emails into a structured pipeline.
              </p>
            </div>

            <ApplicationPipelinePreview compact />
          </div>
        </section>

        {/* Main panel */}
        <section className="flex min-h-0 flex-col overflow-hidden px-5 py-5 sm:px-8 lg:px-10 lg:py-8">
          <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              Built for active job seekers
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A web dashboard that updates as your inbox does.
            </p>

            <FeatureList compact className="mt-6 sm:mt-8" />
          </div>

          <div className="shrink-0 space-y-3 pb-[env(safe-area-inset-bottom)]">
            <Link href="/login" className="block">
              <Button size="lg" fullWidth className="h-11 text-sm sm:h-12 sm:text-base">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Free to start · Connect Gmail in under a minute
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
