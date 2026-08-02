import { IsString, IsOptional } from 'class-validator';

export class UpdateSlidesDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
