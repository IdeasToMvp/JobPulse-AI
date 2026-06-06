import { ChevronDown } from "lucide-react";

import {
  formatStatusLabel,
  getStatusColor,
} from "@/lib/constants/application-status";
import { cn } from "@/lib/utils";

interface ApplicationStatusBadgeProps {
  status: string;
  onClick?: () => void;
  className?: string;
}

export function ApplicationStatusBadge({
  status,
  onClick,
  className,
}: ApplicationStatusBadgeProps) {
  const color = getStatusColor(status);

  const badge = (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide sm:min-h-0 sm:px-2.5 sm:py-1",
        !onClick && className,
      )}
      style={{
        color,
        backgroundColor: `${color}1F`,
      }}
    >
      {formatStatusLabel(status)}
      {onClick ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : null}
    </span>
  );

  if (!onClick) return badge;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "relative z-[3] shrink-0 touch-manipulation rounded-full transition-opacity active:opacity-70 hover:opacity-80",
        className,
      )}
    >
      {badge}
    </button>
  );
}
