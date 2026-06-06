"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth/auth-context";

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/onboarding");
        return;
      }

      if (!user?.jobSources.length) {
        router.replace("/platforms");
        return;
      }

      router.replace("/dashboard");
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router, user?.jobSources.length]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-splash px-6 text-white">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
        <div className="h-8 w-8 animate-pulse rounded-full bg-secondary/80" />
      </div>
      <h1 className="text-2xl font-semibold sm:text-3xl">JobPulseAI</h1>
      <p className="mt-2 text-sm text-white/70 sm:text-base">
        Syncing your career trajectory
      </p>
      <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  );
}
