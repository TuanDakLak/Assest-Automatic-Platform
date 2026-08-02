import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePromptDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
