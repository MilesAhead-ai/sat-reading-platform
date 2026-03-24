import { IsInt, IsIn } from 'class-validator';

export class TipFeedbackDto {
  @IsInt()
  @IsIn([1, -1])
  rating: number;
}
