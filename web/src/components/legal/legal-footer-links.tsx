import Link from "next/link";

import { cn } from "@/lib/utils";

export function LegalFooterLinks({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      <Link href="/privacy" className="font-medium text-primary hover:underline">
        Privacy Policy
      </Link>
      {" · "}
      <Link href="/terms" className="font-medium text-primary hover:underline">
        Terms of Service
      </Link>
    </p>
  );
}
