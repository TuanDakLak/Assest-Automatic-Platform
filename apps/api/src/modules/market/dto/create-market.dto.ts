import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
