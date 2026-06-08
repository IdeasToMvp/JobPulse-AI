import { MarketingHeader } from "@/components/marketing/marketing-header";

export function LegalPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <MarketingHeader />
      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {children}
      </main>
    </div>
  );
}
