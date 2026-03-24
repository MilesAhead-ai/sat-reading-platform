import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /** GET /skills - returns the full skill tree (public) */
  @Get()
  getSkillTree() {
    return this.skillsService.getSkillTree();
  }

  /** GET /skills/estimates/me - returns current user's skill estimates */
  @UseGuards(JwtAuthGuard)
  @Get('estimates/me')
  getMyEstimates(@CurrentUser('id') userId: string) {
    return this.skillsService.getStudentEstimates(userId);
  }

  /** GET /skills/:id - returns a single skill */
  @Get(':id')
  getSkillById(@Param('id') id: string) {
    return this.skillsService.getSkillById(id);
  }
}
