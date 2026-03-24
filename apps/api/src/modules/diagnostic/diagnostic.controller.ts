import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticRespondDto } from './dto/diagnostic-respond.dto';
import { DiagnosticStartDto } from './dto/diagnostic-start.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('diagnostic')
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  /** GET /diagnostic/levels - get all diagnostic levels with status */
  @Get('levels')
  getLevels(@CurrentUser('id') userId: string) {
    return this.diagnosticService.getDiagnosticLevels(userId);
  }

  /** POST /diagnostic/start - start a new diagnostic, returns first question */
  @Post('start')
  start(
    @CurrentUser('id') userId: string,
    @Body() dto: DiagnosticStartDto,
  ) {
    return this.diagnosticService.startDiagnostic(userId, dto.level ?? 1);
  }

  /** POST /diagnostic/respond - submit answer, returns next question or results */
  @Post('respond')
  respond(
    @CurrentUser('id') userId: string,
    @Body() dto: DiagnosticRespondDto,
  ) {
    return this.diagnosticService.respondToQuestion(userId, dto);
  }

  /** GET /diagnostic/results/:id - get completed diagnostic results */
  @Get('results/:id')
  getResults(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.diagnosticService.getResults(sessionId, userId);
  }
}
