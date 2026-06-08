import {
  CalendarDays,
  CheckCircle2,
  EyeOff,
  Send,
  XCircle,
  Zap,
} from "lucide-react";

import type { StatCardConfig } from "@/components/dashboard/stat-card";
import type { UserSyncState } from "@/lib/types/user";

export function buildStatCards(sync: UserSyncState): StatCardConfig[] {
  return [
    {
      icon: Send,
      label: "Applied",
      value: sync.appliedCount,
      iconColor: "#60A5FA",
      statusFilter: "applied",
    },
    {
      icon: Zap,
      label: "Active",
      value: sync.activeCount,
      iconColor: "#8B5CF6",
      statusFilter: "active",
    },
    {
      icon: CalendarDays,
      label: "Interviews",
      value: sync.interviewsCount,
      iconColor: "#F59E0B",
      accentColor: "#F59E0B",
      statusFilter: "interview",
    },
    {
      icon: CheckCircle2,
      label: "Offers",
      value: sync.offersCount,
      iconColor: "#22C55E",
      accentColor: "#22C55E",
      statusFilter: "offer",
    },
    {
      icon: XCircle,
      label: "Rejected",
      value: sync.rejectedCount,
      iconColor: "#EF4444",
      accentColor: "#EF4444",
      statusFilter: "rejected",
    },
    {
      icon: EyeOff,
      label: "Ghosted",
      value: sync.ghostedCount,
      iconColor: "#8E8E98",
      statusFilter: "ghosted",
    },
  ];
}
