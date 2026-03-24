"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachingSessionStatus = exports.BadgeType = exports.KnowledgeBaseType = exports.LearningPathStatus = exports.SessionStatus = exports.TipCategory = exports.ExerciseType = exports.MasteryStatus = exports.PassageType = exports.SkillLevel = exports.SkillDomain = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["PARENT"] = "parent";
    UserRole["TUTOR"] = "tutor";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var SkillDomain;
(function (SkillDomain) {
    SkillDomain["INFORMATION_IDEAS"] = "information_ideas";
    SkillDomain["RHETORIC"] = "rhetoric";
    SkillDomain["SYNTHESIS"] = "synthesis";
    SkillDomain["PASSAGE_TYPE_PROFICIENCY"] = "passage_type_proficiency";
})(SkillDomain || (exports.SkillDomain = SkillDomain = {}));
var SkillLevel;
(function (SkillLevel) {
    SkillLevel["DOMAIN"] = "domain";
    SkillLevel["SKILL"] = "skill";
    SkillLevel["SUBSKILL"] = "subskill";
})(SkillLevel || (exports.SkillLevel = SkillLevel = {}));
var PassageType;
(function (PassageType) {
    PassageType["LITERATURE"] = "literature";
    PassageType["HISTORY"] = "history";
    PassageType["SCIENCE"] = "science";
    PassageType["SOCIAL_SCIENCE"] = "social_science";
})(PassageType || (exports.PassageType = PassageType = {}));
var MasteryStatus;
(function (MasteryStatus) {
    MasteryStatus["NOVICE"] = "novice";
    MasteryStatus["DEVELOPING"] = "developing";
    MasteryStatus["PROFICIENT"] = "proficient";
    MasteryStatus["MASTERED"] = "mastered";
})(MasteryStatus || (exports.MasteryStatus = MasteryStatus = {}));
var ExerciseType;
(function (ExerciseType) {
    ExerciseType["DIAGNOSTIC"] = "diagnostic";
    ExerciseType["PRACTICE"] = "practice";
    ExerciseType["REVIEW"] = "review";
    ExerciseType["DRILL"] = "drill";
})(ExerciseType || (exports.ExerciseType = ExerciseType = {}));
var TipCategory;
(function (TipCategory) {
    TipCategory["ERROR_PATTERN"] = "error_pattern";
    TipCategory["STRATEGY"] = "strategy";
    TipCategory["TIMING"] = "timing";
    TipCategory["ENCOURAGEMENT"] = "encouragement";
    TipCategory["PASSAGE_TYPE"] = "passage_type";
})(TipCategory || (exports.TipCategory = TipCategory = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["ABANDONED"] = "abandoned";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var LearningPathStatus;
(function (LearningPathStatus) {
    LearningPathStatus["ACTIVE"] = "active";
    LearningPathStatus["COMPLETED"] = "completed";
    LearningPathStatus["PAUSED"] = "paused";
})(LearningPathStatus || (exports.LearningPathStatus = LearningPathStatus = {}));
var KnowledgeBaseType;
(function (KnowledgeBaseType) {
    KnowledgeBaseType["STRATEGY"] = "strategy";
    KnowledgeBaseType["GUIDE"] = "guide";
    KnowledgeBaseType["VOCABULARY"] = "vocabulary";
    KnowledgeBaseType["TIP_TEMPLATE"] = "tip_template";
})(KnowledgeBaseType || (exports.KnowledgeBaseType = KnowledgeBaseType = {}));
var BadgeType;
(function (BadgeType) {
    BadgeType["FIRST_SESSION"] = "first_session";
    BadgeType["STREAK_3"] = "streak_3";
    BadgeType["STREAK_7"] = "streak_7";
    BadgeType["STREAK_30"] = "streak_30";
    BadgeType["SKILL_MASTERED"] = "skill_mastered";
    BadgeType["ALL_DOMAINS_PRACTICED"] = "all_domains_practiced";
    BadgeType["PERFECT_EXERCISE"] = "perfect_exercise";
    BadgeType["HUNDRED_QUESTIONS"] = "hundred_questions";
    BadgeType["FIVE_HUNDRED_QUESTIONS"] = "five_hundred_questions";
    BadgeType["DIAGNOSTIC_COMPLETE"] = "diagnostic_complete";
    BadgeType["FIRST_TIP_RATED"] = "first_tip_rated";
    BadgeType["LEVEL_5"] = "level_5";
    BadgeType["LEVEL_10"] = "level_10";
})(BadgeType || (exports.BadgeType = BadgeType = {}));
var CoachingSessionStatus;
(function (CoachingSessionStatus) {
    CoachingSessionStatus["ACTIVE"] = "active";
    CoachingSessionStatus["ENDED"] = "ended";
})(CoachingSessionStatus || (exports.CoachingSessionStatus = CoachingSessionStatus = {}));
//# sourceMappingURL=index.js.map