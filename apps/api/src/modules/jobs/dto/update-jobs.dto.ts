import { IsString, IsOptional } from 'class-validator';

export class UpdateJobsDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
