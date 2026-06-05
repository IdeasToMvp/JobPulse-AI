import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SetupNewOnlySyncDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  platformIds!: string[];
}
