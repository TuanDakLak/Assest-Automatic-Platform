import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateResearchDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
