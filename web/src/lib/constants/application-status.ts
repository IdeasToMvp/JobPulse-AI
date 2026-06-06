import type { StatusFilterId } from "@/lib/types/application";

export const STATUS_FILTERS: Array<{ id: StatusFilterId; label: string }> = [
  { id: "applied", label: "Applied" },
  { id: "active", label: "Active" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
  { id: "ghosted", label: "Ghosted" },
];

export const MANUAL_APPLICATION_STATUSES = [
  "applied",
  "active",
  "interview",
  "offer",
  "rejected",
] as const;

export function formatStatusLabel(status: string): string {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "applied":
      return "#60A5FA";
    case "active":
    case "assessment":
      return "#8B5CF6";
    case "interview":
      return "#F59E0B";
    case "offer":
      return "#22C55E";
    case "rejected":
      return "#EF4444";
    case "ghosted":
      return "#8E8E98";
    default:
      return "#8B5CF6";
  }
}

export const MANUAL_APPLICATION_ACCENT = "#0D9488";

export function getStatusCardStyles(status: string): {
  accent: string;
  border: string;
  background: string;
  hoverBackground: string;
} {
  const accent = getStatusColor(status);
  return {
    accent,
    border: `${accent}40`,
    background: `${accent}0F`,
    hoverBackground: `${accent}1A`,
  };
}

export function getApplicationCardStyles(application: {
  status: string;
  isManual?: boolean;
}): {
  accent: string;
  border: string;
  background: string;
  hoverBackground: string;
} {
  if (application.isManual) {
    const accent = MANUAL_APPLICATION_ACCENT;
    return {
      accent,
      border: `${accent}40`,
      background: `${accent}0F`,
      hoverBackground: `${accent}1A`,
    };
  }

  return getStatusCardStyles(application.status);
}
