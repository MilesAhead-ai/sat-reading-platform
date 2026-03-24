import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseType } from '../../database/entities/knowledge-base-entry.entity';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Get('search')
  async search(
    @Query('q') query: string = '',
    @Query('type') type?: KnowledgeBaseType,
  ) {
    return this.kbService.search(query, type);
  }

  @Get('entries/:id')
  async getEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.getById(id);
  }

  @Post('entries')
  async createEntry(@Body() body: Record<string, unknown>) {
    return this.kbService.create(body as any);
  }

  @Put('entries/:id')
  async updateEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.kbService.update(id, body as any);
  }

  @Get('bookmarks')
  async getBookmarks(@CurrentUser('id') studentId: string) {
    return this.kbService.getBookmarks(studentId);
  }

  @Post('bookmarks')
  async addBookmark(
    @CurrentUser('id') studentId: string,
    @Body('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.kbService.addBookmark(studentId, entryId);
  }

  @Delete('bookmarks/:entryId')
  async removeBookmark(
    @CurrentUser('id') studentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.kbService.removeBookmark(studentId, entryId);
  }
}
