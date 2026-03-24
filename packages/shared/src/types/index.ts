import {
  UserRole,
  SkillLevel,
  MasteryStatus,
  PassageType,
  ExerciseType,
  SessionStatus,
  TipCategory,
} from '../enums';

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentProfile {
  id: string;
  userId: string;
  grade: number | null;
  targetScore: number | null;
  targetTestDate: Date | null;
  preferences: Record<string, any>;
}

export interface ISkill {
  id: string;
  name: string;
  parentId: string | null;
  level: SkillLevel;
  masteryThreshold: number;
  sortOrder: number;
}

export interface IStudentSkillEstimate {
  id: string;
  studentId: string;
  skillId: string;
  abilityEstimate: number;
  standardError: number;
  masteryStatus: MasteryStatus;
  lastPracticed: Date | null;
  responseCount: number;
}

export interface IPassage {
  id: string;
  title: string;
  text: string;
  type: PassageType;
  difficulty: number;
  wordCount: number;
  source: string;
  reviewStatus: string;
}

export interface IQuestionChoice {
  label: string;
  text: string;
}

export interface IQuestion {
  id: string;
  passageId: string;
  stem: string;
  choices: IQuestionChoice[];
  correctAnswer: number;
  explanation: string;
  hint: string;
  difficulty: number;
  irtDiscrimination: number;
  irtDifficulty: number;
  irtGuessing: number;
}

export interface IExercise {
  id: string;
  title: string;
  type: ExerciseType;
  passageId: string;
  questionIds: string[];
  skillsFocus: string[];
  difficulty: number;
  estimatedMinutes: number;
}

export interface IDiagnosticSession {
  id: string;
  studentId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  currentQuestionIndex: number;
}

export interface IDiagnosticResponse {
  id: string;
  sessionId: string;
  questionId: string;
  chosenAnswer: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  orderIndex: number;
}

export interface IPracticeSession {
  id: string;
  studentId: string;
  exerciseId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
}

export interface IStudentResponse {
  id: string;
  studentId: string;
  questionId: string;
  sessionId: string;
  sessionType: string;
  chosenAnswer: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
}

export interface ITip {
  id: string;
  studentId: string;
  category: TipCategory;
  content: string;
  relatedSkillId: string | null;
  studentRating: number | null;
  createdAt: Date;
}

export interface IStudySession {
  id: string;
  studentId: string;
  startTime: Date;
  endTime: Date | null;
  exercisesCompleted: number;
  totalQuestions: number;
  correctCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ILearningPathUnit {
  type: 'lesson' | 'practice' | 'drill' | 'review' | 'mastery_gate';
  exerciseId?: string;
  skillId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface ILearningPath {
  id: string;
  studentId: string;
  orderedUnits: ILearningPathUnit[];
  currentIndex: number;
  focusSkills: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeBaseEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  skills: string[];
  passageTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewQueueItem {
  id: string;
  studentId: string;
  questionId: string;
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface IBadge {
  id: string;
  studentId: string;
  type: string;
  metadata: string | null;
  earnedAt: Date;
}

export interface ICoachingMessage {
  role: 'student' | 'tutor';
  content: string;
  timestamp: string;
}

export interface ICoachingSession {
  id: string;
  studentId: string;
  status: string;
  messages: ICoachingMessage[];
  focusSkillId: string | null;
  startedAt: Date;
  endedAt: Date | null;
}
