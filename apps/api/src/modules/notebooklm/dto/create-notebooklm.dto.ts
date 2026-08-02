import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNotebooklmDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
