import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
