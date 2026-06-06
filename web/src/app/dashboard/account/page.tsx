"use client";

import { Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile and sync preferences.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          {user.picture ? (
            <Image
              src={user.picture}
              alt={user.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Job sources</dt>
            <dd className="font-medium">{user.jobSources.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Auto sync</dt>
            <dd className="font-medium">
              {user.syncSettings.autoSyncEnabled ? "Enabled" : "Disabled"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Applications tracked</dt>
            <dd className="font-medium">{user.sync.applicationsCount}</dd>
          </div>
        </dl>
      </Card>

      <Button variant="outline" fullWidth onClick={() => void handleSignOut()}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
