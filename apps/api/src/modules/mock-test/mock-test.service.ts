import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PracticeSession,
  PracticeSessionStatus,
} from '../../database/entities/practice-session.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Exercise, ExerciseType } from '../../database/entities/exercise.entity';
import { Question } from '../../database/entities/question.entity';
import { Passage, PassageType } from '../../database/entities/passage.entity';
import { Skill } from '../../database/entities/skill.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { ReviewQueueItem } from '../../database/entities/review-queue-item.entity';
import { SkillEstimatorService } from '../../services/skill-estimator.service';
import { SubmitAllDto } from './dto/submit-all.dto';
import { Between } from 'typeorm';

const MOCK_TEST_TIME_LIMIT = 3840; // 64 minutes in seconds (2 modules × 32 min)
const MOCK_TEST_TARGET_QUESTIONS = 54;
const TIME_GRACE_SECONDS = 30;

@Injectable()
export class MockTestService {
  private readonly logger = new Logger(MockTestService.name);

  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionRepo: Repository<PracticeSession>,
    @InjectRepository(StudentResponse)
    private readonly responseRepo: Repository<StudentResponse>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Passage)
    private readonly passageRepo: Repository<Passage>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepo: Repository<StudentSkillEstimate>,
    @InjectRepository(StudySession)
    private readonly studySessionRepo: Repository<StudySession>,
    @InjectRepository(ReviewQueueItem)
    private readonly reviewQueueRepo: Repository<ReviewQueueItem>,
    private readonly skillEstimatorService: SkillEstimatorService,
  ) {}

  async startMockTest(studentId: string) {
    // 1. Load all approved questions with their passages (Digital SAT: 1 passage = 1 question)
    const allQuestions = await this.questionRepo
      .createQueryBuilder('q')
      .innerJoinAndSelect('q.passage', 'p')
      .innerJoinAndSelect('q.skills', 's')
      .where('p.review_status = :status', { status: 'approved' })
      .getMany();

    if (allQuestions.length === 0) {
      throw new NotFoundException('No questions available to assemble a mock test.');
    }

    // 2. Group questions by passage type, then select ~14 per type to reach 54
    const types = [PassageType.LITERATURE, PassageType.HISTORY, PassageType.SCIENCE, PassageType.SOCIAL_SCIENCE];
    const perType = Math.ceil(MOCK_TEST_TARGET_QUESTIONS / types.length);

    const groupByType = (qs: Question[]) => {
      const m = new Map<PassageType, Question[]>();
      for (const q of qs) {
        const t = q.passage?.type;
        if (!t) continue;
        const list = m.get(t) || [];
        list.push(q);
        m.set(t, list);
      }
      return m;
    };

    const byType = groupByType(allQuestions);

    const selected: Question[] = [];
    for (const type of types) {
      const pool = byType.get(type) || [];
      this.shuffle(pool);
      selected.push(...pool.slice(0, perType));
    }

    // Trim to exact target (or take all if not enough)
    this.shuffle(selected);
    const finalQuestions = selected.slice(0, MOCK_TEST_TARGET_QUESTIONS);

    if (finalQuestions.length < 10) {
      throw new BadRequestException(
        `Not enough questions to assemble a mock test. Found ${finalQuestions.length}, need at least 10.`,
      );
    }

    const questionIds = finalQuestions.map((q) => q.id);

    // 3. Gather skill IDs for snapshot
    const skillIdSet = new Set<string>();
    for (const q of finalQuestions) {
      for (const s of q.skills) skillIdSet.add(s.id);
    }
    const skillIds = Array.from(skillIdSet);

    // Snapshot skill estimates before test
    let skillSnapshotBefore: PracticeSession['skillSnapshotBefore'] = null;
    if (skillIds.length > 0) {
      const estimates = await this.skillEstimateRepo.find({
        where: skillIds.map((id) => ({ studentId, skillId: id })),
        relations: ['skill'],
      });
      skillSnapshotBefore = estimates.map((e) => ({
        skillId: e.skillId,
        skillName: e.skill?.name ?? e.skillId,
        abilityEstimate: e.abilityEstimate,
        masteryStatus: e.masteryStatus,
      }));

      const snapshotIds = new Set(estimates.map((e) => e.skillId));
      const missing = skillIds.filter((id) => !snapshotIds.has(id));
      if (missing.length > 0) {
        const skills = await this.skillRepo.find({ where: missing.map((id) => ({ id })) });
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

    // 4. Create exercise
    const exercise = this.exerciseRepo.create({
      title: `Mock Test - ${new Date().toLocaleDateString()}`,
      type: ExerciseType.MOCK_TEST,
      passageId: null,
      questionIds,
      skillsFocus: skillIds,
      difficulty: 3,
      estimatedMinutes: 64,
      isAiGenerated: false,
    });
    const savedExercise = await this.exerciseRepo.save(exercise);

    // 5. Create session
    const session = this.sessionRepo.create({
      studentId,
      exerciseId: savedExercise.id,
      status: PracticeSessionStatus.IN_PROGRESS,
      startedAt: new Date(),
      timeLimitSeconds: MOCK_TEST_TIME_LIMIT,
      skillSnapshotBefore,
    });
    const savedSession = await this.sessionRepo.save(session);

    // Track study session
    await this.getOrCreateTodayStudySession(studentId);

    // 6. Build response — Digital SAT: each passageGroup = 1 passage + 1 question
    const passageGroups = finalQuestions.map((q) => ({
      passage: q.passage ? {
        id: q.passage.id,
        title: q.passage.title,
        text: q.passage.text,
        type: q.passage.type,
      } : null,
      questions: [{
        id: q.id,
        stem: q.stem,
        choices: q.choices,
      }],
    }));

    return {
      sessionId: savedSession.id,
      timeLimitSeconds: MOCK_TEST_TIME_LIMIT,
      totalQuestions: questionIds.length,
      passageGroups,
    };
  }

  async getMockTest(studentId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Mock test session not found.');
    if (session.studentId !== studentId) throw new ForbiddenException('Access denied.');

    const exercise = await this.exerciseRepo.findOne({ where: { id: session.exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found.');

    // Load questions in order
    const questions = await Promise.all(
      exercise.questionIds.map((id) => this.questionRepo.findOne({ where: { id } })),
    );
    const validQuestions = questions.filter((q): q is Question => q !== null);

    // Group by passage using question.passageId directly
    const passageIds = new Set(validQuestions.map((q) => q.passageId).filter(Boolean));
    const passages = passageIds.size > 0
      ? await this.passageRepo.find({ where: Array.from(passageIds).map((id) => ({ id })) })
      : [];
    const passageById = new Map(passages.map((p) => [p.id, p]));

    const groupOrder: string[] = [];
    const groupMap = new Map<string, { passage: any; questions: any[] }>();

    for (const q of validQuestions) {
      const pid = q.passageId || 'unknown';
      if (!groupMap.has(pid)) {
        groupOrder.push(pid);
        const p = passageById.get(pid);
        groupMap.set(pid, {
          passage: p ? { id: p.id, title: p.title, text: p.text, type: p.type } : null,
          questions: [],
        });
      }
      groupMap.get(pid)!.questions.push({
        id: q.id,
        stem: q.stem,
        choices: q.choices,
      });
    }

    return {
      sessionId: session.id,
      status: session.status,
      timeLimitSeconds: session.timeLimitSeconds,
      startedAt: session.startedAt,
      totalQuestions: validQuestions.length,
      passageGroups: groupOrder.map((pid) => groupMap.get(pid)!),
    };
  }

  async submitAll(studentId: string, sessionId: string, dto: SubmitAllDto) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Mock test session not found.');
    if (session.studentId !== studentId) throw new ForbiddenException('Access denied.');
    if (session.status !== PracticeSessionStatus.IN_PROGRESS) {
      throw new ConflictException('This mock test session is no longer active.');
    }

    // Server-side time check with grace period
    const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 1000;
    if (session.timeLimitSeconds && elapsed > session.timeLimitSeconds + TIME_GRACE_SECONDS) {
      this.logger.warn(`Mock test time exceeded: ${elapsed}s vs limit ${session.timeLimitSeconds}s`);
    }

    // Load questions for grading
    const exercise = await this.exerciseRepo.findOne({ where: { id: session.exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found.');

    const allQuestions = await this.questionRepo.find({
      where: exercise.questionIds.map((id) => ({ id })),
      relations: ['skills'],
    });
    const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

    // Create response records and grade
    let correctCount = 0;
    const responseEntities: StudentResponse[] = [];

    for (const ans of dto.answers) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue;

      const isCorrect = ans.chosenAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      const response = this.responseRepo.create({
        studentId,
        questionId: ans.questionId,
        sessionId,
        sessionType: 'mock_test',
        chosenAnswer: ans.chosenAnswer,
        isCorrect,
        timeSpentSeconds: ans.timeSpentSeconds ?? null,
        hintsUsed: 0,
      });
      responseEntities.push(response);
    }

    await this.responseRepo.save(responseEntities);

    // Update skill estimates
    for (const resp of responseEntities) {
      const question = questionMap.get(resp.questionId);
      if (question && question.skills.length > 0) {
        const skillIds = question.skills.map((s) => s.id);
        await this.skillEstimatorService.updateMultipleSkills(
          studentId,
          skillIds,
          resp.isCorrect,
          question.difficulty,
        );
      }
    }

    const totalQuestions = responseEntities.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // SAT scaled score approximation
    const sectionScore = Math.round(10 + (correctCount / Math.max(totalQuestions, 1)) * 30);
    const estimatedTotal = Math.round(200 + ((sectionScore - 10) / 30) * 600);

    const totalTimeSeconds = dto.totalTimeSeconds ?? Math.round(elapsed);

    // Complete session
    session.status = PracticeSessionStatus.COMPLETED;
    session.completedAt = new Date();
    session.score = Math.round(score * 100) / 100;
    session.totalTimeSeconds = totalTimeSeconds;
    await this.sessionRepo.save(session);

    // Update study session
    const studySession = await this.getOrCreateTodayStudySession(studentId);
    studySession.exercisesCompleted += 1;
    studySession.totalQuestions += totalQuestions;
    studySession.correctCount += correctCount;
    studySession.endTime = new Date();
    await this.studySessionRepo.save(studySession);

    // Enqueue wrong answers for review
    const wrongResponses = responseEntities.filter((r) => !r.isCorrect);
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

    // Build skill progress
    let skillProgress: any[] = [];
    if (session.skillSnapshotBefore && session.skillSnapshotBefore.length > 0) {
      const snapSkillIds = session.skillSnapshotBefore.map((s) => s.skillId);
      const currentEstimates = await this.skillEstimateRepo.find({
        where: snapSkillIds.map((id) => ({ studentId, skillId: id })),
      });
      const currentMap = new Map(currentEstimates.map((e) => [e.skillId, e]));

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

    // Build per-question results with passage info (via question.passageId)
    const passageIdSet = new Set<string>();
    for (const q of allQuestions) {
      if (q.passageId) passageIdSet.add(q.passageId);
    }
    const passages = passageIdSet.size > 0
      ? await this.passageRepo.find({ where: Array.from(passageIdSet).map((id) => ({ id })) })
      : [];
    const passageById = new Map(passages.map((p) => [p.id, p]));

    const questionResults = responseEntities.map((r) => {
      const q = questionMap.get(r.questionId);
      const passage = q?.passageId ? passageById.get(q.passageId) : null;
      return {
        questionId: r.questionId,
        stem: q?.stem || '',
        isCorrect: r.isCorrect,
        chosenAnswer: r.chosenAnswer,
        correctAnswer: q?.correctAnswer ?? 0,
        explanation: q?.explanation || null,
        skills: (q?.skills || []).map((s) => ({ id: s.id, name: s.name })),
        passageTitle: passage?.title || null,
        passageType: passage?.type || null,
      };
    });

    // Per-type breakdown (Digital SAT: each question has its own passage, group by type)
    const passageBreakdown: { title: string; type: string; correct: number; total: number }[] = [];
    const typeStats = new Map<string, { title: string; type: string; correct: number; total: number }>();
    const typeLabels: Record<string, string> = {
      literature: 'Literature',
      history: 'History / Social Studies',
      science: 'Science',
      social_science: 'Social Science',
    };
    for (const qr of questionResults) {
      const type = qr.passageType || 'unknown';
      if (!typeStats.has(type)) {
        typeStats.set(type, { title: typeLabels[type] || type, type, correct: 0, total: 0 });
      }
      const stat = typeStats.get(type)!;
      stat.total++;
      if (qr.isCorrect) stat.correct++;
    }
    passageBreakdown.push(...typeStats.values());

    return {
      sessionId,
      score: session.score,
      totalQuestions,
      correctCount,
      totalTimeSeconds,
      timeLimitSeconds: session.timeLimitSeconds,
      sectionScore,
      estimatedTotal,
      skillProgress,
      questionResults,
      passageBreakdown,
    };
  }

  private shuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private async getOrCreateTodayStudySession(studentId: string): Promise<StudySession> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await this.studySessionRepo.findOne({
      where: { studentId, startTime: Between(todayStart, todayEnd) },
    });
    if (existing) return existing;

    return this.studySessionRepo.save(
      this.studySessionRepo.create({
        studentId,
        startTime: new Date(),
        exercisesCompleted: 0,
        totalQuestions: 0,
        correctCount: 0,
      }),
    );
  }
}
