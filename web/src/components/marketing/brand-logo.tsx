import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md";
  showSubtitle?: boolean;
  inverted?: boolean;
}

export function BrandLogo({
  className,
  href = "/",
  size = "md",
  showSubtitle = false,
  inverted = false,
}: BrandLogoProps) {
  const iconSize = size === "sm" ? 32 : 36;

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/app-icon.png"
        alt="JobPulseAI"
        width={iconSize}
        height={iconSize}
        className="rounded-lg shadow-sm"
        priority
      />
      <div>
        <p
          className={cn(
            "font-semibold leading-none",
            size === "sm" ? "text-sm" : "text-base",
            inverted ? "text-white" : "text-foreground",
          )}
        >
          JobPulseAI
        </p>
        {showSubtitle ? (
          <p
            className={cn(
              "mt-0.5 text-[11px]",
              inverted ? "text-white/60" : "text-muted-foreground",
            )}
          >
            Application tracker
          </p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
