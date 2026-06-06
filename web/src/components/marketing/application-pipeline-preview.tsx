import { cn } from "@/lib/utils";

const pipelineColumns = [
  {
    title: "Applied",
    color: "bg-blue-500",
    count: 12,
    cards: [
      { company: "Stripe", role: "Product Designer", platform: "LinkedIn" },
    ],
  },
  {
    title: "Interview",
    color: "bg-amber-500",
    count: 4,
    cards: [{ company: "Figma", role: "Design Systems", platform: "Referral" }],
  },
  {
    title: "Offer",
    color: "bg-emerald-500",
    count: 1,
    cards: [
      { company: "Linear", role: "Staff Engineer", platform: "Wellfound" },
    ],
  },
];

interface ApplicationPipelinePreviewProps {
  className?: string;
  compact?: boolean;
}

export function ApplicationPipelinePreview({
  className,
  compact,
}: ApplicationPipelinePreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm",
        className,
      )}
    >
      <div className={cn("border-b border-white/10", compact ? "px-3 py-2" : "px-4 py-3")}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium text-white/60">Preview</p>
            <p className={cn("font-semibold text-white", compact ? "text-xs" : "text-sm")}>
              Application pipeline
            </p>
          </div>
        </div>
      </div>

      <div className={cn("grid grid-cols-3", compact ? "gap-2 p-3" : "gap-3 p-4")}>
        {pipelineColumns.map((column) => (
          <div key={column.title} className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", column.color)} />
              <span className="truncate text-[10px] font-medium text-white/70">
                {column.title}
              </span>
              <span className="ml-auto rounded bg-white/10 px-1 py-px text-[9px] font-semibold text-white/80">
                {column.count}
              </span>
            </div>
            {column.cards.slice(0, 1).map((card) => (
              <div
                key={`${column.title}-${card.company}`}
                className={cn(
                  "rounded-lg border border-white/10 bg-white/10",
                  compact ? "p-2" : "p-3",
                )}
              >
                <p className={cn("truncate font-medium text-white", compact ? "text-[11px]" : "text-sm")}>
                  {card.role}
                </p>
                <p className={cn("truncate text-white/60", compact ? "text-[10px]" : "text-xs")}>
                  {card.company}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
