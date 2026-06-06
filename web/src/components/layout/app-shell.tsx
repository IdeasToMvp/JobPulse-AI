"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Briefcase,
  Home,
  User,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/account", label: "Account", icon: User },
];

function NavLink({
  href,
  label,
  icon: Icon,
  compact,
}: NavItem & { compact?: boolean }) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        compact
          ? "min-w-0 w-full flex-col gap-1 px-1 py-2 text-[10px] leading-tight sm:text-xs"
          : "w-full",
        isActive
          ? "bg-secondary/15 text-secondary ring-1 ring-secondary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("shrink-0", compact ? "h-5 w-5" : "h-5 w-5")} />
      <span className={cn(compact && "w-full truncate text-center")}>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const containedMain =
    pathname.startsWith("/dashboard/applications") ||
    pathname.startsWith("/dashboard/activity");

  return (
    <div className="flex min-h-dvh bg-dashboard">
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-white md:px-4 md:py-6">
        <div className="mb-8 px-1">
          <BrandLogo href="/dashboard" showSubtitle />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </aside>

      {/* Mobile: locked viewport with scrollable main + pinned bottom nav (Flutter-style) */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden md:pl-64",
          containedMain ? "h-dvh" : "h-dvh md:h-auto md:min-h-dvh md:overflow-visible",
        )}
      >
        <header className="z-10 flex h-14 shrink-0 items-center border-b border-border bg-white px-4 md:hidden">
          <BrandLogo href="/dashboard" size="sm" showSubtitle />
        </header>

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            containedMain
              ? "overflow-hidden"
              : "overflow-x-hidden overflow-y-auto md:overflow-visible",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
              containedMain && "flex min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            {children}
          </div>
        </main>

        <nav
          aria-label="Main navigation"
          className="shrink-0 border-t border-border bg-white md:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-0.5 px-1 py-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} compact />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
