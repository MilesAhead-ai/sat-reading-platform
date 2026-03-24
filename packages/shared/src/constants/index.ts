import { SkillLevel } from '../enums';
import { ISkill } from '../types';

export const SKILL_TAXONOMY: ISkill[] = [
  // ── Information and Ideas Domain ──
  {
    id: 'information_ideas',
    name: 'Information and Ideas',
    parentId: null,
    level: SkillLevel.DOMAIN,
    masteryThreshold: 0.7,
    sortOrder: 1,
  },
  {
    id: 'information_ideas.central_ideas',
    name: 'Central Ideas and Details',
    parentId: 'information_ideas',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 2,
  },
  {
    id: 'information_ideas.command_of_evidence_textual',
    name: 'Command of Evidence (Textual)',
    parentId: 'information_ideas',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 3,
  },
  {
    id: 'information_ideas.command_of_evidence_quantitative',
    name: 'Command of Evidence (Quantitative)',
    parentId: 'information_ideas',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 4,
  },
  {
    id: 'information_ideas.inferences',
    name: 'Inferences',
    parentId: 'information_ideas',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 5,
  },

  // ── Craft and Structure Domain ──
  {
    id: 'craft_structure',
    name: 'Craft and Structure',
    parentId: null,
    level: SkillLevel.DOMAIN,
    masteryThreshold: 0.7,
    sortOrder: 6,
  },
  {
    id: 'craft_structure.words_in_context',
    name: 'Words in Context',
    parentId: 'craft_structure',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 7,
  },
  {
    id: 'craft_structure.text_structure',
    name: 'Text Structure and Purpose',
    parentId: 'craft_structure',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 8,
  },
  {
    id: 'craft_structure.cross_text_connections',
    name: 'Cross-Text Connections',
    parentId: 'craft_structure',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 9,
  },

  // ── Expression of Ideas Domain ──
  {
    id: 'expression_of_ideas',
    name: 'Expression of Ideas',
    parentId: null,
    level: SkillLevel.DOMAIN,
    masteryThreshold: 0.7,
    sortOrder: 10,
  },
  {
    id: 'expression_of_ideas.rhetorical_synthesis',
    name: 'Rhetorical Synthesis',
    parentId: 'expression_of_ideas',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 11,
  },
  {
    id: 'expression_of_ideas.transitions',
    name: 'Transitions',
    parentId: 'expression_of_ideas',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 12,
  },

  // ── Standard English Conventions Domain ──
  {
    id: 'standard_english',
    name: 'Standard English Conventions',
    parentId: null,
    level: SkillLevel.DOMAIN,
    masteryThreshold: 0.7,
    sortOrder: 13,
  },
  {
    id: 'standard_english.boundaries',
    name: 'Boundaries',
    parentId: 'standard_english',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 14,
  },
  {
    id: 'standard_english.form_structure_sense',
    name: 'Form, Structure, and Sense',
    parentId: 'standard_english',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 15,
  },

  // ── Passage Type Proficiency Domain (internal tracking) ──
  {
    id: 'passage_type_proficiency',
    name: 'Passage Type Proficiency',
    parentId: null,
    level: SkillLevel.DOMAIN,
    masteryThreshold: 0.7,
    sortOrder: 16,
  },
  {
    id: 'passage_type_proficiency.literature_passages',
    name: 'Literature Passages',
    parentId: 'passage_type_proficiency',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 17,
  },
  {
    id: 'passage_type_proficiency.history_passages',
    name: 'History Passages',
    parentId: 'passage_type_proficiency',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 18,
  },
  {
    id: 'passage_type_proficiency.science_passages',
    name: 'Science Passages',
    parentId: 'passage_type_proficiency',
    level: SkillLevel.SKILL,
    masteryThreshold: 0.65,
    sortOrder: 19,
  },
];

// Mapping from old skill IDs to new ones (for migration reference)
export const SKILL_ID_MIGRATION_MAP: Record<string, string> = {
  'information_ideas.command_of_evidence': 'information_ideas.command_of_evidence_textual',
  'rhetoric': 'craft_structure',
  'rhetoric.words_in_context': 'craft_structure.words_in_context',
  'rhetoric.text_structure': 'craft_structure.text_structure',
  'rhetoric.purpose': 'craft_structure.text_structure',
  'rhetoric.arguments': 'craft_structure.cross_text_connections',
  'synthesis': 'expression_of_ideas',
  'synthesis.multiple_texts': 'expression_of_ideas.rhetorical_synthesis',
  'synthesis.quantitative_information': 'information_ideas.command_of_evidence_quantitative',
};

export const SAT_CONFIG = {
  minScore: 200,
  maxScore: 800,
  diagnosticQuestionCount: 30,
  masteryThresholds: {
    novice: -1,
    developing: 0,
    proficient: 1,
  },
  defaultAbility: 0,
  defaultStandardError: 1,
  seConvergenceThreshold: 0.4,
} as const;
