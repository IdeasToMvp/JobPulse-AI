import type {
  Application,
  ApplicationExtractedDetails,
  ApplicationUserDetails,
} from "@/lib/types/application";

function formatIndianNumber(value: number): string {
  const negative = value < 0;
  const digits = Math.abs(value).toString();
  if (digits.length <= 3) return negative ? `-${digits}` : digits;

  const lastThree = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const groups: string[] = [];

  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) groups.unshift(rest);

  const formatted = `${groups.join(",")},${lastThree}`;
  return negative ? `-${formatted}` : formatted;
}

export function formatSalaryDisplay(salary: string): string {
  return salary.replace(/\d{4,}/g, (match) =>
    formatIndianNumber(Number.parseInt(match, 10)),
  );
}

export function displaySalary(app: Application): string | null {
  const user = app.userDetails?.salary;
  const raw =
    user && user.length > 0 ? user : app.extractedDetails?.salary;
  if (!raw || raw.length === 0) return null;
  return formatSalaryDisplay(raw);
}

export function displayLocation(app: Application): string | null {
  const user = app.userDetails?.location;
  if (user && user.length > 0) return user;
  return app.extractedDetails?.location ?? null;
}

export function formatApplicationDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWorkMode(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function hasUserDetails(
  details?: ApplicationUserDetails,
): boolean {
  if (!details) return false;
  return (
    (details.location?.length ?? 0) > 0 ||
    (details.salary?.length ?? 0) > 0 ||
    details.numberOfRounds != null ||
    (details.workMode?.length ?? 0) > 0 ||
    (details.notes?.length ?? 0) > 0
  );
}

export function hasExtractedDetails(
  details?: ApplicationExtractedDetails,
): boolean {
  if (!details) return false;
  return (
    (details.role?.length ?? 0) > 0 ||
    (details.salary?.length ?? 0) > 0 ||
    (details.location?.length ?? 0) > 0 ||
    (details.employmentType?.length ?? 0) > 0
  );
}

export interface UserDetailsFormValues {
  role: string;
  location: string;
  salary: string;
  rounds: string;
  workMode: ApplicationUserDetails["workMode"] | null;
  notes: string;
}

export function userDetailsFormHasAny(values: UserDetailsFormValues): boolean {
  return (
    values.role.trim().length > 0 ||
    values.location.trim().length > 0 ||
    values.salary.trim().length > 0 ||
    values.rounds.trim().length > 0 ||
    values.workMode != null ||
    values.notes.trim().length > 0
  );
}

export function buildUserDetailsPatchPayload(
  values: UserDetailsFormValues,
): ApplicationUserDetails {
  const roundsRaw = values.rounds.trim();
  const rounds = roundsRaw.length > 0 ? Number.parseInt(roundsRaw, 10) : null;

  return {
    location: values.location.trim(),
    salary: values.salary.trim(),
    notes: values.notes.trim(),
    ...(rounds != null && !Number.isNaN(rounds)
      ? { numberOfRounds: rounds }
      : {}),
    ...(values.workMode ? { workMode: values.workMode } : {}),
  };
}

export function buildOptionalStatusDetailsPayload(
  values: UserDetailsFormValues,
): ApplicationUserDetails | undefined {
  if (!userDetailsFormHasAny(values)) return undefined;

  const payload = buildUserDetailsPatchPayload(values);
  const jsonPayload: ApplicationUserDetails = {};

  if (payload.location) jsonPayload.location = payload.location;
  if (payload.salary) jsonPayload.salary = payload.salary;
  if (payload.notes) jsonPayload.notes = payload.notes;
  if (payload.numberOfRounds != null) {
    jsonPayload.numberOfRounds = payload.numberOfRounds;
  }
  if (payload.workMode) jsonPayload.workMode = payload.workMode;

  return Object.keys(jsonPayload).length > 0 ? jsonPayload : undefined;
}

export function filterApplications(
  applications: Application[],
  statusFilter: string,
  searchQuery?: string,
): Application[] {
  const sorted = [...applications].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  let result =
    statusFilter === "applied"
      ? sorted
      : sorted.filter((app) => app.status === statusFilter);

  const q = searchQuery?.toLowerCase().trim() ?? "";
  if (q.length > 0) {
    result = result.filter(
      (app) =>
        app.company.toLowerCase().includes(q) ||
        (app.role?.toLowerCase().includes(q) ?? false),
    );
  }

  return result;
}
