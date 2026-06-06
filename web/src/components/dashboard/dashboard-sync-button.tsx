"use client";

import { Check, Loader2, RefreshCw } from "lucide-react";

import { useSync } from "@/lib/sync/sync-context";
import { cn } from "@/lib/utils";

interface DashboardSyncButtonProps {
  onClick: () => void;
  className?: string;
}

export function DashboardSyncButton({
  onClick,
  className,
}: DashboardSyncButtonProps) {
  const { syncButtonState } = useSync();
  const isSyncing = syncButtonState === "syncing";
  const isSuccess = syncButtonState === "success";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSyncing}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-secondary/35 bg-login-security px-3 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      {isSyncing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary" />
      ) : isSuccess ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 text-secondary" />
      )}
      {isSyncing ? "Syncing..." : isSuccess ? "Updated" : "Sync"}
    </button>
  );
}
