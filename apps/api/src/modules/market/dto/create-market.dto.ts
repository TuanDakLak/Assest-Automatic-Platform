import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min, Max, IsEnum, IsArray, ArrayMaxSize } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Seed subject keywords queried against GDELT during discovery.
   * These must be real-world news subjects ("sustainable packaging",
   * "electric vehicles"), not design jargon — GDELT indexes news, so terms
   * like "glassmorphism" return zero coverage.
   */
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(25)
  @IsOptional()
  keywords?: string[];
}

export class CreateStyleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateMarketTopicDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  styleId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  trendScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  marketScore?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  searchVolume?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  competitionScore?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['DISCOVERED', 'ANALYZING', 'VALIDATED', 'ARCHIVED'])
  status?: string;
}
