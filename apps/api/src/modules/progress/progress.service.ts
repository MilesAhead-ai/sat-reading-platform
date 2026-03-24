import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { StudentSkillEstimate, MasteryStatus } from '../../database/entities/student-skill-estimate.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { StudentResponse, ErrorPattern } from '../../database/entities/student-response.entity';
import { Skill, SkillLevel } from '../../database/entities/skill.entity';
import { DiagnosticSession } from '../../database/entities/diagnostic-session.entity';
import { Question } from '../../database/entities/question.entity';
import { KnowledgeBaseEntry, KnowledgeBaseType } from '../../database/entities/knowledge-base-entry.entity';

const SAT_CONFIG = { minScore: 200, maxScore: 800 };

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepo: Repository<StudentSkillEstimate>,
    @InjectRepository(StudySession)
    private readonly studySessionRepo: Repository<StudySession>,
    @InjectRepository(StudentResponse)
    private readonly studentResponseRepo: Repository<StudentResponse>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(DiagnosticSession)
    private readonly diagnosticSessionRepo: Repository<DiagnosticSession>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(KnowledgeBaseEntry)
    private readonly kbRepo: Repository<KnowledgeBaseEntry>,
  ) {}

  async getDashboard(studentId: string) {
    const totalQuestions = await this.studentResponseRepo.count({
      where: { studentId },
    });

    const correctCount = await this.studentResponseRepo.count({
      where: { studentId, isCorrect: true },
    });

    const accuracy =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    const totalSessions = await this.studySessionRepo.count({
      where: { studentId, totalQuestions: MoreThan(0) },
    });

    const currentStreak = await this.calculateStreak(studentId);

    const estimatedScoreRange = await this.projectScore(studentId);

    return {
      totalQuestions,
      correctCount,
      accuracy,
      totalSessions,
      currentStreak,
      estimatedScoreRange,
    };
  }

  async getSkillBreakdown(studentId: string) {
    const estimates = await this.skillEstimateRepo
      .createQueryBuilder('estimate')
      .innerJoinAndSelect('estimate.skill', 'skill')
      .where('estimate.studentId = :studentId', { studentId })
      .orderBy('skill.sortOrder', 'ASC')
      .getMany();

    const results = await Promise.all(
      estimates.map(async (estimate) => {
        const trend = await this.calculateTrend(studentId, estimate);
        return {
          skillId: estimate.skillId,
          skillName: estimate.skill.name,
          level: estimate.skill.level,
          abilityEstimate: estimate.abilityEstimate,
          standardError: estimate.standardError,
          masteryStatus: estimate.masteryStatus,
          responseCount: estimate.responseCount,
          trend,
        };
      }),
    );

    return results;
  }

  async getSessionHistory(
    studentId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const [items, total] = await this.studySessionRepo.findAndCount({
      where: { studentId, totalQuestions: MoreThan(0) },
      order: { startTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async projectScore(studentId: string) {
    const estimates = await this.skillEstimateRepo
      .createQueryBuilder('estimate')
      .innerJoin('estimate.skill', 'skill')
      .where('estimate.studentId = :studentId', { studentId })
      .andWhere('skill.level = :level', { level: SkillLevel.SKILL })
      .getMany();

    let avgAbility = 0;
    if (estimates.length > 0) {
      const totalAbility = estimates.reduce(
        (sum, e) => sum + e.abilityEstimate,
        0,
      );
      avgAbility = totalAbility / estimates.length;
    }

    const rawScore = 500 + avgAbility * 200;
    const mid = this.clampScore(rawScore);
    const low = this.clampScore(mid - 30);
    const high = this.clampScore(mid + 30);

    return { low, mid, high };
  }

  private clampScore(score: number): number {
    return Math.round(
      Math.min(SAT_CONFIG.maxScore, Math.max(SAT_CONFIG.minScore, score)),
    );
  }

  private async calculateStreak(studentId: string): Promise<number> {
    // Use UTC dates consistently to avoid timezone mismatches
    const sessions = await this.studySessionRepo
      .createQueryBuilder('session')
      .select("DATE(session.start_time AT TIME ZONE 'UTC')", 'sessionDate')
      .where('session.student_id = :studentId', { studentId })
      .andWhere('session.total_questions > 0')
      .groupBy("DATE(session.start_time AT TIME ZONE 'UTC')")
      .orderBy("DATE(session.start_time AT TIME ZONE 'UTC')", 'DESC')
      .getRawMany();

    if (sessions.length === 0) return 0;

    // Build today's UTC date (midnight)
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const mostRecentDate = new Date(sessions[0].sessionDate);
    const mostRecentUTC = Date.UTC(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), mostRecentDate.getDate());

    // Allow streak to start from today or yesterday (user may not have practiced today yet)
    const MS_PER_DAY = 86400000;
    const daysSinceLast = Math.round((todayUTC - mostRecentUTC) / MS_PER_DAY);
    if (daysSinceLast > 1) return 0; // gap of 2+ days, no streak

    let streak = 0;
    const startFrom = daysSinceLast === 0 ? todayUTC : todayUTC - MS_PER_DAY;

    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].sessionDate);
      const sessionUTC = Date.UTC(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

      const expectedUTC = startFrom - i * MS_PER_DAY;

      if (sessionUTC === expectedUTC) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async calculateTrend(
    studentId: string,
    estimate: StudentSkillEstimate,
  ): Promise<string> {
    if (estimate.responseCount < 5) {
      return 'insufficient_data';
    }

    // Get last 10 responses for this skill via the question_skills join table
    const recentResponses = await this.studentResponseRepo
      .createQueryBuilder('response')
      .innerJoin('question_skills', 'qs', 'qs.question_id = response.question_id')
      .where('response.student_id = :studentId', { studentId })
      .andWhere('qs.skill_id = :skillId', { skillId: estimate.skillId })
      .orderBy('response.id', 'DESC')
      .limit(10)
      .getMany();

    if (recentResponses.length === 0) {
      return 'insufficient_data';
    }

    // Get all responses for this skill to compute overall accuracy
    const allResponses = await this.studentResponseRepo
      .createQueryBuilder('response')
      .innerJoin('question_skills', 'qs', 'qs.question_id = response.question_id')
      .where('response.student_id = :studentId', { studentId })
      .andWhere('qs.skill_id = :skillId', { skillId: estimate.skillId })
      .getMany();

    const recentCorrect = recentResponses.filter((r) => r.isCorrect).length;
    const recentAccuracy = recentCorrect / recentResponses.length;

    const overallCorrect = allResponses.filter((r) => r.isCorrect).length;
    const overallAccuracy = overallCorrect / allResponses.length;

    if (recentAccuracy > overallAccuracy) {
      return 'improving';
    } else if (recentAccuracy < overallAccuracy) {
      return 'declining';
    }
    return 'stable';
  }

  async getRecommendations(studentId: string) {
    // Get skill estimates where mastery is NOVICE or DEVELOPING
    const weakEstimates = await this.skillEstimateRepo
      .createQueryBuilder('estimate')
      .innerJoinAndSelect('estimate.skill', 'skill')
      .where('estimate.studentId = :studentId', { studentId })
      .andWhere('estimate.masteryStatus IN (:...statuses)', {
        statuses: [MasteryStatus.NOVICE, MasteryStatus.DEVELOPING],
      })
      .andWhere('skill.level = :level', { level: SkillLevel.SKILL })
      .orderBy('estimate.abilityEstimate', 'ASC')
      .getMany();

    if (weakEstimates.length === 0) {
      return { weakSkills: [], articles: [] };
    }

    const weakSkills = weakEstimates.map((e) => ({
      skillId: e.skillId,
      skillName: e.skill.name,
      masteryStatus: e.masteryStatus,
    }));

    const weakSkillIds = weakEstimates.map((e) => e.skillId);

    // Query KB entries where skills overlap with weak skill IDs
    const allEntries = await this.kbRepo.find();
    const matchingEntries = allEntries
      .filter((entry) =>
        entry.skills.some((s) => weakSkillIds.includes(s)),
      )
      .sort((a, b) => {
        // STRATEGY first, then GUIDE
        const typeOrder: Record<string, number> = {
          [KnowledgeBaseType.STRATEGY]: 0,
          [KnowledgeBaseType.GUIDE]: 1,
          [KnowledgeBaseType.VOCABULARY]: 2,
          [KnowledgeBaseType.TIP_TEMPLATE]: 3,
        };
        return (typeOrder[a.type] ?? 4) - (typeOrder[b.type] ?? 4);
      })
      .slice(0, 5);

    const articles = matchingEntries.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      skills: e.skills,
    }));

    return { weakSkills, articles };
  }

  async getErrorPatternBreakdown(studentId: string) {
    const results = await this.studentResponseRepo
      .createQueryBuilder('r')
      .select('r.error_pattern', 'pattern')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.error_pattern IS NOT NULL')
      .groupBy('r.error_pattern')
      .getRawMany<{ pattern: string; count: number }>();

    const total = results.reduce((sum, r) => sum + r.count, 0);

    return results.map((r) => ({
      pattern: r.pattern,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  async getTimeAnalytics(studentId: string) {
    // 1. Time by difficulty: AVG time grouped by difficulty × correct/incorrect
    const timeByDifficulty = await this.studentResponseRepo
      .createQueryBuilder('r')
      .innerJoin('questions', 'q', 'q.id = r.question_id')
      .select('q.difficulty', 'difficulty')
      .addSelect('r.is_correct', 'isCorrect')
      .addSelect('ROUND(AVG(r.time_spent_seconds)::numeric, 1)', 'avgTime')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.time_spent_seconds IS NOT NULL')
      .groupBy('q.difficulty')
      .addGroupBy('r.is_correct')
      .orderBy('q.difficulty', 'ASC')
      .getRawMany();

    // 2. Counterfactuals: Top 10 time-wasting wrong answers
    const avgCorrectTimeResult = await this.studentResponseRepo
      .createQueryBuilder('r')
      .select('AVG(r.time_spent_seconds)', 'avgTime')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.is_correct = true')
      .andWhere('r.time_spent_seconds IS NOT NULL')
      .getRawOne();
    const avgCorrectTime = parseFloat(avgCorrectTimeResult?.avgTime) || 30;

    const topWasters = await this.studentResponseRepo
      .createQueryBuilder('r')
      .innerJoin('questions', 'q', 'q.id = r.question_id')
      .select('r.question_id', 'questionId')
      .addSelect('q.stem', 'stem')
      .addSelect('r.time_spent_seconds', 'timeSpent')
      .addSelect('q.difficulty', 'difficulty')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.is_correct = false')
      .andWhere('r.time_spent_seconds IS NOT NULL')
      .orderBy('r.time_spent_seconds', 'DESC')
      .limit(10)
      .getRawMany();

    const counterfactuals = topWasters.map((w) => {
      const timeSpent = parseInt(w.timeSpent, 10);
      const difficulty = parseInt(w.difficulty, 10);
      const recoverable = Math.floor(timeSpent / avgCorrectTime);

      let message: string;
      if (difficulty >= 4) {
        message = `Spent ${timeSpent}s on a hard question (difficulty ${difficulty}). On test day, flag these and return with remaining time.`;
      } else if (difficulty <= 2) {
        message = `Spent ${timeSpent}s on an easy question (difficulty ${difficulty}). These should take under ${Math.round(avgCorrectTime)}s — practice quick elimination of wrong choices.`;
      } else if (recoverable >= 2) {
        message = `Spent ${timeSpent}s here. That's enough time for ~${recoverable} other questions. Practice setting a ${Math.round(avgCorrectTime * 1.5)}s mental timer per question.`;
      } else {
        message = `Spent ${timeSpent}s on this wrong answer. This time could be better spent on questions you're more confident about.`;
      }

      return {
        questionId: w.questionId,
        stem: w.stem,
        timeSpent,
        difficulty,
        potentialQuestionsRecoverable: recoverable,
        message,
      };
    });

    // 3. Fatigue data: Accuracy in 5-minute windows across sessions
    const allResponses = await this.studentResponseRepo
      .createQueryBuilder('r')
      .innerJoin('practice_sessions', 'ps', 'ps.id = r.session_id')
      .select('r.is_correct', 'isCorrect')
      .addSelect('r.time_spent_seconds', 'timeSpent')
      .addSelect('ps.started_at', 'sessionStartedAt')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.time_spent_seconds IS NOT NULL')
      .andWhere('r.session_type = :type', { type: 'practice' })
      .orderBy('ps.started_at', 'ASC')
      .getRawMany();

    // Bucket by cumulative time in 5-minute (300s) windows
    const buckets = new Map<number, { correct: number; total: number }>();
    let cumulativeTime = 0;
    for (const resp of allResponses) {
      cumulativeTime += parseInt(resp.timeSpent, 10) || 0;
      const bucket = Math.floor(cumulativeTime / 300);
      const entry = buckets.get(bucket) || { correct: 0, total: 0 };
      entry.total++;
      if (resp.isCorrect) entry.correct++;
      buckets.set(bucket, entry);
    }

    const fatigueData = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucket, data]) => ({
        windowMinutes: `${bucket * 5}-${(bucket + 1) * 5}`,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        totalQuestions: data.total,
      }));

    // 4. Optimal thresholds: Per difficulty
    const thresholdData = await this.studentResponseRepo
      .createQueryBuilder('r')
      .innerJoin('questions', 'q', 'q.id = r.question_id')
      .select('q.difficulty', 'difficulty')
      .addSelect('r.is_correct', 'isCorrect')
      .addSelect('ROUND(AVG(r.time_spent_seconds)::numeric, 1)', 'avgTime')
      .addSelect(
        'ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY r.time_spent_seconds)::numeric, 1)',
        'p75',
      )
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.time_spent_seconds IS NOT NULL')
      .groupBy('q.difficulty')
      .addGroupBy('r.is_correct')
      .orderBy('q.difficulty', 'ASC')
      .getRawMany();

    // Merge correct/incorrect rows per difficulty
    const difficultyMap = new Map<
      number,
      { avgCorrectTime: number; avgIncorrectTime: number; p75Correct: number }
    >();
    for (const row of thresholdData) {
      const diff = parseInt(row.difficulty, 10);
      const entry = difficultyMap.get(diff) || {
        avgCorrectTime: 0,
        avgIncorrectTime: 0,
        p75Correct: 0,
      };
      if (row.isCorrect) {
        entry.avgCorrectTime = parseFloat(row.avgTime) || 0;
        entry.p75Correct = parseFloat(row.p75) || 0;
      } else {
        entry.avgIncorrectTime = parseFloat(row.avgTime) || 0;
      }
      difficultyMap.set(diff, entry);
    }

    const optimalThresholds = Array.from(difficultyMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([difficulty, data]) => ({
        difficulty,
        avgCorrectTime: data.avgCorrectTime,
        avgIncorrectTime: data.avgIncorrectTime,
        recommendedMax: Math.round(data.p75Correct * 1.2),
      }));

    return {
      timeByDifficulty,
      counterfactuals,
      fatigueData,
      optimalThresholds,
    };
  }
}
