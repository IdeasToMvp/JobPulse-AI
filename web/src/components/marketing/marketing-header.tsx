"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { cn } from "@/lib/utils";

interface MarketingHeaderProps {
  className?: string;
}

export function MarketingHeader({ className }: MarketingHeaderProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isPlatforms = pathname === "/platforms";

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4 sm:px-6 lg:px-10",
        className,
      )}
    >
      <BrandLogo href="/onboarding" showSubtitle />

      {isPlatforms ? (
        <div className="text-right">
          <p className="text-[11px] font-medium text-muted-foreground">
            Setup
          </p>
          <p className="text-xs font-semibold text-foreground">Step 2 of 2</p>
        </div>
      ) : isLogin ? (
        <Link
          href="/onboarding"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Get started
        </Link>
      ) : (
        <Link
          href="/login"
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
