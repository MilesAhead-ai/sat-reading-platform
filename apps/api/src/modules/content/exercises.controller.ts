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

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async list(@Query('type') type?: string) {
    return this.contentService.getExercises({ type });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.contentService.getExerciseWithContent(id);
    if (!result) throw new NotFoundException('Exercise not found');
    return result;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() body: Record<string, unknown>) {
    return this.contentService.createExercise(body);
  }
}
