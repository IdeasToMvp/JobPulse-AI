"use client";

import { ChevronRight, History, Mail } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { formatLastSync } from "@/lib/utils/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";

interface SyncOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onRescanHistory: () => void;
}

export function SyncOptionsDialog({
  open,
  onClose,
  onRescanHistory,
}: SyncOptionsDialogProps) {
  const { user } = useAuth();
  const { canRunIncrementalSync, runIncrementalSync, isSyncing } = useSync();

  async function handleIncremental() {
    onClose();
    try {
      await runIncrementalSync();
    } catch {
      // errors surfaced via sync state reset; optional toast later
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Sync options" size="sm">
      <div className="px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-sm text-muted-foreground">
          {canRunIncrementalSync
            ? `Last sync: ${formatLastSync(user?.sync.lastSyncedAt)}`
            : "Choose how you want to scan your inbox."}
        </p>

        <div className="mt-5 space-y-2.5">
          {canRunIncrementalSync ? (
            <OptionTile
              icon={Mail}
              title="Sync new emails"
              subtitle="Only mail received since your last sync"
              onClick={() => void handleIncremental()}
              disabled={isSyncing}
            />
          ) : null}

          <OptionTile
            icon={History}
            title="Rescan email history"
            subtitle="Choose a date range and scan past job emails"
            onClick={() => {
              onClose();
              onRescanHistory();
            }}
            disabled={isSyncing}
          />
        </div>
      </div>
    </Modal>
  );
}

function OptionTile({
  icon: Icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: typeof Mail;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-xl border border-border px-3.5 py-3.5 text-left transition-colors active:bg-muted/50 hover:border-primary/30 hover:bg-muted/40 disabled:opacity-60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
        <Icon className="h-5 w-5 text-secondary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
