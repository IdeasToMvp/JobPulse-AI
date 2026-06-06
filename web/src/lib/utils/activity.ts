import type { ActivityItem, ActivityType } from "@/lib/types/activity";

export function formatRelativeTimestamp(iso: string): string {
  const now = Date.now();
  const local = new Date(iso);
  const diffMs = now - local.getTime();

  if (diffMs < 60_000) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours}h ago`;

  const today = startOfDay(new Date());
  const day = startOfDay(local);
  const dayDiff = Math.floor((today.getTime() - day.getTime()) / 86_400_000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff}d ago`;

  return local.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function activityDateGroupLabel(iso: string): string {
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(iso));
  const dayDiff = Math.floor((today.getTime() - day.getTime()) / 86_400_000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return "Older";
}

export interface ActivityGroup {
  label: string;
  items: ActivityItem[];
}

export function groupActivityItems(items: ActivityItem[]): ActivityGroup[] {
  const map = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const label = activityDateGroupLabel(item.timestamp);
    const group = map.get(label) ?? [];
    group.push(item);
    map.set(label, group);
  }

  const order = ["Today", "Yesterday", "Older"];
  return order
    .filter((label) => map.has(label))
    .map((label) => ({ label, items: map.get(label)! }));
}

export function parseActivityDescription(description: string): {
  subtitle: string;
  detail: string | null;
} {
  const lines = description.split("\n").filter(Boolean);
  if (lines.length === 0) return { subtitle: description, detail: null };
  return {
    subtitle: lines[0]!,
    detail: lines.length > 1 ? lines.slice(1).join("\n") : null,
  };
}

export function getActivityTypeColor(type: ActivityType): string {
  switch (type) {
    case "application":
      return "#8B5CF6";
    case "status_update":
      return "#F59E0B";
    case "suggestion":
      return "#8B5CF6";
    case "sync":
      return "#2E3192";
    case "user_action":
      return "#8E8E98";
    default:
      return "#8B5CF6";
  }
}

export function companyAvatarStyle(name: string): {
  backgroundColor: string;
} {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    backgroundColor: `hsl(${hue} 45% 55%)`,
  };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
