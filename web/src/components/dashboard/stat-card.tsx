import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StatCardConfig {
  icon: LucideIcon;
  label: string;
  value: number;
  iconColor: string;
  accentColor?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  accentColor,
}: StatCardConfig) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm",
        accentColor && "pl-5",
      )}
    >
      {accentColor ? (
        <div
          className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: accentColor }}
        />
      ) : null}

      <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} />
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </p>
    </div>
  );
}

interface StatGridProps {
  stats: StatCardConfig[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
