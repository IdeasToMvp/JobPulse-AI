import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAndroidReleaseDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @MinLength(1)
  latestVersion!: string;

  @IsInt()
  @Min(1)
  latestBuildNumber!: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  apkUrl?: string;

  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @IsBoolean()
  forceUpdate!: boolean;

  @IsInt()
  @Min(1)
  minSupportedBuildNumber!: number;
}
