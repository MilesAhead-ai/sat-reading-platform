import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { Passage } from '../entities/passage.entity';
import { Question } from '../entities/question.entity';
import { Exercise, ExerciseType } from '../entities/exercise.entity';
import { Skill } from '../entities/skill.entity';
import { SKILL_ID_MIGRATION_MAP } from '@sat/shared';

const shortIdFromUuid = (uuid: string): string =>
  createHash('md5').update(uuid).digest('hex').substring(0, 8);

import { literaturePassages, literatureQuestions } from './content-literature.seed';
import { historyPassages, historyQuestions } from './content-history.seed';
import { sciencePassages, scienceQuestions } from './content-science.seed';
import { socialSciencePassages, socialScienceQuestions } from './content-social.seed';

/** Map old skill IDs to new Digital SAT taxonomy IDs */
const migrateSkillId = (id: string): string => SKILL_ID_MIGRATION_MAP[id] || id;

// ── Deterministic UUIDs ──
const Q = (n: number) =>
  `10000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;
const E = (n: number) =>
  `20000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;

export async function seedContentExpansion(
  dataSource: DataSource,
): Promise<void> {
  const passageRepo = dataSource.getRepository(Passage);
  const questionRepo = dataSource.getRepository(Question);
  const exerciseRepo = dataSource.getRepository(Exercise);
  const skillRepo = dataSource.getRepository(Skill);

  // ════════════════════════════════════════════════════════════════════
  // PASSAGES (20 new)
  // ════════════════════════════════════════════════════════════════════
  console.log('Seeding expansion passages...');
  const allPassages = [
    ...literaturePassages,
    ...historyPassages,
    ...sciencePassages,
    ...socialSciencePassages,
  ];
  await passageRepo.upsert(allPassages, ['id']);
  console.log(`  ${allPassages.length} passages upserted.`);

  // ════════════════════════════════════════════════════════════════════
  // LOAD SKILLS for linking
  // ════════════════════════════════════════════════════════════════════
  const allSkills = await skillRepo.find();
  const skillMap: Record<string, Skill> = {};
  for (const s of allSkills) {
    skillMap[s.id] = s;
  }
  const getSkills = (ids: string[]): Skill[] => {
    const uniqueIds = [...new Set(ids.map(migrateSkillId))];
    return uniqueIds.map((id) => skillMap[id]).filter(Boolean);
  };

  // ════════════════════════════════════════════════════════════════════
  // QUESTIONS (120 new)
  // ════════════════════════════════════════════════════════════════════
  console.log('Seeding expansion questions...');
  const allQuestions = [
    ...literatureQuestions,
    ...historyQuestions,
    ...scienceQuestions,
    ...socialScienceQuestions,
  ];

  // Save questions (without skills first)
  for (const qData of allQuestions) {
    const { skillIds, ...questionFields } = qData;
    await questionRepo.upsert(
      {
        ...questionFields,
        irtDiscrimination: 1,
        irtDifficulty: 0,
        irtGuessing: 0.25,
      },
      ['id'],
    );
  }

  // Link skills via the join table
  for (const qData of allQuestions) {
    const question = await questionRepo.findOne({
      where: { id: qData.id },
      relations: ['skills'],
    });
    if (question) {
      question.skills = getSkills(qData.skillIds);
      await questionRepo.save(question);
    }
  }
  console.log(`  ${allQuestions.length} questions upserted.`);

  // ════════════════════════════════════════════════════════════════════
  // EXERCISES (8 new: E16–E23)
  // ════════════════════════════════════════════════════════════════════
  console.log('Seeding expansion exercises...');

  const exercises = [
    {
      id: E(16),
      title: 'Practice: Literature - Coming of Age & Identity',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(83), Q(84), Q(85), Q(89), Q(90), Q(91), Q(107), Q(108)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'craft_structure.words_in_context',
        'information_ideas.inferences',
        'passage_type_proficiency.literature_passages',
      ],
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      id: E(17),
      title: 'Practice: Literature - Advanced Themes',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(95), Q(96), Q(97), Q(98), Q(101), Q(102), Q(103), Q(104)],
      skillsFocus: [
        'craft_structure.text_structure',
        'information_ideas.inferences',
        'passage_type_proficiency.literature_passages',
      ],
      difficulty: 4,
      estimatedMinutes: 18,
    },
    {
      id: E(18),
      title: 'Practice: History - Revolution & Reform',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(113), Q(114), Q(115), Q(119), Q(120), Q(121), Q(137), Q(138)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'craft_structure.cross_text_connections',
        'craft_structure.text_structure',
        'passage_type_proficiency.history_passages',
      ],
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      id: E(19),
      title: 'Practice: History - Founding Documents & Advanced',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(125), Q(126), Q(127), Q(128), Q(131), Q(132), Q(133), Q(134)],
      skillsFocus: [
        'craft_structure.text_structure',
        'craft_structure.cross_text_connections',
        'information_ideas.command_of_evidence_textual',
        'passage_type_proficiency.history_passages',
      ],
      difficulty: 4,
      estimatedMinutes: 18,
    },
    {
      id: E(20),
      title: 'Practice: Science - Biology & Earth Systems',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(143), Q(144), Q(145), Q(149), Q(150), Q(151), Q(167), Q(168)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'information_ideas.command_of_evidence_textual',
        'craft_structure.words_in_context',
        'passage_type_proficiency.science_passages',
      ],
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      id: E(21),
      title: 'Practice: Science - Advanced Topics',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(155), Q(156), Q(157), Q(158), Q(161), Q(162), Q(163), Q(164)],
      skillsFocus: [
        'craft_structure.text_structure',
        'information_ideas.inferences',
        'passage_type_proficiency.science_passages',
      ],
      difficulty: 4,
      estimatedMinutes: 18,
    },
    {
      id: E(22),
      title: 'Practice: Social Science - Psychology & Society',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(173), Q(174), Q(175), Q(179), Q(180), Q(181), Q(197), Q(198)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'craft_structure.words_in_context',
        'information_ideas.inferences',
      ],
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      id: E(23),
      title: 'Practice: Social Science - Advanced Analysis',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(185), Q(186), Q(187), Q(188), Q(191), Q(192), Q(193), Q(194)],
      skillsFocus: [
        'craft_structure.cross_text_connections',
        'craft_structure.text_structure',
        'information_ideas.command_of_evidence_textual',
      ],
      difficulty: 4,
      estimatedMinutes: 18,
    },
  ];

  const exercisesWithShortId = exercises.map((e: any) => ({
    ...e,
    shortId: shortIdFromUuid(e.id),
  }));
  await exerciseRepo.upsert(exercisesWithShortId, ['id']);
  console.log(`  ${exercisesWithShortId.length} exercises upserted.`);

  console.log(
    `Content expansion seeded: ${allPassages.length} passages, ${allQuestions.length} questions, ${exercises.length} exercises.`,
  );
}
