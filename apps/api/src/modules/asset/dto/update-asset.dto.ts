import { IsString, IsOptional } from 'class-validator';

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
