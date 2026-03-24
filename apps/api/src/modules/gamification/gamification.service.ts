import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, BadgeType } from '../../database/entities/badge.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import {
  StudentSkillEstimate,
  MasteryStatus,
} from '../../database/entities/student-skill-estimate.entity';

const XP_PER_CORRECT = 10;
const XP_PER_INCORRECT = 3;
const XP_PER_EXERCISE = 25;
const XP_PER_LEVEL = 200;

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(StudentResponse)
    private readonly responseRepo: Repository<StudentResponse>,
    @InjectRepository(StudySession)
    private readonly studySessionRepo: Repository<StudySession>,
    @InjectRepository(StudentSkillEstimate)
    private readonly estimateRepo: Repository<StudentSkillEstimate>,
  ) {}

  async getStudentBadges(studentId: string): Promise<Badge[]> {
    return this.badgeRepo.find({
      where: { studentId },
      order: { earnedAt: 'DESC' },
    });
  }

  async getStudentXP(
    studentId: string,
  ): Promise<{ xp: number; level: number }> {
    const correctCount = await this.responseRepo.count({
      where: { studentId, isCorrect: true },
    });
    const incorrectCount = await this.responseRepo.count({
      where: { studentId, isCorrect: false },
    });
    const sessions = await this.studySessionRepo.count({
      where: { studentId },
    });

    const xp =
      correctCount * XP_PER_CORRECT +
      incorrectCount * XP_PER_INCORRECT +
      sessions * XP_PER_EXERCISE;

    const level = Math.floor(xp / XP_PER_LEVEL) + 1;

    return { xp, level };
  }

  async checkAndAwardBadges(studentId: string): Promise<Badge[]> {
    const newBadges: Badge[] = [];
    const existing = await this.badgeRepo.find({ where: { studentId } });
    const earnedTypes = new Set(existing.map((b) => b.type));

    // First session badge
    if (!earnedTypes.has(BadgeType.FIRST_SESSION)) {
      const sessionCount = await this.studySessionRepo.count({
        where: { studentId },
      });
      if (sessionCount >= 1) {
        newBadges.push(
          await this.awardBadge(studentId, BadgeType.FIRST_SESSION),
        );
      }
    }

    // Question count badges
    const totalQuestions = await this.responseRepo.count({
      where: { studentId },
    });

    if (
      !earnedTypes.has(BadgeType.HUNDRED_QUESTIONS) &&
      totalQuestions >= 100
    ) {
      newBadges.push(
        await this.awardBadge(studentId, BadgeType.HUNDRED_QUESTIONS),
      );
    }

    if (
      !earnedTypes.has(BadgeType.FIVE_HUNDRED_QUESTIONS) &&
      totalQuestions >= 500
    ) {
      newBadges.push(
        await this.awardBadge(studentId, BadgeType.FIVE_HUNDRED_QUESTIONS),
      );
    }

    // Skill mastered badge
    if (!earnedTypes.has(BadgeType.SKILL_MASTERED)) {
      const masteredCount = await this.estimateRepo.count({
        where: { studentId, masteryStatus: MasteryStatus.MASTERED },
      });
      if (masteredCount >= 1) {
        newBadges.push(
          await this.awardBadge(studentId, BadgeType.SKILL_MASTERED),
        );
      }
    }

    // Streak badges
    const streak = await this.calculateStreak(studentId);

    if (!earnedTypes.has(BadgeType.STREAK_3) && streak >= 3) {
      newBadges.push(await this.awardBadge(studentId, BadgeType.STREAK_3));
    }
    if (!earnedTypes.has(BadgeType.STREAK_7) && streak >= 7) {
      newBadges.push(await this.awardBadge(studentId, BadgeType.STREAK_7));
    }
    if (!earnedTypes.has(BadgeType.STREAK_30) && streak >= 30) {
      newBadges.push(await this.awardBadge(studentId, BadgeType.STREAK_30));
    }

    // Level badges
    const { level } = await this.getStudentXP(studentId);

    if (!earnedTypes.has(BadgeType.LEVEL_5) && level >= 5) {
      newBadges.push(await this.awardBadge(studentId, BadgeType.LEVEL_5));
    }
    if (!earnedTypes.has(BadgeType.LEVEL_10) && level >= 10) {
      newBadges.push(await this.awardBadge(studentId, BadgeType.LEVEL_10));
    }

    return newBadges;
  }

  private async awardBadge(
    studentId: string,
    type: BadgeType,
  ): Promise<Badge> {
    const badge = this.badgeRepo.create({ studentId, type });
    return this.badgeRepo.save(badge);
  }

  private async calculateStreak(studentId: string): Promise<number> {
    const sessions = await this.studySessionRepo
      .createQueryBuilder('session')
      .select('DATE(session.start_time)', 'sessionDate')
      .where('session.student_id = :studentId', { studentId })
      .groupBy('DATE(session.start_time)')
      .orderBy('DATE(session.start_time)', 'DESC')
      .getRawMany();

    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].sessionDate);
      sessionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
