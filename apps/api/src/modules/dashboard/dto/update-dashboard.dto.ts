import { IsString, IsOptional } from 'class-validator';

export class UpdateDashboardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
