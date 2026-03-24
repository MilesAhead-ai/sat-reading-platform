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

@Controller('passages')
export class PassagesController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async list(
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.contentService.getPassages({
      type,
      difficulty: difficulty !== undefined ? Number(difficulty) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const passage = await this.contentService.getPassageById(id);
    if (!passage) throw new NotFoundException('Passage not found');
    return passage;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() body: Record<string, unknown>) {
    return this.contentService.createPassage(body);
  }
}
