import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
