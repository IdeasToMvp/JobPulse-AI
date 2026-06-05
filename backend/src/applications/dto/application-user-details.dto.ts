import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const USER_WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;
export type UserWorkMode = (typeof USER_WORK_MODES)[number];

export class ApplicationUserDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  salary?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  numberOfRounds?: number;

  @IsOptional()
  @IsIn(USER_WORK_MODES as unknown as string[])
  workMode?: UserWorkMode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
