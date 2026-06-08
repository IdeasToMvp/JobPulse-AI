import Link from "next/link";

import type { LegalDocument } from "@/lib/legal/content";
import { cn } from "@/lib/utils";

interface LegalDocumentViewProps {
  document: LegalDocument;
  className?: string;
}

export function LegalDocumentView({
  document,
  className,
}: LegalDocumentViewProps) {
  return (
    <article className={cn("mx-auto w-full max-w-3xl", className)}>
      <header className="border-b border-border pb-6 sm:pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          JobPulseAI
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {document.lastUpdated}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {document.summary}
        </p>
      </header>

      <nav
        aria-label="Table of contents"
        className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 sm:mt-8 sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          On this page
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-primary transition-colors hover:text-primary/80"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
        {document.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24"
          >
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-4 list-disc space-y-2 pl-5">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground sm:mt-12">
        <p>
          See also:{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Home
          </Link>
        </p>
      </footer>
    </article>
  );
}
