import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StudentSkillEstimate,
  MasteryStatus,
} from '../database/entities';

const LEARNING_RATE = 0.55;
const SE_DECAY_FACTOR = 0.95;
const MIN_STANDARD_ERROR = 0.1;

@Injectable()
export class SkillEstimatorService {
  constructor(
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepository: Repository<StudentSkillEstimate>,
  ) {}

  async updateSkillEstimate(
    studentId: string,
    skillId: string,
    isCorrect: boolean,
    questionDifficulty: number,
  ): Promise<StudentSkillEstimate> {
    const estimate = await this.getOrCreateEstimate(studentId, skillId);

    // Map 1-5 difficulty scale to IRT difficulty
    const irtDifficulty = (questionDifficulty - 3) * 0.8;

    // Calculate P(correct) using 1PL IRT model
    const pCorrect =
      1 / (1 + Math.exp(-(estimate.abilityEstimate - irtDifficulty)));

    // Learning rate scaled by current standard error
    const K = LEARNING_RATE * estimate.standardError;

    // Update ability estimate
    estimate.abilityEstimate =
      estimate.abilityEstimate + K * ((isCorrect ? 1 : 0) - pCorrect);

    // Decay standard error (with floor)
    estimate.standardError = Math.max(
      estimate.standardError * SE_DECAY_FACTOR,
      MIN_STANDARD_ERROR,
    );

    // Increment response count and update timestamp
    estimate.responseCount += 1;
    estimate.lastPracticed = new Date();

    // Determine mastery status from updated ability
    estimate.masteryStatus = this.determineMasteryStatus(
      estimate.abilityEstimate,
    );

    return this.skillEstimateRepository.save(estimate);
  }

  determineMasteryStatus(ability: number): MasteryStatus {
    if (ability < -0.5) {
      return MasteryStatus.NOVICE;
    } else if (ability < 0.5) {
      return MasteryStatus.DEVELOPING;
    } else if (ability < 1.5) {
      return MasteryStatus.PROFICIENT;
    } else {
      return MasteryStatus.MASTERED;
    }
  }

  async getOrCreateEstimate(
    studentId: string,
    skillId: string,
  ): Promise<StudentSkillEstimate> {
    const existing = await this.skillEstimateRepository.findOne({
      where: { studentId, skillId },
    });

    if (existing) {
      return existing;
    }

    const estimate = this.skillEstimateRepository.create({
      studentId,
      skillId,
      abilityEstimate: 0,
      standardError: 1,
      masteryStatus: MasteryStatus.NOVICE,
      responseCount: 0,
      lastPracticed: null,
    });

    return this.skillEstimateRepository.save(estimate);
  }

  async updateMultipleSkills(
    studentId: string,
    skillIds: string[],
    isCorrect: boolean,
    questionDifficulty: number,
  ): Promise<StudentSkillEstimate[]> {
    const results = await Promise.all(
      skillIds.map((skillId) =>
        this.updateSkillEstimate(studentId, skillId, isCorrect, questionDifficulty),
      ),
    );

    return results;
  }
}
