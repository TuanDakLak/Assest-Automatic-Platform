import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSlidesDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
