import { IsInt, Min, Max, IsOptional, IsNumber, Matches } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DiagnosticRespondDto {
  @Matches(UUID_REGEX, { message: 'sessionId must be a valid UUID format' })
  sessionId: string;

  @Matches(UUID_REGEX, { message: 'questionId must be a valid UUID format' })
  questionId: string;

  @IsInt()
  @Min(0)
  @Max(3)
  chosenAnswer: number;

  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}
