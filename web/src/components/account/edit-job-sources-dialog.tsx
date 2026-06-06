"use client";

import { useState } from "react";

import { PlatformGrid } from "@/components/platforms/platform-grid";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { jobPlatforms } from "@/lib/constants/job-platforms";

interface EditJobSourcesDialogProps {
  open: boolean;
  selectedIds: string[];
  saving?: boolean;
  onClose: () => void;
  onSave: (platformIds: string[]) => void;
}

export function EditJobSourcesDialog({
  open,
  selectedIds,
  saving,
  onClose,
  onSave,
}: EditJobSourcesDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Job Sources" size="lg">
      {open ? (
        <EditJobSourcesForm
          key={selectedIds.join(",")}
          selectedIds={selectedIds}
          saving={saving}
          onSave={onSave}
        />
      ) : null}
    </Modal>
  );
}

function EditJobSourcesForm({
  selectedIds,
  saving,
  onSave,
}: {
  selectedIds: string[];
  saving?: boolean;
  onSave: (platformIds: string[]) => void;
}) {
  const [draft, setDraft] = useState(() => new Set(selectedIds));

  function togglePlatform(id: string) {
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex max-h-[min(70dvh,32rem)] flex-col px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="mb-4 text-sm text-muted-foreground">
        Choose where JobPulse AI should look for applications and updates.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <PlatformGrid
          platforms={jobPlatforms}
          selectedIds={draft}
          onToggle={togglePlatform}
          compact
        />
      </div>

      <Button
        fullWidth
        className="mt-4 min-h-11"
        disabled={draft.size === 0 || saving}
        onClick={() => onSave([...draft])}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
