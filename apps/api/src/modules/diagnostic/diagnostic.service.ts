import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import {
  DiagnosticSession,
  DiagnosticSessionStatus,
} from '../../database/entities/diagnostic-session.entity';
import { DiagnosticResponse } from '../../database/entities/diagnostic-response.entity';
import { Question } from '../../database/entities/question.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { SkillEstimatorService } from '../../services/skill-estimator.service';
import { SkillsService } from '../skills/skills.service';
import { DiagnosticRespondDto } from './dto/diagnostic-respond.dto';
import { SkillLevel } from '../../database/entities/skill.entity';

const SAT_CONFIG = {
  diagnosticQuestionCount: 15,
  seConvergenceThreshold: 0.5,
};

export const DIAGNOSTIC_LEVELS = [
  { level: 1, name: 'Initial Assessment', unlockScore: 0, startDifficulty: 3 },
  { level: 2, name: 'Intermediate Check', unlockScore: 600, startDifficulty: 3 },
  { level: 3, name: 'Advanced Assessment', unlockScore: 700, startDifficulty: 4 },
  { level: 4, name: 'Pre-Test Assessment', unlockScore: 750, startDifficulty: 4 },
];

@Injectable()
export class DiagnosticService {
  constructor(
    @InjectRepository(DiagnosticSession)
    private readonly sessionRepo: Repository<DiagnosticSession>,
    @InjectRepository(DiagnosticResponse)
    private readonly responseRepo: Repository<DiagnosticResponse>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(StudentSkillEstimate)
    private readonly estimateRepo: Repository<StudentSkillEstimate>,
    private readonly skillEstimatorService: SkillEstimatorService,
    private readonly skillsService: SkillsService,
  ) {}

  /**
   * Get all diagnostic levels with their status for a student.
   */
  async getDiagnosticLevels(studentId: string) {
    // Get all diagnostic sessions for this student
    const sessions = await this.sessionRepo.find({
      where: { studentId },
      order: { level: 'ASC', startedAt: 'DESC' },
    });

    // Get current projected score
    const currentScore = await this.calculateCurrentScore(studentId);

    return DIAGNOSTIC_LEVELS.map((levelConfig) => {
      const session = sessions.find(
        (s) => s.level === levelConfig.level,
      );

      let status: 'locked' | 'available' | 'in_progress' | 'completed';
      if (session?.status === DiagnosticSessionStatus.COMPLETED) {
        status = 'completed';
      } else if (session?.status === DiagnosticSessionStatus.IN_PROGRESS) {
        status = 'in_progress';
      } else if (currentScore >= levelConfig.unlockScore) {
        status = 'available';
      } else {
        status = 'locked';
      }

      return {
        level: levelConfig.level,
        name: levelConfig.name,
        unlockScore: levelConfig.unlockScore,
        status,
        sessionId: session?.id ?? null,
        completedAt: session?.completedAt ?? null,
        currentScore,
      };
    });
  }

  /**
   * Start a new diagnostic session for a student at a given level.
   */
  async startDiagnostic(studentId: string, level: number = 1) {
    const levelConfig = DIAGNOSTIC_LEVELS.find((l) => l.level === level);
    if (!levelConfig) {
      throw new BadRequestException(`Invalid diagnostic level: ${level}`);
    }

    // Check for an existing completed diagnostic at this level
    const completed = await this.sessionRepo.findOne({
      where: {
        studentId,
        level,
        status: DiagnosticSessionStatus.COMPLETED,
      },
    });

    if (completed) {
      throw new BadRequestException(
        `Diagnostic level ${level} (${levelConfig.name}) is already completed. You can view the results but cannot retake it.`,
      );
    }

    // Check for an existing in-progress diagnostic at this level
    const existing = await this.sessionRepo.findOne({
      where: {
        studentId,
        level,
        status: DiagnosticSessionStatus.IN_PROGRESS,
      },
    });

    // If an in-progress session exists, resume it
    if (existing) {
      const question =
        existing.currentQuestionIndex === 0
          ? await this.selectFirstQuestion(levelConfig.startDifficulty)
          : await this.selectNextQuestion(existing.id, studentId);

      return {
        session: existing,
        question,
        resumed: true,
        progress: {
          current: existing.currentQuestionIndex,
          total: SAT_CONFIG.diagnosticQuestionCount,
        },
        elapsedSeconds: Math.floor(
          (Date.now() - new Date(existing.startedAt).getTime()) / 1000,
        ),
      };
    }

    // Check if level is unlocked
    const currentScore = await this.calculateCurrentScore(studentId);
    if (currentScore < levelConfig.unlockScore) {
      throw new BadRequestException(
        `Diagnostic level ${level} (${levelConfig.name}) requires a score of ${levelConfig.unlockScore}. Your current score is ${currentScore}.`,
      );
    }

    // Initialize skill estimates for the student (only if first diagnostic)
    if (level === 1) {
      await this.skillsService.initializeEstimates(studentId);
    }

    // Create new session
    const session = this.sessionRepo.create({
      studentId,
      level,
      status: DiagnosticSessionStatus.IN_PROGRESS,
      currentQuestionIndex: 0,
    });
    await this.sessionRepo.save(session);

    // Select first question at level-appropriate difficulty
    const question = await this.selectFirstQuestion(levelConfig.startDifficulty);

    return {
      session,
      question,
      progress: {
        current: 0,
        total: SAT_CONFIG.diagnosticQuestionCount,
      },
      elapsedSeconds: 0,
    };
  }

  /**
   * Submit an answer for the current diagnostic question.
   */
  async respondToQuestion(studentId: string, dto: DiagnosticRespondDto) {
    // Verify session belongs to student and is in_progress
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Diagnostic session not found.');
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenException(
        'This diagnostic session does not belong to you.',
      );
    }

    if (session.status !== DiagnosticSessionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'This diagnostic session is no longer in progress.',
      );
    }

    // Get the question with skills relation
    const question = await this.questionRepo.findOne({
      where: { id: dto.questionId },
      relations: ['skills'],
    });

    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    // Check if answer is correct
    const isCorrect = dto.chosenAnswer === question.correctAnswer;

    // Create DiagnosticResponse record
    const response = this.responseRepo.create({
      sessionId: session.id,
      questionId: question.id,
      chosenAnswer: dto.chosenAnswer,
      isCorrect,
      timeSpentSeconds: dto.timeSpentSeconds ?? null,
      orderIndex: session.currentQuestionIndex,
    });
    await this.responseRepo.save(response);

    // Update skill estimates for each skill on the question
    if (question.skills && question.skills.length > 0) {
      const skillIds = question.skills.map((s) => s.id);
      await this.skillEstimatorService.updateMultipleSkills(
        studentId,
        skillIds,
        isCorrect,
        question.difficulty,
      );
    }

    // Increment currentQuestionIndex
    session.currentQuestionIndex += 1;
    await this.sessionRepo.save(session);

    // Check if diagnostic should end
    const shouldEnd = await this.shouldEndDiagnostic(session, studentId);

    if (!shouldEnd) {
      // Select next question
      const nextQuestion = await this.selectNextQuestion(
        session.id,
        studentId,
      );
      return {
        isComplete: false,
        nextQuestion,
        progress: {
          current: session.currentQuestionIndex,
          total: SAT_CONFIG.diagnosticQuestionCount,
        },
      };
    }

    // Complete the diagnostic
    const results = await this.completeDiagnostic(session.id, studentId);
    return { isComplete: true, results };
  }

  /**
   * Determine whether the diagnostic should end.
   */
  private async shouldEndDiagnostic(
    session: DiagnosticSession,
    studentId: string,
  ): Promise<boolean> {
    // Reached max question count
    if (
      session.currentQuestionIndex >= SAT_CONFIG.diagnosticQuestionCount
    ) {
      return true;
    }

    // Check if all skills have SE below convergence threshold
    const estimates = await this.estimateRepo.find({
      where: { studentId },
    });

    if (estimates.length === 0) {
      return false;
    }

    const allConverged = estimates.every(
      (e) => e.standardError < SAT_CONFIG.seConvergenceThreshold,
    );

    return allConverged;
  }

  /**
   * Select the first question at a given difficulty level.
   */
  private async selectFirstQuestion(difficulty: number = 3): Promise<Question> {
    const question = await this.questionRepo.findOne({
      where: { difficulty },
      relations: ['passage', 'skills'],
      order: { id: 'ASC' },
    });

    if (!question) {
      // Fallback: grab any question
      const fallback = await this.questionRepo.findOne({
        relations: ['passage', 'skills'],
      });
      if (!fallback) {
        throw new NotFoundException('No questions available for diagnostic.');
      }
      return fallback;
    }

    return question;
  }

  /**
   * Simplified CAT algorithm for selecting the next question.
   */
  async selectNextQuestion(
    sessionId: string,
    studentId: string,
  ): Promise<Question> {
    // Get all current skill estimates for student
    const estimates = await this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
    });

    // Get all already-answered question IDs in this session
    const answeredResponses = await this.responseRepo.find({
      where: { sessionId },
      select: ['questionId'],
    });
    const answeredIds = answeredResponses.map((r) => r.questionId);

    // Find the skill with the highest standardError (most uncertainty)
    const sortedEstimates = [...estimates].sort(
      (a, b) => b.standardError - a.standardError,
    );

    // Check domain/skill coverage: ensure at least 2 questions per domain, 1 per skill
    const answeredQuestions =
      answeredIds.length > 0
        ? await this.questionRepo.find({
            where: { id: In(answeredIds) },
            relations: ['skills'],
          })
        : [];

    // Count questions per skill
    const skillCoverage: Record<string, number> = {};
    const domainCoverage: Record<string, number> = {};

    for (const q of answeredQuestions) {
      if (q.skills) {
        for (const skill of q.skills) {
          skillCoverage[skill.id] = (skillCoverage[skill.id] || 0) + 1;
          if (skill.parentId) {
            domainCoverage[skill.parentId] =
              (domainCoverage[skill.parentId] || 0) + 1;
          }
        }
      }
    }

    // Determine target skill: prioritize underrepresented domains/skills
    let targetSkillId: string | null = null;

    // Check for domains with fewer than 2 questions
    for (const est of sortedEstimates) {
      if (est.skill && est.skill.parentId === null) {
        // This is a domain-level estimate
        if ((domainCoverage[est.skillId] || 0) < 2) {
          // Find a child skill of this domain
          const childEstimate = estimates.find(
            (e) =>
              e.skill &&
              e.skill.parentId === est.skillId &&
              (skillCoverage[e.skillId] || 0) < 1,
          );
          if (childEstimate) {
            targetSkillId = childEstimate.skillId;
            break;
          }
        }
      }
    }

    // Check for skills with 0 questions
    if (!targetSkillId) {
      for (const est of sortedEstimates) {
        if (
          est.skill &&
          est.skill.parentId !== null &&
          (skillCoverage[est.skillId] || 0) < 1
        ) {
          targetSkillId = est.skillId;
          break;
        }
      }
    }

    // Default: pick the skill with the highest standard error
    if (!targetSkillId && sortedEstimates.length > 0) {
      targetSkillId = sortedEstimates[0].skillId;
    }

    if (!targetSkillId) {
      throw new NotFoundException(
        'Unable to determine target skill for next question.',
      );
    }

    // Get the ability estimate for the target skill
    const targetEstimate = estimates.find((e) => e.skillId === targetSkillId);
    const targetAbility = targetEstimate ? targetEstimate.abilityEstimate : 0;

    // Map ability to difficulty (1-5): ability range roughly -2..+2 maps to 1..5
    const targetDifficulty = Math.min(
      5,
      Math.max(1, Math.round(targetAbility + 3)),
    );

    // Query for questions that test the target skill and haven't been answered
    let queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .innerJoin('question.skills', 'skill', 'skill.id = :skillId', {
        skillId: targetSkillId,
      })
      .leftJoinAndSelect('question.passage', 'passage')
      .leftJoinAndSelect('question.skills', 'allSkills');

    if (answeredIds.length > 0) {
      queryBuilder = queryBuilder.where(
        'question.id NOT IN (:...answeredIds)',
        { answeredIds },
      );
    }

    // Order by closeness to target difficulty
    queryBuilder = queryBuilder.orderBy(
      `ABS(question.difficulty - ${targetDifficulty})`,
      'ASC',
    );

    const question = await queryBuilder.getOne();

    if (question) {
      return question;
    }

    // Fallback: any unanswered question
    let fallbackBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.passage', 'passage')
      .leftJoinAndSelect('question.skills', 'skills');

    if (answeredIds.length > 0) {
      fallbackBuilder = fallbackBuilder.where(
        'question.id NOT IN (:...answeredIds)',
        { answeredIds },
      );
    }

    fallbackBuilder = fallbackBuilder.orderBy(
      `ABS(question.difficulty - ${targetDifficulty})`,
      'ASC',
    );

    const fallback = await fallbackBuilder.getOne();

    if (!fallback) {
      throw new NotFoundException('No more questions available.');
    }

    return fallback;
  }

  /**
   * Mark session as completed and compute results.
   */
  async completeDiagnostic(sessionId: string, studentId: string) {
    // Mark session as completed
    await this.sessionRepo.update(sessionId, {
      status: DiagnosticSessionStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Get final skill estimates
    const skillEstimates = await this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
    });

    // Get responses for stats
    const responses = await this.responseRepo.find({
      where: { sessionId },
    });

    const totalQuestions = responses.length;
    const correctCount = responses.filter((r) => r.isCorrect).length;

    // Aggregate domain scores from child skills
    for (const domain of skillEstimates.filter(e => e.skill && !e.skill.parentId)) {
      const children = skillEstimates.filter(e => e.skill && e.skill.parentId === domain.skillId);
      if (children.length > 0) {
        domain.abilityEstimate = children.reduce((s, c) => s + c.abilityEstimate, 0) / children.length;
      }
    }

    // Calculate overall score projection using SKILL-level estimates only
    const skillOnly = skillEstimates.filter(e => e.skill && e.skill.level === SkillLevel.SKILL);
    const avgAbility =
      skillOnly.length > 0
        ? skillOnly.reduce((sum, e) => sum + e.abilityEstimate, 0) /
          skillOnly.length
        : 0;

    // Map ability from roughly -3..+3 to 200..800
    let projectedScore = Math.min(
      800,
      Math.max(200, Math.round(500 + avgAbility * 200)),
    );

    // Perfect accuracy floor: 100% correct should never show below 700
    if (totalQuestions > 0 && correctCount === totalQuestions) {
      projectedScore = Math.max(projectedScore, 700);
    }

    const scoreNote = 'This is an initial estimate based on ' + totalQuestions +
      ' questions. Your projected score will become more accurate as you complete more practice.';

    return {
      skillEstimates,
      projectedScore,
      totalQuestions,
      correctCount,
      scoreNote,
    };
  }

  /**
   * Get results of a completed diagnostic session.
   */
  async getResults(sessionId: string, studentId: string) {
    // Verify session belongs to student
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Diagnostic session not found.');
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenException(
        'This diagnostic session does not belong to you.',
      );
    }

    // Get responses with questions
    const responses = await this.responseRepo.find({
      where: { sessionId },
      relations: ['question'],
      order: { orderIndex: 'ASC' },
    });

    // Get skill estimates
    const skillEstimates = await this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
    });

    const totalQuestions = responses.length;
    const correctCount = responses.filter((r) => r.isCorrect).length;

    // Aggregate domain scores from child skills
    for (const domain of skillEstimates.filter(e => e.skill && !e.skill.parentId)) {
      const children = skillEstimates.filter(e => e.skill && e.skill.parentId === domain.skillId);
      if (children.length > 0) {
        domain.abilityEstimate = children.reduce((s, c) => s + c.abilityEstimate, 0) / children.length;
      }
    }

    // Calculate projected score using SKILL-level estimates only
    const skillOnly = skillEstimates.filter(e => e.skill && e.skill.level === SkillLevel.SKILL);
    const avgAbility =
      skillOnly.length > 0
        ? skillOnly.reduce((sum, e) => sum + e.abilityEstimate, 0) /
          skillOnly.length
        : 0;

    let projectedScore = Math.min(
      800,
      Math.max(200, Math.round(500 + avgAbility * 200)),
    );

    // Perfect accuracy floor
    if (totalQuestions > 0 && correctCount === totalQuestions) {
      projectedScore = Math.max(projectedScore, 700);
    }

    const scoreNote = 'This is an initial estimate based on ' + totalQuestions +
      ' questions. Your projected score will become more accurate as you complete more practice.';

    return {
      session,
      responses,
      skillEstimates,
      projectedScore,
      totalQuestions,
      correctCount,
      scoreNote,
    };
  }

  /**
   * Calculate the student's current projected score from skill estimates.
   */
  private async calculateCurrentScore(studentId: string): Promise<number> {
    const estimates = await this.estimateRepo
      .createQueryBuilder('estimate')
      .innerJoin('estimate.skill', 'skill')
      .where('estimate.studentId = :studentId', { studentId })
      .andWhere('skill.level = :level', { level: SkillLevel.SKILL })
      .getMany();

    if (estimates.length === 0) {
      return 0;
    }

    const avgAbility =
      estimates.reduce((sum, e) => sum + e.abilityEstimate, 0) /
      estimates.length;

    return Math.min(800, Math.max(200, Math.round(500 + avgAbility * 200)));
  }
}
