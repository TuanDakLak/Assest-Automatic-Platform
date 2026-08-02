import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
