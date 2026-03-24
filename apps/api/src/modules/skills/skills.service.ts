import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from '../../database/entities/skill.entity';
import {
  StudentSkillEstimate,
  MasteryStatus,
} from '../../database/entities/student-skill-estimate.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(StudentSkillEstimate)
    private readonly estimateRepo: Repository<StudentSkillEstimate>,
  ) {}

  /**
   * Fetch all skills and organize into a tree: domains with nested children.
   */
  async getSkillTree() {
    const skills = await this.skillRepo.find({ order: { sortOrder: 'ASC' } });

    const domains = skills.filter((s) => s.parentId === null);
    return domains.map((domain) => ({
      ...domain,
      children: skills.filter((s) => s.parentId === domain.id),
    }));
  }

  /**
   * Get a single skill by id.
   */
  async getSkillById(id: string): Promise<Skill> {
    const skill = await this.skillRepo.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException(`Skill "${id}" not found`);
    }
    return skill;
  }

  /**
   * Get all StudentSkillEstimate records for a student, joined with skill.
   */
  async getStudentEstimates(studentId: string): Promise<StudentSkillEstimate[]> {
    return this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
      order: { skill: { sortOrder: 'ASC' } },
    });
  }

  /**
   * Get a single estimate for a student + skill pair.
   */
  async getStudentEstimateForSkill(
    studentId: string,
    skillId: string,
  ): Promise<StudentSkillEstimate> {
    const estimate = await this.estimateRepo.findOne({
      where: { studentId, skillId },
      relations: ['skill'],
    });
    if (!estimate) {
      throw new NotFoundException(
        `Estimate not found for student "${studentId}", skill "${skillId}"`,
      );
    }
    return estimate;
  }

  /**
   * Create StudentSkillEstimate entries for ALL skills with default values.
   * Uses upsert so it is safe to call multiple times (no duplicates).
   */
  async initializeEstimates(studentId: string): Promise<void> {
    const skills = await this.skillRepo.find();

    const estimates = skills.map((skill) =>
      this.estimateRepo.create({
        studentId,
        skillId: skill.id,
        abilityEstimate: 0,
        standardError: 1,
        masteryStatus: MasteryStatus.NOVICE,
        responseCount: 0,
        lastPracticed: null,
      }),
    );

    await this.estimateRepo.upsert(estimates, ['studentId', 'skillId']);
  }
}
