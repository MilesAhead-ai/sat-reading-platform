import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Passage } from '../../database/entities/passage.entity';
import { Question } from '../../database/entities/question.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Skill } from '../../database/entities/skill.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Passage)
    private readonly passageRepo: Repository<Passage>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  /* ───── Passages ───── */

  async getPassages(filters?: { type?: string; difficulty?: number }) {
    const where: Record<string, unknown> = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.difficulty !== undefined) where.difficulty = filters.difficulty;
    return this.passageRepo.find({ where });
  }

  async getPassageById(id: string) {
    const passage = await this.passageRepo.findOne({ where: { id } });
    if (!passage) return null;

    const questions = await this.questionRepo.find({
      where: { passageId: id },
    });

    return { ...passage, questions };
  }

  async createPassage(data: Partial<Passage>) {
    const passage = this.passageRepo.create(data);
    return this.passageRepo.save(passage);
  }

  /* ───── Questions ───── */

  async getQuestions(filters?: {
    skillId?: string;
    difficulty?: number;
    passageId?: string;
  }) {
    const qb = this.questionRepo.createQueryBuilder('question');

    if (filters?.skillId) {
      qb.innerJoin('question.skills', 'skill', 'skill.id = :skillId', {
        skillId: filters.skillId,
      });
    }

    if (filters?.difficulty !== undefined) {
      qb.andWhere('question.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters?.passageId) {
      qb.andWhere('question.passageId = :passageId', {
        passageId: filters.passageId,
      });
    }

    return qb.getMany();
  }

  async getQuestionById(id: string) {
    return this.questionRepo.findOne({
      where: { id },
      relations: ['passage', 'skills'],
    });
  }

  async createQuestion(data: Partial<Question> & { skillIds?: string[] }) {
    const { skillIds, ...rest } = data;
    const question = this.questionRepo.create(rest);

    if (skillIds && skillIds.length > 0) {
      question.skills = await this.skillRepo.find({
        where: { id: In(skillIds) },
      });
    }

    return this.questionRepo.save(question);
  }

  /* ───── Exercises ───── */

  async getExercises(filters?: { type?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.type) where.type = filters.type;
    return this.exerciseRepo.find({ where });
  }

  async getExerciseById(id: string) {
    return this.exerciseRepo.findOne({ where: { id } });
  }

  async getExerciseWithContent(exerciseId: string) {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
    });
    if (!exercise) return null;

    const questions =
      exercise.questionIds && exercise.questionIds.length > 0
        ? await this.questionRepo.find({
            where: { id: In(exercise.questionIds) },
            relations: ['skills'],
          })
        : [];

    // Load passages from exercise.passageId or questions' passageIds
    const passageIds = exercise.passageId
      ? [exercise.passageId]
      : [...new Set(questions.map((q) => q.passageId).filter(Boolean))];

    const passageMap = new Map<string, Passage>();
    if (passageIds.length > 0) {
      const loaded = await this.passageRepo.find({
        where: passageIds.map((id) => ({ id })),
      });
      for (const p of loaded) passageMap.set(p.id, p);
    }

    const passage = exercise.passageId
      ? (passageMap.get(exercise.passageId) ?? null)
      : null;

    // Build passageGroups (Digital SAT: 1 passage per question)
    const passageGroups = questions.map((q) => {
      const p = passageMap.get(q.passageId);
      return {
        passage: p ? { id: p.id, title: p.title, text: p.text, type: p.type } : null,
        questions: [{ id: q.id, stem: q.stem, choices: q.choices }],
      };
    });

    // Resolve skillsFocus IDs to human-readable names
    let targetedSkills: { id: string; name: string }[] = [];
    if (exercise.skillsFocus && exercise.skillsFocus.length > 0) {
      const skills = await this.skillRepo.find({
        where: exercise.skillsFocus.map((id) => ({ id })),
      });
      targetedSkills = skills.map((s) => ({ id: s.id, name: s.name }));
    }

    return { exercise, passage, passageGroups, questions, targetedSkills };
  }

  async createExercise(data: Partial<Exercise>) {
    const exercise = this.exerciseRepo.create(data);
    return this.exerciseRepo.save(exercise);
  }
}
