import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async list(
    @Query('skillId') skillId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('passageId') passageId?: string,
  ) {
    return this.contentService.getQuestions({
      skillId,
      difficulty: difficulty !== undefined ? Number(difficulty) : undefined,
      passageId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const question = await this.contentService.getQuestionById(id);
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() body: Record<string, unknown>) {
    return this.contentService.createQuestion(body as any);
  }
}
