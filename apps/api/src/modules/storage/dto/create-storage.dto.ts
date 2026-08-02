import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStorageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
