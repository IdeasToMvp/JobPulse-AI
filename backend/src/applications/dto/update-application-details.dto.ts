import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ApplicationUserDetailsDto } from './application-user-details.dto';

export class UpdateApplicationDetailsDto {
  @ValidateNested()
  @Type(() => ApplicationUserDetailsDto)
  details!: ApplicationUserDetailsDto;
}
