import { IsString, IsOptional } from 'class-validator';

export class UpdateQualityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
