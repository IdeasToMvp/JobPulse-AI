import {
  Activity,
  Inbox,
  Kanban,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: Inbox,
    title: "Inbox sync",
    description:
      "Pull applications from Gmail — LinkedIn, Indeed, Naukri, and more.",
  },
  {
    icon: Kanban,
    title: "Pipeline view",
    description: "Track every role from applied to offer in one board.",
  },
  {
    icon: Mail,
    title: "Recruiter threads",
    description: "Follow-ups and interview invites tied to each role.",
  },
  {
    icon: Activity,
    title: "Activity feed",
    description: "Status changes and sync updates in one timeline.",
  },
];

interface FeatureListProps {
  className?: string;
  compact?: boolean;
}

export function FeatureList({ className, compact }: FeatureListProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2",
        compact ? "gap-x-4 gap-y-3" : "gap-4 sm:grid-cols-2",
        className,
      )}
    >
      {features.map((feature) => (
        <div key={feature.title} className="flex gap-2.5">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
              compact ? "h-8 w-8" : "h-10 w-10",
            )}
          >
            <feature.icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </div>
          <div className="min-w-0">
            <h3
              className={cn(
                "font-semibold text-foreground",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {feature.title}
            </h3>
            <p
              className={cn(
                "leading-snug text-muted-foreground",
                compact ? "mt-0.5 text-[11px]" : "mt-1 text-sm",
              )}
            >
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrustBadges({ className }: { className?: string }) {
  const badges = [
    { icon: ShieldCheck, label: "Gmail OAuth only" },
    { icon: Mail, label: "Job emails scoped" },
  ];

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <badge.icon className="h-3.5 w-3.5 text-primary" />
          {badge.label}
        </div>
      ))}
    </div>
  );
}
