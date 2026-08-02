import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSettingsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
