import { IsDateString, IsOptional } from 'class-validator';

export class RunSyncDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
