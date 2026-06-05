import { IsBoolean, IsIn, IsInt, Min } from 'class-validator';

const ALLOWED_FREQUENCIES = [0, 30, 60, 360, 720, 1440] as const;

export class UpdateSyncSettingsDto {
  @IsBoolean()
  autoSyncEnabled!: boolean;

  @IsInt()
  @Min(0)
  @IsIn(ALLOWED_FREQUENCIES as unknown as number[])
  syncFrequencyMinutes!: number;
}
