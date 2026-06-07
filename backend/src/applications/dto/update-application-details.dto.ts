import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApplicationUserDetailsDto } from './application-user-details.dto';

export class UpdateApplicationDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @ValidateNested()
  @Type(() => ApplicationUserDetailsDto)
  details!: ApplicationUserDetailsDto;
}
