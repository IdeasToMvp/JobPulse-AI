import { ApplicationUserDetails } from './application.entity';
import { ApplicationUserDetailsDto } from './dto/application-user-details.dto';

export function hasUserDetailsContent(
  details: ApplicationUserDetails | undefined,
): boolean {
  if (!details) return false;
  return !!(
    details.location ||
    details.salary ||
    details.numberOfRounds != null ||
    details.workMode ||
    details.notes
  );
}

export function parseUserDetails(
  raw: Record<string, unknown> | null | undefined,
): ApplicationUserDetails | undefined {
  if (!raw || Object.keys(raw).length === 0) return undefined;

  const workMode = raw.workMode as ApplicationUserDetails['workMode'];
  const parsed: ApplicationUserDetails = {
    location: (raw.location as string) || undefined,
    salary: (raw.salary as string) || undefined,
    numberOfRounds:
      typeof raw.numberOfRounds === 'number' ? raw.numberOfRounds : undefined,
    workMode:
      workMode === 'remote' || workMode === 'hybrid' || workMode === 'onsite'
        ? workMode
        : undefined,
    notes: (raw.notes as string) || undefined,
    updatedAt: (raw.updatedAt as string) || undefined,
  };

  return hasUserDetailsContent(parsed) ? parsed : undefined;
}

export function mergeUserDetails(
  existing: ApplicationUserDetails | undefined,
  input: ApplicationUserDetailsDto,
  updatedAt: string,
): ApplicationUserDetails | undefined {
  const merged: ApplicationUserDetails = {
    ...existing,
    updatedAt,
  };

  if (input.location !== undefined) {
    merged.location = input.location.trim() || undefined;
  }
  if (input.salary !== undefined) {
    merged.salary = input.salary.trim() || undefined;
  }
  if (input.numberOfRounds !== undefined) {
    merged.numberOfRounds = input.numberOfRounds;
  }
  if (input.workMode !== undefined) {
    merged.workMode = input.workMode;
  }
  if (input.notes !== undefined) {
    merged.notes = input.notes.trim() || undefined;
  }

  return hasUserDetailsContent(merged) ? merged : undefined;
}

export function userDetailsToDb(
  details: ApplicationUserDetails | undefined,
): Record<string, unknown> {
  if (!details) return {};
  const row: Record<string, unknown> = { updatedAt: details.updatedAt };
  if (details.location) row.location = details.location;
  if (details.salary) row.salary = details.salary;
  if (details.numberOfRounds != null) row.numberOfRounds = details.numberOfRounds;
  if (details.workMode) row.workMode = details.workMode;
  if (details.notes) row.notes = details.notes;
  return row;
}
