import { IsString, IsOptional } from 'class-validator';

export class UpdatePromptDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
