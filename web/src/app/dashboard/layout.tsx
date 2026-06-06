"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/sync-context";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!user?.jobSources.length) {
      router.replace("/platforms");
    }
  }, [isAuthenticated, isLoading, router, user?.jobSources.length]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.jobSources.length) {
    return null;
  }

  return (
    <SyncProvider>
      <AppShell>{children}</AppShell>
    </SyncProvider>
  );
}
