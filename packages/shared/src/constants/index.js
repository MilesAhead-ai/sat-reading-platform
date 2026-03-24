"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAT_CONFIG = exports.SKILL_TAXONOMY = void 0;
const enums_1 = require("../enums");
exports.SKILL_TAXONOMY = [
    // ── Information & Ideas Domain ──
    {
        id: 'information_ideas',
        name: 'Information & Ideas',
        parentId: null,
        level: enums_1.SkillLevel.DOMAIN,
        masteryThreshold: 0.7,
        sortOrder: 1,
    },
    {
        id: 'information_ideas.central_ideas',
        name: 'Central Ideas & Details',
        parentId: 'information_ideas',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 2,
    },
    {
        id: 'information_ideas.command_of_evidence',
        name: 'Command of Evidence',
        parentId: 'information_ideas',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 3,
    },
    {
        id: 'information_ideas.inferences',
        name: 'Inferences',
        parentId: 'information_ideas',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 4,
    },
    // ── Rhetoric Domain ──
    {
        id: 'rhetoric',
        name: 'Rhetoric',
        parentId: null,
        level: enums_1.SkillLevel.DOMAIN,
        masteryThreshold: 0.7,
        sortOrder: 5,
    },
    {
        id: 'rhetoric.words_in_context',
        name: 'Words in Context',
        parentId: 'rhetoric',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 6,
    },
    {
        id: 'rhetoric.text_structure',
        name: 'Text Structure & Purpose',
        parentId: 'rhetoric',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 7,
    },
    {
        id: 'rhetoric.purpose',
        name: 'Purpose',
        parentId: 'rhetoric',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 8,
    },
    {
        id: 'rhetoric.arguments',
        name: 'Arguments',
        parentId: 'rhetoric',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 9,
    },
    // ── Synthesis Domain ──
    {
        id: 'synthesis',
        name: 'Synthesis',
        parentId: null,
        level: enums_1.SkillLevel.DOMAIN,
        masteryThreshold: 0.7,
        sortOrder: 10,
    },
    {
        id: 'synthesis.multiple_texts',
        name: 'Multiple Texts',
        parentId: 'synthesis',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 11,
    },
    {
        id: 'synthesis.quantitative_information',
        name: 'Quantitative Information',
        parentId: 'synthesis',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 12,
    },
    // ── Passage Type Proficiency Domain ──
    {
        id: 'passage_type_proficiency',
        name: 'Passage Type Proficiency',
        parentId: null,
        level: enums_1.SkillLevel.DOMAIN,
        masteryThreshold: 0.7,
        sortOrder: 13,
    },
    {
        id: 'passage_type_proficiency.literature_passages',
        name: 'Literature Passages',
        parentId: 'passage_type_proficiency',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 14,
    },
    {
        id: 'passage_type_proficiency.history_passages',
        name: 'History Passages',
        parentId: 'passage_type_proficiency',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 15,
    },
    {
        id: 'passage_type_proficiency.science_passages',
        name: 'Science Passages',
        parentId: 'passage_type_proficiency',
        level: enums_1.SkillLevel.SKILL,
        masteryThreshold: 0.65,
        sortOrder: 16,
    },
];
exports.SAT_CONFIG = {
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
};
//# sourceMappingURL=index.js.map