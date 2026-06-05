import { ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';
import { VALID_JOB_PLATFORM_IDS } from '../job-platforms';

export class UpdateJobSourcesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsIn([...VALID_JOB_PLATFORM_IDS], { each: true })
  platformIds!: string[];
}
