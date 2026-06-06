"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LandingView } from "@/components/marketing/landing-view";
import { useAuth } from "@/lib/auth/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    if (!user.jobSources.length) {
      router.replace("/platforms");
      return;
    }

    router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening your dashboard…</p>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return <LandingView />;
}
