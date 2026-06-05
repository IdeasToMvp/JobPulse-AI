import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleTokenDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  redirectUri?: string;
}
