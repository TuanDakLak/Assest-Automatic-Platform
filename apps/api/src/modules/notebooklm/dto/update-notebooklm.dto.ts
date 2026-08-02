import { IsString, IsOptional } from 'class-validator';

export class UpdateNotebooklmDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
