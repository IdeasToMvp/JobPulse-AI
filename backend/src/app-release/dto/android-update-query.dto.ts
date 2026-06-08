import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AndroidUpdateQueryDto {
  @IsOptional()
  @IsString()
  version?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  buildNumber!: number;
}
