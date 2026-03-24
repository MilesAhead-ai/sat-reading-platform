import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LearningPath,
  LearningPathStatus,
} from '../../database/entities/learning-path.entity';
import {
  StudentSkillEstimate,
  MasteryStatus,
} from '../../database/entities/student-skill-estimate.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Skill } from '../../database/entities/skill.entity';

@Injectable()
export class LearningPathService {
  constructor(
    @InjectRepository(LearningPath)
    private readonly pathRepo: Repository<LearningPath>,
    @InjectRepository(StudentSkillEstimate)
    private readonly estimateRepo: Repository<StudentSkillEstimate>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  async getActivePath(studentId: string): Promise<LearningPath | null> {
    return this.pathRepo.findOne({
      where: { studentId, status: LearningPathStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async generatePath(studentId: string): Promise<LearningPath> {
    // Deactivate any existing active path
    await this.pathRepo.update(
      { studentId, status: LearningPathStatus.ACTIVE },
      { status: LearningPathStatus.PAUSED },
    );

    // Get skill estimates sorted by ability (weakest first)
    const estimates = await this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
      order: { abilityEstimate: 'ASC' },
    });

    // Get non-mastered skills, prioritize weakest
    const weakSkills = estimates.filter(
      (e) =>
        e.masteryStatus !== MasteryStatus.MASTERED &&
        e.skill?.parentId !== null,
    );

    // Focus on top 3 weakest skills
    const focusSkills = weakSkills.slice(0, 3).map((e) => e.skillId);

    // Build ordered units
    const units: LearningPath['orderedUnits'] = [];

    for (const skillId of focusSkills) {
      // Find exercises for this skill
      const exercises = await this.exerciseRepo
        .createQueryBuilder('exercise')
        .where('exercise.skills_focus @> :skillArray', {
          skillArray: JSON.stringify([skillId]),
        })
        .orderBy('exercise.difficulty', 'ASC')
        .limit(3)
        .getMany();

      // Add lesson unit
      units.push({
        type: 'lesson',
        skillId,
        status: 'pending',
      });

      // Add practice exercises
      for (const exercise of exercises) {
        units.push({
          type: 'practice',
          exerciseId: exercise.id,
          skillId,
          status: 'pending',
        });
      }

      // Add a review unit
      units.push({
        type: 'review',
        skillId,
        status: 'pending',
      });

      // Add mastery gate after each skill block
      units.push({
        type: 'mastery_gate',
        skillId,
        status: 'pending',
      });
    }

    // Interleave some drill units for variety
    if (weakSkills.length > 3) {
      for (let i = 3; i < Math.min(6, weakSkills.length); i++) {
        units.push({
          type: 'drill',
          skillId: weakSkills[i].skillId,
          status: 'pending',
        });
      }
    }

    const path = this.pathRepo.create({
      studentId,
      orderedUnits: units,
      currentIndex: 0,
      focusSkills,
      status: LearningPathStatus.ACTIVE,
    });

    return this.pathRepo.save(path);
  }

  async getNextUnit(studentId: string) {
    const path = await this.getActivePath(studentId);
    if (!path) {
      throw new NotFoundException(
        'No active learning path. Generate one first.',
      );
    }

    if (path.currentIndex >= path.orderedUnits.length) {
      return { completed: true, path };
    }

    const currentUnit = path.orderedUnits[path.currentIndex];
    const skill = await this.skillRepo.findOne({
      where: { id: currentUnit.skillId },
    });

    return {
      completed: false,
      unitIndex: path.currentIndex,
      totalUnits: path.orderedUnits.length,
      unit: currentUnit,
      skill,
    };
  }

  async advanceUnit(studentId: string) {
    const path = await this.getActivePath(studentId);
    if (!path) {
      throw new NotFoundException('No active learning path.');
    }

    // Mark current unit as completed
    if (path.currentIndex < path.orderedUnits.length) {
      path.orderedUnits[path.currentIndex].status = 'completed';
    }

    path.currentIndex += 1;

    // Check if path is complete
    if (path.currentIndex >= path.orderedUnits.length) {
      path.status = LearningPathStatus.COMPLETED;
    }

    return this.pathRepo.save(path);
  }
}
