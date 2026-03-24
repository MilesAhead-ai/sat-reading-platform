import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Passage, PassageType } from '../../database/entities/passage.entity';
import { Question } from '../../database/entities/question.entity';
import { Exercise, ExerciseType } from '../../database/entities/exercise.entity';
import { Skill } from '../../database/entities/skill.entity';
import {
  StudentSkillEstimate,
  MasteryStatus,
} from '../../database/entities/student-skill-estimate.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import {
  PracticeSession,
} from '../../database/entities/practice-session.entity';
import { LlmService } from '../../services/llm.service';

const PASSAGE_TYPES = ['literature', 'history', 'science', 'social_science'];

interface ErrorPattern {
  skillName: string;
  skillId: string;
  examples: {
    question: string;
    studentAnswer: string;
    correctAnswer: string;
  }[];
}

@Injectable()
export class ExerciseGeneratorService {
  private readonly logger = new Logger(ExerciseGeneratorService.name);

  constructor(
    @InjectRepository(Passage)
    private readonly passageRepo: Repository<Passage>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(StudentSkillEstimate)
    private readonly skillEstimateRepo: Repository<StudentSkillEstimate>,
    @InjectRepository(StudentResponse)
    private readonly responseRepo: Repository<StudentResponse>,
    @InjectRepository(PracticeSession)
    private readonly practiceSessionRepo: Repository<PracticeSession>,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Analyze a student's recent incorrect responses grouped by skill.
   */
  private async analyzeErrorPatterns(
    studentId: string,
    targetSkillIds: string[],
  ): Promise<ErrorPattern[]> {
    // Get recent incorrect responses with question + skill data
    const wrongResponses = await this.responseRepo.find({
      where: { studentId, isCorrect: false },
      relations: ['question', 'question.skills'],
      order: { id: 'DESC' },
      take: 20,
    });

    // Group errors by skill
    const errorsBySkill = new Map<string, ErrorPattern>();

    for (const resp of wrongResponses) {
      if (!resp.question?.skills) continue;

      for (const skill of resp.question.skills) {
        if (!targetSkillIds.includes(skill.id)) continue;

        if (!errorsBySkill.has(skill.id)) {
          errorsBySkill.set(skill.id, {
            skillId: skill.id,
            skillName: skill.name,
            examples: [],
          });
        }

        const pattern = errorsBySkill.get(skill.id)!;
        if (pattern.examples.length < 3) {
          pattern.examples.push({
            question: resp.question.stem,
            studentAnswer:
              resp.question.choices[resp.chosenAnswer]?.text ??
              String(resp.chosenAnswer),
            correctAnswer:
              resp.question.choices[resp.question.correctAnswer]?.text ??
              String(resp.question.correctAnswer),
          });
        }
      }
    }

    return Array.from(errorsBySkill.values());
  }

  /**
   * Find an existing AI-generated exercise that targets the same skills and
   * difficulty band, which this student hasn't completed in the last 7 days.
   */
  private async findReusableExercise(
    studentId: string,
    targetSkillIds: string[],
    difficulty: number,
  ): Promise<{ exercise: Exercise; passage: Passage | null; questions: Question[]; targetedSkills: { id: string; name: string }[] } | null> {
    if (targetSkillIds.length === 0) return null;

    // Find AI-generated exercises whose skills_focus overlaps with target skills
    const candidates = await this.exerciseRepo
      .createQueryBuilder('exercise')
      .where('exercise.is_ai_generated = true')
      .andWhere('exercise.is_hidden = false')
      .andWhere('exercise.difficulty BETWEEN :min AND :max', {
        min: Math.max(1, difficulty - 1),
        max: Math.min(5, difficulty + 1),
      })
      .andWhere('exercise.skills_focus ?| ARRAY[:...skillIds]', {
        skillIds: targetSkillIds,
      })
      .getMany();

    if (candidates.length === 0) return null;

    // Exclude exercises this student completed in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRows = await this.practiceSessionRepo
      .createQueryBuilder('ps')
      .select('DISTINCT ps.exercise_id', 'exercise_id')
      .where('ps.student_id = :studentId', { studentId })
      .andWhere('ps.started_at > :sevenDaysAgo', { sevenDaysAgo })
      .getRawMany();

    const recentIds = new Set(recentRows.map((r) => r.exercise_id));
    const available = candidates.filter((ex) => !recentIds.has(ex.id));

    if (available.length === 0) return null;

    // Rank by skill overlap — prefer exercises that cover more target skills
    const targetSet = new Set(targetSkillIds);
    available.sort((a, b) => {
      const overlapA = a.skillsFocus.filter((s) => targetSet.has(s)).length;
      const overlapB = b.skillsFocus.filter((s) => targetSet.has(s)).length;
      return overlapB - overlapA;
    });

    const match = available[0];
    this.logger.log(
      `Reusing AI exercise ${match.id} for student ${studentId} (skills overlap with ${targetSkillIds.join(', ')})`,
    );

    // Load full content for the matched exercise
    const questions = (
      await Promise.all(
        match.questionIds.map((qId) =>
          this.questionRepo.findOne({ where: { id: qId }, relations: ['skills'] }),
        ),
      )
    ).filter((q): q is Question => q !== null);

    // Load passage: from exercise.passageId or null (questions have their own)
    let passage: Passage | null = null;
    if (match.passageId) {
      passage = await this.passageRepo.findOne({ where: { id: match.passageId } });
    }

    const skillIds = [...new Set(match.skillsFocus)];
    const skills = await this.skillRepo.find({
      where: skillIds.map((id) => ({ id })),
    });

    return {
      exercise: match,
      passage,
      questions,
      targetedSkills: skills.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  /**
   * Generate a new exercise tailored to a student's weak areas.
   */
  async generateForStudent(
    studentId: string,
  ): Promise<{ exercise: Exercise; passage: Passage | null; questions: Question[]; targetedSkills: { id: string; name: string }[] }> {
    // Get student's skill estimates sorted by ability ascending (weakest first)
    const estimates = await this.skillEstimateRepo.find({
      where: { studentId },
      relations: ['skill'],
      order: { abilityEstimate: 'ASC' },
    });

    const weakEstimates = estimates.filter(
      (e) =>
        e.masteryStatus !== MasteryStatus.MASTERED &&
        e.skill.level === 'skill',
    );

    // Pick top 2-3 weakest skills to target
    const targetEstimates =
      weakEstimates.length > 0
        ? weakEstimates.slice(0, 3)
        : estimates.filter((e) => e.skill.level === 'skill').slice(0, 3);

    if (targetEstimates.length === 0) {
      const defaultSkills = await this.skillRepo.find({
        where: { level: 'skill' as any },
        take: 3,
      });
      return this.generateWithParams({
        skills: defaultSkills.map((s) => ({ id: s.id, name: s.name })),
        difficulty: 3,
        passageType:
          PASSAGE_TYPES[Math.floor(Math.random() * PASSAGE_TYPES.length)],
        errorPatterns: [],
      });
    }

    // Determine difficulty from average ability
    const avgAbility =
      targetEstimates.reduce((sum, e) => sum + e.abilityEstimate, 0) /
      targetEstimates.length;
    let difficulty: number;
    if (avgAbility < -1.5) difficulty = 1;
    else if (avgAbility < -0.5) difficulty = 2;
    else if (avgAbility < 0.3) difficulty = 3;
    else if (avgAbility < 0.8) difficulty = 4;
    else difficulty = 5;

    // Accuracy-based boost: if student aces current difficulty, bump up by 1
    const recentAccuracy = await this.getRecentAccuracy(studentId, difficulty);
    if (recentAccuracy > 0.8 && difficulty < 5) {
      this.logger.log(
        `Student ${studentId} accuracy ${(recentAccuracy * 100).toFixed(0)}% at D${difficulty}, boosting to D${difficulty + 1}`,
      );
      difficulty += 1;
    }

    // Pick passage type — prefer types the student is weak at
    const passageTypeSkills = targetEstimates.filter((e) =>
      e.skill.id.startsWith('passage_type_proficiency.'),
    );
    let passageType: string;
    if (passageTypeSkills.length > 0) {
      const typeMap: Record<string, string> = {
        'passage_type_proficiency.literature_passages': 'literature',
        'passage_type_proficiency.history_passages': 'history',
        'passage_type_proficiency.science_passages': 'science',
      };
      passageType =
        typeMap[passageTypeSkills[0].skill.id] ||
        PASSAGE_TYPES[Math.floor(Math.random() * PASSAGE_TYPES.length)];
    } else {
      passageType =
        PASSAGE_TYPES[Math.floor(Math.random() * PASSAGE_TYPES.length)];
    }

    const targetSkills = targetEstimates
      .filter((e) => !e.skill.id.startsWith('passage_type_proficiency.'))
      .map((e) => ({ id: e.skill.id, name: e.skill.name }));

    if (targetSkills.length === 0) {
      const fallback = targetEstimates[0];
      targetSkills.push({ id: fallback.skill.id, name: fallback.skill.name });
    }

    // Try to reuse an existing AI exercise before generating a new one
    const reusable = await this.findReusableExercise(
      studentId,
      targetSkills.map((s) => s.id),
      difficulty,
    );

    if (reusable) {
      return reusable;
    }

    // Collect titles of passages the student has already seen
    const seenPassageTitles = await this.getSeenPassageTitles(studentId);

    // Analyze what the student actually gets wrong for these skills
    const errorPatterns = await this.analyzeErrorPatterns(
      studentId,
      targetSkills.map((s) => s.id),
    );

    return this.generateWithParams({
      skills: targetSkills,
      difficulty,
      passageType,
      errorPatterns,
      excludeTopics: seenPassageTitles,
    });
  }

  /**
   * Get titles of passages a student has already seen (diagnostic + practice).
   */
  private async getSeenPassageTitles(studentId: string): Promise<string[]> {
    const diagnosticPassages = await this.questionRepo
      .createQueryBuilder('q')
      .innerJoin('diagnostic_responses', 'dr', 'dr.question_id = q.id')
      .innerJoin('diagnostic_sessions', 'ds', 'ds.id = dr.session_id')
      .innerJoin('passages', 'p', 'p.id = q.passage_id')
      .where('ds.student_id = :studentId', { studentId })
      .select('DISTINCT p.title', 'title')
      .getRawMany();

    // Get passages seen through practice: go via questions → passages
    const practicePassages = await this.passageRepo
      .createQueryBuilder('p')
      .innerJoin('questions', 'q', 'q.passage_id = p.id')
      .innerJoin('student_responses', 'sr', 'sr.question_id = q.id')
      .where('sr.student_id = :studentId', { studentId })
      .select('DISTINCT p.title', 'title')
      .getRawMany();

    return [...new Set([
      ...diagnosticPassages.map((r) => r.title),
      ...practicePassages.map((r) => r.title),
    ])];
  }

  /**
   * Get the student's recent accuracy rate at a given difficulty level.
   * Returns a value between 0 and 1, or -1 if there are fewer than 3 responses.
   */
  private async getRecentAccuracy(
    studentId: string,
    difficulty: number,
  ): Promise<number> {
    const rows = await this.responseRepo
      .createQueryBuilder('sr')
      .innerJoin('questions', 'q', 'q.id = sr.question_id')
      .where('sr.student_id = :studentId', { studentId })
      .andWhere('q.difficulty = :difficulty', { difficulty })
      .orderBy('sr.id', 'DESC')
      .limit(10)
      .select(['sr.is_correct'])
      .getRawMany();

    if (rows.length < 3) return -1;

    const correct = rows.filter((r) => r.sr_is_correct === true).length;
    return correct / rows.length;
  }

  /**
   * Generate an exercise with explicit parameters.
   * Digital SAT format: 5 independent short passages, each with 1 question.
   */
  async generateWithParams(params: {
    skills: { id: string; name: string }[];
    difficulty: number;
    passageType: string;
    errorPatterns?: ErrorPattern[];
    excludeTopics?: string[];
  }): Promise<{ exercise: Exercise; passage: Passage | null; questions: Question[]; targetedSkills: { id: string; name: string }[] }> {
    this.logger.log(
      `Generating exercise: type=${params.passageType}, difficulty=${params.difficulty}, skills=${params.skills.map((s) => s.id).join(',')}`,
    );

    const generated = await this.llmService.generateExerciseContent({
      targetSkills: params.skills,
      difficulty: params.difficulty,
      passageType: params.passageType,
      errorPatterns: params.errorPatterns,
      excludeTopics: params.excludeTopics,
    });

    // Load all skills for validation
    const allSkills = await this.skillRepo.find();
    const skillMap = new Map(allSkills.map((s) => [s.id, s]));
    const requestedSkillIds = new Set(params.skills.map((s) => s.id));

    // Save each item: 1 passage + 1 question per item
    const savedQuestions: Question[] = [];

    for (const item of generated.items) {
      // Save passage
      const wordCount = item.passage.text.split(/\s+/).length;
      const passage = this.passageRepo.create({
        title: item.passage.title,
        text: item.passage.text,
        type: params.passageType as PassageType,
        difficulty: params.difficulty,
        wordCount,
        source: item.passage.source,
        reviewStatus: 'ai_generated',
      });
      const savedPassage = await this.passageRepo.save(passage);

      // Validate skill IDs
      const q = item.question;
      let validSkills = (q.skillIds || [])
        .map((id) => skillMap.get(id))
        .filter(Boolean) as Skill[];

      const hasTargetSkill = validSkills.some((s) =>
        requestedSkillIds.has(s.id),
      );
      if (!hasTargetSkill) {
        this.logger.warn(
          `Question "${q.stem.slice(0, 50)}..." had no target skills, overriding`,
        );
        validSkills = params.skills
          .map((ts) => skillMap.get(ts.id))
          .filter(Boolean) as Skill[];
      }

      if (validSkills.length === 0) {
        for (const ts of params.skills) {
          const s = skillMap.get(ts.id);
          if (s) validSkills.push(s);
        }
      }

      const correctAnswer = Math.min(Math.max(0, q.correctAnswer), 3);
      const irtDifficulty = (params.difficulty - 3) * 0.75;

      const question = this.questionRepo.create({
        passageId: savedPassage.id,
        stem: q.stem,
        choices: q.choices,
        correctAnswer,
        explanation: q.explanation,
        hint: q.hint,
        difficulty: q.difficulty || params.difficulty,
        irtDiscrimination: 1,
        irtDifficulty,
        irtGuessing: 0.25,
        skills: validSkills,
      });

      const saved = await this.questionRepo.save(question);
      savedQuestions.push(saved);
    }

    // Build exercise — passageId is null (questions link to their own passages)
    const questionIds = savedQuestions.map((q) => q.id);
    const skillsFocus = [
      ...new Set(
        savedQuestions.flatMap((q) => q.skills?.map((s) => s.id) || []),
      ),
    ];

    for (const s of params.skills) {
      if (!skillsFocus.includes(s.id)) {
        skillsFocus.push(s.id);
      }
    }

    const exercise = this.exerciseRepo.create({
      title: `Practice: ${params.passageType} (D${params.difficulty})`,
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds,
      skillsFocus,
      difficulty: params.difficulty,
      estimatedMinutes: Math.max(5, savedQuestions.length * 2),
      isAiGenerated: true,
    });
    const savedExercise = await this.exerciseRepo.save(exercise);

    this.logger.log(
      `Generated exercise ${savedExercise.id} with ${savedQuestions.length} questions (${savedQuestions.length} passages) targeting skills: ${skillsFocus.join(', ')}`,
    );

    return {
      exercise: savedExercise,
      passage: null,
      questions: savedQuestions,
      targetedSkills: params.skills.map((s) => ({ id: s.id, name: s.name })),
    };
  }
}
