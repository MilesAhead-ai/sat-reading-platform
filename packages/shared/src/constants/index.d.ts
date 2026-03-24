import { ISkill } from '../types';
export declare const SKILL_TAXONOMY: ISkill[];
export declare const SAT_CONFIG: {
    readonly minScore: 200;
    readonly maxScore: 800;
    readonly diagnosticQuestionCount: 30;
    readonly masteryThresholds: {
        readonly novice: -1;
        readonly developing: 0;
        readonly proficient: 1;
    };
    readonly defaultAbility: 0;
    readonly defaultStandardError: 1;
    readonly seConvergenceThreshold: 0.4;
};
//# sourceMappingURL=index.d.ts.map