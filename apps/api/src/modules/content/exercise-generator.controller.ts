import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ExerciseGeneratorService } from './exercise-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('content')
export class ExerciseGeneratorController {
  constructor(
    private readonly exerciseGeneratorService: ExerciseGeneratorService,
  ) {}

  @Post('generate-exercise')
  async generateForStudent(@CurrentUser('id') userId: string) {
    return this.exerciseGeneratorService.generateForStudent(userId);
  }

  @Post('generate-exercise/custom')
  async generateCustom(
    @Body()
    body: {
      skillIds: string[];
      difficulty: number;
      passageType: string;
    },
  ) {
    // Resolve skill names from IDs
    const skills = body.skillIds.map((id) => ({
      id,
      name: id.split('.').pop()?.replace(/_/g, ' ') || id,
    }));

    return this.exerciseGeneratorService.generateWithParams({
      skills,
      difficulty: body.difficulty,
      passageType: body.passageType,
    });
  }
}
