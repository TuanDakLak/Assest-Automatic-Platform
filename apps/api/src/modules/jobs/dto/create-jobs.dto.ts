import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateJobsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
