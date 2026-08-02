import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateSlidesDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ParseSlidesDto {
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsOptional()
  outputDir?: string;

  @IsNumber()
  @IsOptional()
  scale?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsBoolean()
  @IsOptional()
  transparent?: boolean;
}
