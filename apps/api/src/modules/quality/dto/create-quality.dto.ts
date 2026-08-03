import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateQualityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CheckQualityDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;
}
