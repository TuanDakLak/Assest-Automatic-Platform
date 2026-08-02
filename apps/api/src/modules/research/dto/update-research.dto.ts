import { IsString, IsOptional } from 'class-validator';

export class UpdateResearchDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
