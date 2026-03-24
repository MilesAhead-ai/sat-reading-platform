import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import {
  PracticeSession,
  PracticeSessionStatus,
} from '../../database/entities/practice-session.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Question } from '../../database/entities/question.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { Passage } from '../../database/entities/passage.entity';
import { Skill } from '../../database/entities/skill.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { ReviewQueueItem } from '../../database/entities/review-queue-item.entity';
import { SkillEstimatorService } from '../../services/skill-estimator.service';
import { ExerciseSelectorService } from '../../services/exercise-selector.service';
import { LlmService } from '../../services/llm.service';
import { ErrorPattern } from '../../database/entities/student-response.entity';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    @InjectRepository(PracticeSession)
    private readonly practiceSessionRepo: Repository<PracticeSession>,
    @InjectRepository(StudentResponse)
    private readonly studentResponseRepo: Repository<StudentResponse>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(StudySession)
    private readonly studySessionRepo: Repository<StudySession>,
    @InjectRepository(Passage)
    private readonly passageRepo: Repository<Passage>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepo: Repository<StudentSkillEstimate>,
    @InjectRepository(ReviewQueueItem)
    private readonly reviewQueueRepo: Repository<ReviewQueueItem>,
    private readonly skillEstimatorService: SkillEstimatorService,
    private readonly exerciseSelectorService: ExerciseSelectorService,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Resolve an exercise ID (either UUID or shortId) to the exercise entity.
   */
  private async resolveExercise(id: string): Promise<Exercise | null> {
    // UUID format check
    if (id.includes('-') && id.length === 36) {
      return this.exerciseRepo.findOne({ where: { id } });
    }
    // Short ID lookup
    return this.exerciseRepo.findOne({ where: { shortId: id } });
  }

  /**
   * List all exercises (non-mock_test, non-hidden) with student attempt history.
   */
  async listExercises(studentId: string) {
    const exercises = await this.exerciseRepo.find({
      where: { type: Not('mock_test' as any), isHidden: false },
      relations: ['passage'],
      order: { difficulty: 'ASC' },
    });

    const sessions = await this.practiceSessionRepo.find({
      where: { studentId, status: PracticeSessionStatus.COMPLETED },
    });

    const sessionsByExercise = new Map<string, { completedAt: Date; score: number | null }[]>();
    for (const s of sessions) {
      const arr = sessionsByExercise.get(s.exerciseId) || [];
      arr.push({ completedAt: s.completedAt!, score: s.score });
      sessionsByExercise.set(s.exerciseId, arr);
    }

    return exercises.map((e) => ({
      id: e.id,
      shortId: e.shortId,
      title: e.title,
      type: e.type,
      difficulty: e.difficulty,
      estimatedMinutes: e.estimatedMinutes,
      isAiGenerated: e.isAiGenerated,
      passageType: e.passage?.type ?? null,
      attempts: (sessionsByExercise.get(e.id) || []).map((a) => ({
        completedAt: a.completedAt.toISOString(),
        score: a.score,
      })),
    }));
  }

  /**
   * Get the next recommended exercise for the student.
   */
  async getNextExercise(studentId: string): Promise<Exercise> {
    const exercise =
      await this.exerciseSelectorService.selectNextExercise(studentId);

    if (!exercise) {
      throw new NotFoundException(
        'No exercises available. You may have completed all exercises.',
      );
    }

    return exercise;
  }

  /**
   * Get an exercise with its full content: passage and questions.
   */
  async getExerciseWithContent(exerciseId: string) {
    const exercise = await this.resolveExercise(exerciseId);

    if (!exercise) {
      throw new NotFoundException(`Exercise "${exerciseId}" not found`);
    }

    const questions = await Promise.all(
      exercise.questionIds.map((qId) =>
        this.questionRepo.findOne({ where: { id: qId } }),
      ),
    );
    const validQuestions = questions.filter((q): q is Question => q !== null);

    // Load passages from questions' passageIds or exercise.passageId
    const passageIds = exercise.passageId
      ? [exercise.passageId]
      : [...new Set(validQuestions.map((q) => q.passageId).filter(Boolean))];

    const passageMap = new Map<string, Passage>();
    if (passageIds.length > 0) {
      const loadedPassages = (
        await Promise.all(
          passageIds.map((pid) =>
            this.passageRepo.findOne({ where: { id: pid } }),
          ),
        )
      ).filter((p): p is Passage => p !== null);
      for (const p of loadedPassages) passageMap.set(p.id, p);
    }

    // Build passageGroups (Digital SAT: 1 passage per question)
    const passageGroups = validQuestions.map((q) => {
      const p = passageMap.get(q.passageId);
      return {
        passage: p ? { id: p.id, title: p.title, text: p.text, type: p.type } : null,
        questions: [{ id: q.id, stem: q.stem, choices: q.choices }],
      };
    });

    // For backward compat: single passage if exercise has passageId
    const passage = exercise.passageId ? (passageMap.get(exercise.passageId) ?? null) : null;
    const passages = Array.from(passageMap.values());

    // Resolve skillsFocus IDs to human-readable names
    let targetedSkills: { id: string; name: string }[] = [];
    if (exercise.skillsFocus && exercise.skillsFocus.length > 0) {
      const skills = await this.skillRepo.find({
        where: exercise.skillsFocus.map((id) => ({ id })),
      });
      targetedSkills = skills.map((s) => ({ id: s.id, name: s.name }));
    }

    return {
      exercise,
      passage,
      passages,
      passageGroups,
      questions: validQuestions,
      targetedSkills,
    };
  }

  /**
   * Start a new practice session for the given exercise.
   */
  async startSession(
    studentId: string,
    exerciseId: string,
  ): Promise<PracticeSession> {
    // Verify exercise exists (supports both UUID and shortId)
    const exercise = await this.resolveExercise(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise "${exerciseId}" not found`);
    }

    // Check no in_progress session exists for this student + exercise
    const existing = await this.practiceSessionRepo.findOne({
      where: {
        studentId,
        exerciseId: exercise.id,
        status: PracticeSessionStatus.IN_PROGRESS,
      },
    });

    if (existing) {
      return existing;
    }

    // Snapshot targeted skill estimates before practice begins
    let skillSnapshotBefore: PracticeSession['skillSnapshotBefore'] = null;
    if (exercise.skillsFocus && exercise.skillsFocus.length > 0) {
      const estimates = await this.skillEstimateRepo.find({
        where: exercise.skillsFocus.map((id) => ({ studentId, skillId: id })),
        relations: ['skill'],
      });

      skillSnapshotBefore = estimates.map((e) => ({
        skillId: e.skillId,
        skillName: e.skill?.name ?? e.skillId,
        abilityEstimate: e.abilityEstimate,
        masteryStatus: e.masteryStatus,
      }));

      // Include skills with no prior estimate (new students)
      const snapshotSkillIds = new Set(estimates.map((e) => e.skillId));
      const missingSkillIds = exercise.skillsFocus.filter(
        (id) => !snapshotSkillIds.has(id),
      );
      if (missingSkillIds.length > 0) {
        const skills = await this.skillRepo.find({
          where: missingSkillIds.map((id) => ({ id })),
        });
        for (const skill of skills) {
          skillSnapshotBefore.push({
            skillId: skill.id,
            skillName: skill.name,
            abilityEstimate: 0,
            masteryStatus: 'novice',
          });
        }
      }
    }

    // Create the practice session
    const session = this.practiceSessionRepo.create({
      studentId,
      exerciseId: exercise.id,
      status: PracticeSessionStatus.IN_PROGRESS,
      startedAt: new Date(),
      skillSnapshotBefore,
    });

    const savedSession = await this.practiceSessionRepo.save(session);

    // Create or update study session for today
    await this.getOrCreateTodayStudySession(studentId);

    return savedSession;
  }

  /**
   * Submit an answer for a question within a practice session.
   */
  async submitAnswer(
    studentId: string,
    sessionId: string,
    dto: SubmitAnswerDto,
  ) {
    // Verify session belongs to student and is in_progress
    const session = await this.practiceSessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Practice session "${sessionId}" not found`);
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenException(
        'You do not have access to this practice session.',
      );
    }

    if (session.status !== PracticeSessionStatus.IN_PROGRESS) {
      throw new ConflictException('This practice session is no longer active.');
    }

    // Get the question with skills
    const question = await this.questionRepo.findOne({
      where: { id: dto.questionId },
      relations: ['skills'],
    });

    if (!question) {
      throw new NotFoundException(`Question "${dto.questionId}" not found`);
    }

    // Check correctness
    const isCorrect = dto.chosenAnswer === question.correctAnswer;

    // Create the student response record
    const response = this.studentResponseRepo.create({
      studentId,
      questionId: dto.questionId,
      sessionId,
      sessionType: 'practice',
      chosenAnswer: dto.chosenAnswer,
      isCorrect,
      timeSpentSeconds: dto.timeSpentSeconds ?? null,
      hintsUsed: dto.hintsUsed ?? 0,
    });

    await this.studentResponseRepo.save(response);

    // Update skill estimates
    const skillIds = question.skills.map((s) => s.id);
    let updatedEstimates: any[] = [];

    if (skillIds.length > 0) {
      updatedEstimates =
        await this.skillEstimatorService.updateMultipleSkills(
          studentId,
          skillIds,
          isCorrect,
          question.difficulty,
        );
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      hint: isCorrect ? undefined : question.hint,
      updatedEstimates,
    };
  }

  /**
   * Complete a practice session. Calculate and record the score.
   */
  async completeSession(studentId: string, sessionId: string) {
    // Verify session belongs to student
    const session = await this.practiceSessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Practice session "${sessionId}" not found`);
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenException(
        'You do not have access to this practice session.',
      );
    }

    // Load exercise to know total question count
    const exercise = await this.exerciseRepo.findOne({
      where: { id: session.exerciseId },
    });

    // Get all responses for this session, deduplicated by questionId (keep latest)
    const allResponses = await this.studentResponseRepo.find({
      where: {
        sessionId,
        sessionType: 'practice',
      },
      order: { createdAt: 'DESC' },
    });
    const seen = new Set<string>();
    const responses = allResponses.filter((r) => {
      if (seen.has(r.questionId)) return false;
      seen.add(r.questionId);
      return true;
    });

    // Use exercise question count as denominator so unanswered = incorrect
    const exerciseQuestionCount = exercise?.questionIds?.length ?? 0;
    const totalQuestions = Math.max(exerciseQuestionCount, responses.length);
    const correctCount = responses.filter((r) => r.isCorrect).length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Compute total time from individual question responses
    const totalTimeSeconds = responses.reduce(
      (sum, r) => sum + (r.timeSpentSeconds ?? 0),
      0,
    );

    // Update practice session
    session.status = PracticeSessionStatus.COMPLETED;
    session.completedAt = new Date();
    session.score = Math.round(score * 100) / 100;
    session.totalTimeSeconds = totalTimeSeconds || null;

    await this.practiceSessionRepo.save(session);

    // Update study session counters
    const studySession =
      await this.getOrCreateTodayStudySession(studentId);

    studySession.exercisesCompleted += 1;
    studySession.totalQuestions += totalQuestions;
    studySession.correctCount += correctCount;
    studySession.endTime = new Date();

    await this.studySessionRepo.save(studySession);

    // Build skill progress: compare before-snapshot with current estimates
    let skillProgress: {
      skillId: string;
      skillName: string;
      before: number;
      after: number;
      delta: number;
      masteryBefore: string;
      masteryAfter: string;
    }[] = [];

    if (session.skillSnapshotBefore && session.skillSnapshotBefore.length > 0) {
      const skillIds = session.skillSnapshotBefore.map((s) => s.skillId);
      const currentEstimates = await this.skillEstimateRepo.find({
        where: skillIds.map((id) => ({ studentId, skillId: id })),
      });
      const currentMap = new Map(
        currentEstimates.map((e) => [e.skillId, e]),
      );

      skillProgress = session.skillSnapshotBefore.map((snap) => {
        const current = currentMap.get(snap.skillId);
        const after = current?.abilityEstimate ?? snap.abilityEstimate;
        const masteryAfter = current?.masteryStatus ?? snap.masteryStatus;
        return {
          skillId: snap.skillId,
          skillName: snap.skillName,
          before: snap.abilityEstimate,
          after,
          delta: +(after - snap.abilityEstimate).toFixed(3),
          masteryBefore: snap.masteryStatus,
          masteryAfter,
        };
      });
    }

    // Auto-enqueue wrong answers into review queue
    const wrongResponses = responses.filter((r) => !r.isCorrect);
    for (const r of wrongResponses) {
      const existing = await this.reviewQueueRepo.findOne({
        where: { studentId, questionId: r.questionId },
      });
      if (existing) {
        existing.nextReviewDate = new Date();
        existing.interval = 1;
        existing.repetitions = 0;
        await this.reviewQueueRepo.save(existing);
      } else {
        await this.reviewQueueRepo.save(
          this.reviewQueueRepo.create({
            studentId,
            questionId: r.questionId,
            nextReviewDate: new Date(),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
          }),
        );
      }
    }

    // Build per-question results (including unanswered)
    const allQuestionIds = exercise?.questionIds ?? responses.map((r) => r.questionId);
    const questions = allQuestionIds.length > 0
      ? await this.questionRepo.find({
          where: allQuestionIds.map((id) => ({ id })),
          relations: ['skills'],
        })
      : [];
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const responseMap = new Map(responses.map((r) => [r.questionId, r]));

    const questionResults: {
      questionId: string;
      stem: string;
      isCorrect: boolean;
      chosenAnswer: number;
      correctAnswer: number;
      skills: { id: string; name: string }[];
      errorPattern?: ErrorPattern | null;
      errorReasoning?: string;
      unanswered?: boolean;
    }[] = allQuestionIds.map((qId) => {
      const q = questionMap.get(qId);
      const r = responseMap.get(qId);
      return {
        questionId: qId,
        stem: q?.stem || '',
        isCorrect: r?.isCorrect ?? false,
        chosenAnswer: r?.chosenAnswer ?? -1,
        correctAnswer: q?.correctAnswer ?? 0,
        skills: (q?.skills || []).map((s) => ({ id: s.id, name: s.name })),
        unanswered: !r,
      };
    });

    // LLM-based cognitive error classification (non-blocking)
    try {
      const wrongResults = questionResults.filter((qr) => !qr.isCorrect && !qr.unanswered);
      if (wrongResults.length > 0) {
        // Gather passage text: from exercise.passageId or from questions' passages
        let passageText = '';
        if (exercise?.passageId) {
          const passage = await this.passageRepo.findOne({
            where: { id: exercise.passageId },
          });
          passageText = passage?.text || '';
        } else {
          // Collect passage texts from wrong questions
          const wrongQuestionPassageIds = wrongResults
            .map((wr) => questionMap.get(wr.questionId)?.passageId)
            .filter(Boolean) as string[];
          const uniquePassageIds = [...new Set(wrongQuestionPassageIds)];
          if (uniquePassageIds.length > 0) {
            const wrongPassages = await Promise.all(
              uniquePassageIds.map((id) => this.passageRepo.findOne({ where: { id } })),
            );
            passageText = wrongPassages
              .filter((p): p is Passage => p !== null)
              .map((p) => p.text)
              .join('\n\n---\n\n');
          }
        }

        const classificationInputs = wrongResults.map((wr) => {
          const q = questionMap.get(wr.questionId);
          return {
            questionId: wr.questionId,
            stem: wr.stem,
            choices: q?.choices || [],
            chosenAnswer: wr.chosenAnswer,
            correctAnswer: wr.correctAnswer,
            explanation: q?.explanation || null,
          };
        });

        const classifications = await this.llmService.classifyErrorPatterns(
          passageText,
          classificationInputs,
        );

        // Build a map of questionId → classification
        const classMap = new Map(
          classifications.map((c) => [c.questionId, c]),
        );

        // Update student_responses and enrich questionResults
        for (const qr of questionResults) {
          const classification = classMap.get(qr.questionId);
          if (classification) {
            qr.errorPattern = classification.pattern;
            qr.errorReasoning = classification.reasoning;

            // Persist to DB
            await this.studentResponseRepo.update(
              { sessionId, questionId: qr.questionId },
              { errorPattern: classification.pattern },
            );
          }
        }
      }
    } catch (error) {
      this.logger.warn('Error pattern classification failed (non-blocking)', error);
    }

    return {
      score: session.score,
      totalQuestions,
      correctCount,
      sessionId,
      totalTimeSeconds,
      skillProgress,
      questionResults,
    };
  }

  /**
   * Get or create a study session for today.
   */
  private async getOrCreateTodayStudySession(
    studentId: string,
  ): Promise<StudySession> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await this.studySessionRepo.findOne({
      where: {
        studentId,
        startTime: Between(todayStart, todayEnd),
      },
    });

    if (existing) {
      return existing;
    }

    const session = this.studySessionRepo.create({
      studentId,
      startTime: new Date(),
      exercisesCompleted: 0,
      totalQuestions: 0,
      correctCount: 0,
    });

    return this.studySessionRepo.save(session);
  }
}
