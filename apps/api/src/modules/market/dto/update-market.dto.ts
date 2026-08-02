import { IsString, IsOptional } from 'class-validator';

export class UpdateMarketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
