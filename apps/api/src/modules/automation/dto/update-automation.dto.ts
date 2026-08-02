import { IsString, IsOptional } from 'class-validator';

export class UpdateAutomationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
