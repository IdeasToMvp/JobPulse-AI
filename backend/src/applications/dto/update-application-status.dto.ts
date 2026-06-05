import { IsIn } from 'class-validator';
import { ApplicationStatus } from '../application.entity';

export const MANUAL_APPLICATION_STATUSES = [
  'applied',
  'active',
  'interview',
  'offer',
  'rejected',
] as const;

export type ManualApplicationStatus = (typeof MANUAL_APPLICATION_STATUSES)[number];

export class UpdateApplicationStatusDto {
  @IsIn(MANUAL_APPLICATION_STATUSES as unknown as string[])
  status!: ManualApplicationStatus;
}

export function isManualStatus(
  status: ApplicationStatus,
): status is ManualApplicationStatus {
  return (MANUAL_APPLICATION_STATUSES as readonly string[]).includes(status);
}
