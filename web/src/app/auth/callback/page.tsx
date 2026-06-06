"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeSignIn } = useAuth();
  const [asyncError, setAsyncError] = useState<string | null>(null);

  const authError = searchParams.get("error");
  const token = searchParams.get("token");

  const error = authError
    ? decodeURIComponent(authError)
    : !token
      ? "Sign-in completed but no session token was returned."
      : asyncError;

  useEffect(() => {
    if (error || !token) return;

    void completeSignIn(token)
      .then(() => router.replace("/platforms"))
      .catch(() => {
        setAsyncError("Could not complete sign-in. Please try again.");
      });
  }, [completeSignIn, error, router, token]);

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-xl font-semibold text-error">Sign-in failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Suspense
        fallback={
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
