import { IsString, IsOptional } from 'class-validator';

export class UpdateStorageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
