import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { VALID_JOB_PLATFORM_IDS } from '../../users/job-platforms';
import { ApplicationUserDetailsDto } from './application-user-details.dto';
import { MANUAL_APPLICATION_STATUSES } from './update-application-status.dto';

export class CreateManualApplicationDto {
  @IsNotEmpty()
  @MaxLength(200)
  company!: string;

  @IsNotEmpty()
  @MaxLength(200)
  role!: string;

  @IsIn(VALID_JOB_PLATFORM_IDS as unknown as string[])
  platformId!: string;

  @IsIn(MANUAL_APPLICATION_STATUSES as unknown as string[])
  status!: (typeof MANUAL_APPLICATION_STATUSES)[number];

  @IsDateString()
  appliedAt!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationUserDetailsDto)
  details?: ApplicationUserDetailsDto;
}
