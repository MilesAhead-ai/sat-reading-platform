import { IsOptional, IsInt, Min, Max, IsDateString, IsArray, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsInt()
  @Min(6)
  @Max(12)
  grade?: number;

  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(800)
  targetScore?: number;

  @IsOptional()
  @IsDateString()
  targetTestDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weakAreas?: string[];
}
