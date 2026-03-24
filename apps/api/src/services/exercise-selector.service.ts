import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StudentSkillEstimate,
  MasteryStatus,
  Exercise,
  PracticeSession,
  Skill,
} from '../database/entities';

@Injectable()
export class ExerciseSelectorService {
  constructor(
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepository: Repository<StudentSkillEstimate>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(PracticeSession)
    private readonly practiceSessionRepository: Repository<PracticeSession>,
  ) {}

  getDifficultyBand(ability: number): [number, number] {
    if (ability < -1) {
      return [1, 2];
    } else if (ability <= 0) {
      return [2, 3];
    } else if (ability <= 1) {
      return [3, 4];
    } else {
      return [4, 5];
    }
  }

  async selectNextExercise(studentId: string): Promise<Exercise | null> {
    // a. Get all student skill estimates, sorted by abilityEstimate ascending (weakest first)
    const estimates = await this.skillEstimateRepository.find({
      where: { studentId },
      order: { abilityEstimate: 'ASC' },
    });

    if (estimates.length === 0) {
      // New student with no diagnostic data: return an easy exercise
      const easyExercises = await this.exerciseRepository
        .createQueryBuilder('exercise')
        .where('exercise.difficulty BETWEEN :min AND :max', { min: 1, max: 2 })
        .andWhere('exercise.type NOT IN (:...excludeTypes)', { excludeTypes: ['mock_test', 'diagnostic'] })
        .andWhere('exercise.is_hidden = false')
        .orderBy('RANDOM()')
        .limit(1)
        .getMany();

      if (easyExercises.length > 0) {
        return easyExercises[0];
      }

      // Fallback: any non-mock, non-hidden exercise
      const anyExercise = await this.exerciseRepository
        .createQueryBuilder('exercise')
        .where('exercise.type NOT IN (:...excludeTypes)', { excludeTypes: ['mock_test', 'diagnostic'] })
        .andWhere('exercise.is_hidden = false')
        .orderBy('exercise.difficulty', 'ASC')
        .limit(1)
        .getOne();

      return anyExercise;
    }

    // b. Pick the weakest leaf skill that is NOT mastered
    //    Skip parent/domain-level skills (no dot in ID) — exercises only reference leaf skills
    const leafEstimates = estimates.filter((e) => e.skillId.includes('.'));

    let targetEstimate = leafEstimates.find(
      (e) => e.masteryStatus !== MasteryStatus.MASTERED,
    );

    // c. If all leaf skills are mastered, pick the one with highest standardError (most uncertain)
    if (!targetEstimate) {
      const pool = leafEstimates.length > 0 ? leafEstimates : estimates;
      targetEstimate = pool.reduce((prev, curr) =>
        curr.standardError > prev.standardError ? curr : prev,
      );
    }

    const targetSkillId = targetEstimate.skillId;
    const ability = targetEstimate.abilityEstimate;

    // d. Map ability to difficulty band
    const [minDifficulty, maxDifficulty] = this.getDifficultyBand(ability);

    // e/f. Find matching exercises, filtering out those completed in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessionRows = await this.practiceSessionRepository
      .createQueryBuilder('ps')
      .select('ps.exercise_id', 'exercise_id')
      .where('ps.student_id = :studentId', { studentId })
      .andWhere('ps.started_at > :sevenDaysAgo', { sevenDaysAgo })
      .getRawMany();

    const recentExerciseIds = recentSessionRows.map(
      (row) => row.exercise_id,
    );

    // Get all exercise IDs ever attempted by this student
    const allSessionRows = await this.practiceSessionRepository
      .createQueryBuilder('ps')
      .select('DISTINCT ps.exercise_id', 'exercise_id')
      .where('ps.student_id = :studentId', { studentId })
      .getRawMany();

    const allAttemptedExerciseIds = allSessionRows.map(
      (row) => row.exercise_id,
    );

    // Query exercises matching target skill and difficulty band
    let candidates = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .where('exercise.skills_focus @> :skillArray', {
        skillArray: JSON.stringify([targetSkillId]),
      })
      .andWhere('exercise.difficulty BETWEEN :min AND :max', {
        min: minDifficulty,
        max: maxDifficulty,
      })
      .andWhere('exercise.type NOT IN (:...excludeTypes)', { excludeTypes: ['mock_test', 'diagnostic'] })
      .andWhere('exercise.is_hidden = false')
      .getMany();

    // f. Filter out recently completed exercises
    if (recentExerciseIds.length > 0) {
      candidates = candidates.filter(
        (ex) => !recentExerciseIds.includes(ex.id),
      );
    }

    if (candidates.length > 0) {
      // g. Prefer exercises the student has never attempted
      const neverAttempted = candidates.filter(
        (ex) => !allAttemptedExerciseIds.includes(ex.id),
      );

      return neverAttempted.length > 0 ? neverAttempted[0] : candidates[0];
    }

    // h. Broaden: try exercises for the same domain (parent skill)
    const skill = await this.skillEstimateRepository.manager
      .getRepository(Skill)
      .findOne({ where: { id: targetSkillId } });

    if (skill?.parentId) {
      const siblingSkills = await this.skillEstimateRepository.manager
        .getRepository(Skill)
        .find({ where: { parentId: skill.parentId } });

      const siblingSkillIds = siblingSkills.map((s) => s.id);

      let domainCandidates = await this.exerciseRepository
        .createQueryBuilder('exercise')
        .where(
          `exercise.skills_focus ?| ARRAY[:...siblingSkillIds]`,
          { siblingSkillIds },
        )
        .andWhere('exercise.difficulty BETWEEN :min AND :max', {
          min: minDifficulty,
          max: maxDifficulty,
        })
        .andWhere('exercise.type NOT IN (:...excludeTypes)', { excludeTypes: ['mock_test', 'diagnostic'] })
        .andWhere('exercise.is_hidden = false')
        .getMany();

      if (recentExerciseIds.length > 0) {
        domainCandidates = domainCandidates.filter(
          (ex) => !recentExerciseIds.includes(ex.id),
        );
      }

      if (domainCandidates.length > 0) {
        const neverAttempted = domainCandidates.filter(
          (ex) => !allAttemptedExerciseIds.includes(ex.id),
        );

        return neverAttempted.length > 0
          ? neverAttempted[0]
          : domainCandidates[0];
      }
    }

    // h (continued). Widen difficulty range by +/- 1
    const widenedMin = Math.max(1, minDifficulty - 1);
    const widenedMax = Math.min(5, maxDifficulty + 1);

    let widenedCandidates = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .where('exercise.skills_focus @> :skillArray', {
        skillArray: JSON.stringify([targetSkillId]),
      })
      .andWhere('exercise.difficulty BETWEEN :min AND :max', {
        min: widenedMin,
        max: widenedMax,
      })
      .andWhere('exercise.type NOT IN (:...excludeTypes)', { excludeTypes: ['mock_test', 'diagnostic'] })
      .andWhere('exercise.is_hidden = false')
      .getMany();

    if (recentExerciseIds.length > 0) {
      widenedCandidates = widenedCandidates.filter(
        (ex) => !recentExerciseIds.includes(ex.id),
      );
    }

    if (widenedCandidates.length > 0) {
      const neverAttempted = widenedCandidates.filter(
        (ex) => !allAttemptedExerciseIds.includes(ex.id),
      );

      return neverAttempted.length > 0
        ? neverAttempted[0]
        : widenedCandidates[0];
    }

    // i. Return null if nothing found
    return null;
  }
}
