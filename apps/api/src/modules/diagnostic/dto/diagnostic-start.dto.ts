import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class DiagnosticStartDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  level?: number;
}
