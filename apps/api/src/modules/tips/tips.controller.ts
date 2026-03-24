import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TipsService } from './tips.service';
import { TipFeedbackDto } from './dto/tip-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Get('latest')
  getLatestTips(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.tipsService.getLatestTips(userId, parsedLimit);
  }

  @Post('generate')
  generateTip(@CurrentUser('id') userId: string) {
    return this.tipsService.generateTipForStudent(userId);
  }

  @Post(':id/feedback')
  submitFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TipFeedbackDto,
  ) {
    return this.tipsService.submitFeedback(id, userId, dto.rating);
  }
}
