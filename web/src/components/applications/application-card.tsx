import { getPlatformLabel } from "@/lib/constants/platform-labels";
import { getApplicationCardStyles, MANUAL_APPLICATION_ACCENT } from "@/lib/constants/application-status";
import type { Application } from "@/lib/types/application";
import {
  displayLocation,
  displaySalary,
  formatApplicationDate,
} from "@/lib/utils/application";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
  onStatusClick: () => void;
  className?: string;
}

export function ApplicationCard({
  application,
  onClick,
  onStatusClick,
  className,
}: ApplicationCardProps) {
  const salary = displaySalary(application);
  const location = displayLocation(application);
  const cardStyles = getApplicationCardStyles(application);

  return (
    <div
      style={
        {
          borderColor: cardStyles.border,
          backgroundColor: cardStyles.background,
          "--status-hover": cardStyles.hoverBackground,
        } as React.CSSProperties
      }
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border shadow-sm transition-[background-color,box-shadow] hover:bg-[var(--status-hover)] hover:shadow-md",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-0 z-[1] w-1"
        style={{ backgroundColor: cardStyles.accent }}
        aria-hidden
      />

      <button
        type="button"
        onClick={onClick}
        aria-label={`View details for ${application.company}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />

      <div className="pointer-events-none relative z-[2] p-3 pl-4 sm:p-4 sm:pl-5">
          <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground break-words sm:truncate sm:text-base">
              {application.company}
            </p>

            <ApplicationStatusBadge
              status={application.status}
              onClick={onStatusClick}
              className="pointer-events-auto shrink-0"
            />
          </div>

          {(application.companyApplyCount ?? 0) > 1 ? (
            <p className="-mt-1 truncate text-[11px] font-medium text-secondary">
              {application.companyApplyCount} applications
              {application.companyRoles?.length
                ? ` · ${application.companyRoles.join(", ")}`
                : ""}
            </p>
          ) : null}

          {application.role ? (
            <p className="truncate text-sm text-muted-foreground">
              {application.role}
            </p>
          ) : null}

          {salary || location ? (
            <div className="flex flex-wrap gap-1.5">
              {salary ? <InfoChip label={salary} /> : null}
              {location ? <InfoChip label={location} /> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <SourceLabels application={application} />
              {application.isManual ? (
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${MANUAL_APPLICATION_ACCENT}26`,
                    color: MANUAL_APPLICATION_ACCENT,
                  }}
                >
                  Manual
                </span>
              ) : null}
            </div>

            <div className="space-y-0.5 text-xs text-muted-foreground sm:text-right">
              <p>Applied {formatApplicationDate(application.appliedAt)}</p>
              <p className="text-secondary">
                Updated {formatApplicationDate(application.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="inline-block max-w-full truncate rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
      {label}
    </span>
  );
}

function SourceLabels({ application }: { application: Application }) {
  const ids =
    application.platformIds && application.platformIds.length > 0
      ? application.platformIds
      : [application.platformId];

  if (ids.length === 1) {
    return (
      <p className="text-xs text-muted-foreground">
        {getPlatformLabel(ids[0]!)}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ids.map((id) => (
        <span
          key={id}
          className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {getPlatformLabel(id)}
        </span>
      ))}
    </div>
  );
}
