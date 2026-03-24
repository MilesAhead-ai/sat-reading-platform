export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  TUTOR = 'tutor',
  ADMIN = 'admin',
}

export enum SkillDomain {
  INFORMATION_IDEAS = 'information_ideas',
  RHETORIC = 'rhetoric',
  SYNTHESIS = 'synthesis',
  PASSAGE_TYPE_PROFICIENCY = 'passage_type_proficiency',
}

export enum SkillLevel {
  DOMAIN = 'domain',
  SKILL = 'skill',
  SUBSKILL = 'subskill',
}

export enum PassageType {
  LITERATURE = 'literature',
  HISTORY = 'history',
  SCIENCE = 'science',
  SOCIAL_SCIENCE = 'social_science',
}

export enum MasteryStatus {
  NOVICE = 'novice',
  DEVELOPING = 'developing',
  PROFICIENT = 'proficient',
  MASTERED = 'mastered',
}

export enum ExerciseType {
  DIAGNOSTIC = 'diagnostic',
  PRACTICE = 'practice',
  REVIEW = 'review',
  DRILL = 'drill',
}

export enum TipCategory {
  ERROR_PATTERN = 'error_pattern',
  STRATEGY = 'strategy',
  TIMING = 'timing',
  ENCOURAGEMENT = 'encouragement',
  PASSAGE_TYPE = 'passage_type',
}

export enum SessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum LearningPathStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export enum KnowledgeBaseType {
  STRATEGY = 'strategy',
  GUIDE = 'guide',
  VOCABULARY = 'vocabulary',
  TIP_TEMPLATE = 'tip_template',
}

export enum BadgeType {
  FIRST_SESSION = 'first_session',
  STREAK_3 = 'streak_3',
  STREAK_7 = 'streak_7',
  STREAK_30 = 'streak_30',
  SKILL_MASTERED = 'skill_mastered',
  ALL_DOMAINS_PRACTICED = 'all_domains_practiced',
  PERFECT_EXERCISE = 'perfect_exercise',
  HUNDRED_QUESTIONS = 'hundred_questions',
  FIVE_HUNDRED_QUESTIONS = 'five_hundred_questions',
  DIAGNOSTIC_COMPLETE = 'diagnostic_complete',
  FIRST_TIP_RATED = 'first_tip_rated',
  LEVEL_5 = 'level_5',
  LEVEL_10 = 'level_10',
}

export enum CoachingSessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}
