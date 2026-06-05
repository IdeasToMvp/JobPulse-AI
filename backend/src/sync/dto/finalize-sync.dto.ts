import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class FinalizeSyncDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  maxInternalDate?: string;

  @IsOptional()
  @IsNumber()
  newMessages?: number;

  @IsOptional()
  @IsNumber()
  skippedProcessed?: number;

  @IsOptional()
  @IsNumber()
  aiCalls?: number;

  @IsOptional()
  @IsNumber()
  companyEmailsProcessed?: number;

  @IsOptional()
  @IsNumber()
  companiesDiscovered?: number;

  @IsOptional()
  @IsNumber()
  companiesScanned?: number;
}
