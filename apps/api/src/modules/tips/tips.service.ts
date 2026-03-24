import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tip, TipCategory } from '../../database/entities/tip.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Question } from '../../database/entities/question.entity';
import { LlmService } from '../../services/llm.service';

@Injectable()
export class TipsService {
  constructor(
    @InjectRepository(Tip)
    private readonly tipRepo: Repository<Tip>,
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepo: Repository<StudentSkillEstimate>,
    @InjectRepository(StudentResponse)
    private readonly responseRepo: Repository<StudentResponse>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    private readonly llmService: LlmService,
  ) {}

  async generateTipForStudent(studentId: string): Promise<Tip> {
    // Get student's skill estimates sorted by ability ascending (weakest first)
    const skillEstimates = await this.skillEstimateRepo.find({
      where: { studentId },
      relations: ['skill'],
      order: { abilityEstimate: 'ASC' },
    });

    const weakestSkills = skillEstimates.slice(0, 3).map((se) => ({
      name: se.skill.name,
      ability: se.abilityEstimate,
    }));

    // Get last 5 incorrect responses with question details
    const incorrectResponses = await this.responseRepo.find({
      where: { studentId, isCorrect: false },
      relations: ['question', 'question.passage', 'question.skills'],
      order: { id: 'DESC' },
      take: 5,
    });

    const recentErrors = incorrectResponses.map((r) => ({
      question: r.question.stem,
      chosenAnswer:
        r.question.choices[r.chosenAnswer]?.text ?? String(r.chosenAnswer),
      correctAnswer:
        r.question.choices[r.question.correctAnswer]?.text ??
        String(r.question.correctAnswer),
    }));

    // Determine passage types struggled with from incorrect responses
    const passageTypesStruggled = [
      ...new Set(
        incorrectResponses
          .filter((r) => r.question.passage)
          .map((r) => r.question.passage.type),
      ),
    ];

    // Fetch existing tips to avoid duplicates
    const existingTips = await this.tipRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const existingTipContents = existingTips.map((t) => t.content);

    // Generate tip via LLM
    const result = await this.llmService.generateTip({
      weakestSkills,
      recentErrors,
      passageTypesStruggled,
      existingTips: existingTipContents,
    });

    // Create and save the tip
    const tip = this.tipRepo.create({
      studentId,
      content: result.content,
      category: (result.category as TipCategory) || TipCategory.ENCOURAGEMENT,
      relatedSkillId: weakestSkills.length > 0 ? skillEstimates[0].skillId : null,
    });

    return this.tipRepo.save(tip);
  }

  async getLatestTips(studentId: string, limit: number = 5): Promise<Tip[]> {
    return this.tipRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async submitFeedback(
    tipId: string,
    studentId: string,
    rating: number,
  ): Promise<Tip> {
    const tip = await this.tipRepo.findOne({ where: { id: tipId } });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    if (tip.studentId !== studentId) {
      throw new ForbiddenException('You can only rate your own tips');
    }

    tip.studentRating = rating;
    return this.tipRepo.save(tip);
  }
}
