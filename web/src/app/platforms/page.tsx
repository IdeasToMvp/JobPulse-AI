"use client";

import { ArrowRight, Info, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PlatformGrid } from "@/components/platforms/platform-grid";
import { Button } from "@/components/ui/button";
import { saveJobSources } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { jobPlatforms } from "@/lib/constants/job-platforms";
import type { UserProfile } from "@/lib/types/user";

interface PlatformsContentProps {
  user: UserProfile;
}

function PlatformsContent({ user }: PlatformsContentProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(user.jobSources),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    if (selectedIds.size === 0 || isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      await saveJobSources([...selectedIds]);
      await refreshUser();
      router.replace("/dashboard");
    } catch {
      setError("Failed to save job sources. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const progress = selectedIds.size > 0 ? 100 : 50;

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-2">
      {/* Context panel — desktop only */}
      <section className="relative hidden min-h-0 overflow-hidden bg-[linear-gradient(145deg,#1a1a72_0%,#0f0f3d_45%,#14141f_100%)] lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-8 xl:px-12">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-md">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Gmail scan setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white">
            Tell us where you apply
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            JobPulseAI only scans emails from the platforms you select — job
            alerts, apply confirmations, and recruiter replies.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-white/75">
            <li className="flex gap-2">
              <span className="text-secondary">·</span>
              LinkedIn, Indeed, Naukri, and other job boards
            </li>
            <li className="flex gap-2">
              <span className="text-secondary">·</span>
              Company career pages and referral emails
            </li>
            <li className="flex gap-2">
              <span className="text-secondary">·</span>
              Personal emails are never read
            </li>
          </ul>
        </div>
      </section>

      {/* Selection panel */}
      <section className="flex min-h-0 flex-col overflow-hidden px-5 py-5 sm:px-8 lg:px-10 lg:py-6">
        <div className="shrink-0">
          <div className="mb-4 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Where do you apply?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Select every platform you actively use. You can change this later in
            account settings.
          </p>
        </div>

        <div className="min-h-0 flex-1 py-4">
          <PlatformGrid
            platforms={jobPlatforms}
            selectedIds={selectedIds}
            onToggle={togglePlatform}
            compact
          />
        </div>

        <div className="shrink-0 space-y-3 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-start gap-2 rounded-xl border border-border bg-platforms-benefits px-3 py-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Select all platforms you use — the more accurate your list, the
              better your pipeline syncs.
            </p>
          </div>

          {error ? (
            <p className="text-center text-sm text-error">{error}</p>
          ) : null}

          <Button
            size="lg"
            fullWidth
            className="h-11 sm:h-12"
            disabled={selectedIds.size === 0 || isSaving}
            onClick={() => void handleContinue()}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Continue to dashboard
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            {selectedIds.size === 0
              ? "Select at least one platform to continue"
              : `${selectedIds.size} platform${selectedIds.size === 1 ? "" : "s"} selected`}
          </p>
        </div>
      </section>
    </div>
  );
}

export default function PlatformsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <MarketingHeader />
      <PlatformsContent user={user} />
    </div>
  );
}
