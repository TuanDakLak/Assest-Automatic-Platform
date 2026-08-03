import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ExtractAssetDto {
  @IsString()
  @IsNotEmpty()
  slidePngPath: string;

  @IsString()
  @IsOptional()
  promptTemplate?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
