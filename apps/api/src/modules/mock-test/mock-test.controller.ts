import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MockTestService } from './mock-test.service';
import { SubmitAllDto } from './dto/submit-all.dto';

@Controller('mock-test')
@UseGuards(JwtAuthGuard)
export class MockTestController {
  constructor(private readonly mockTestService: MockTestService) {}

  @Post('start')
  async startMockTest(@CurrentUser('id') studentId: string) {
    return this.mockTestService.startMockTest(studentId);
  }

  @Get(':sessionId')
  async getMockTest(
    @CurrentUser('id') studentId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.mockTestService.getMockTest(studentId, sessionId);
  }

  @Post(':sessionId/submit-all')
  async submitAll(
    @CurrentUser('id') studentId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitAllDto,
  ) {
    return this.mockTestService.submitAll(studentId, sessionId, dto);
  }
}
