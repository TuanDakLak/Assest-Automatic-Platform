import { IsString, IsOptional } from 'class-validator';

export class UpdateAuthDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
