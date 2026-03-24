import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerItemDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(0)
  @Max(3)
  chosenAnswer: number;

  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}

export class SubmitAllDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];

  @IsOptional()
  @IsNumber()
  totalTimeSeconds?: number;
}
