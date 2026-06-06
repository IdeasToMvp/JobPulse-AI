"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="space-y-5 px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="min-h-11 sm:min-w-[6rem]"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "primary" : "secondary"}
            className={
              destructive
                ? "min-h-11 bg-error hover:bg-error/90 sm:min-w-[6rem]"
                : "min-h-11 sm:min-w-[6rem]"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
