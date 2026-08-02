import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
