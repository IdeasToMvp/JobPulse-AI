import { Type } from 'class-transformer';
import { IsIn, IsOptional, ValidateNested } from 'class-validator';
import { ApplicationStatus } from '../application.entity';
import {
  ApplicationUserDetailsDto,
} from './application-user-details.dto';

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

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationUserDetailsDto)
  details?: ApplicationUserDetailsDto;
}

export function isManualStatus(
  status: ApplicationStatus,
): status is ManualApplicationStatus {
  return (MANUAL_APPLICATION_STATUSES as readonly string[]).includes(status);
}
