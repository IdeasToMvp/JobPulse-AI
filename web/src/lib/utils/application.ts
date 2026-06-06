import type { Application } from "@/lib/types/application";

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

export function filterApplications(
  applications: Application[],
  statusFilter: string,
): Application[] {
  const sorted = [...applications].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (statusFilter === "applied") return sorted;
  return sorted.filter((app) => app.status === statusFilter);
}
