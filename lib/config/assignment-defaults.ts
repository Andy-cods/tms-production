export type AssignmentMatchingMode = "strict" | "balanced" | "flexible";
export type AssignmentFallbackStrategy = "smart_balance" | "round_robin" | "manual_gate" | "random_spread";

export interface AdvancedAssignmentSettings {
  matching: {
    mode: AssignmentMatchingMode;
    prioritizeExactMatch: boolean;
    allowPartialMatch: boolean;
    fallbackStrategy: AssignmentFallbackStrategy;
  };
  guardrails: {
    maxAssignmentsPerUserPerDay: number;
    cooldownMinutes: number;
    slaGracePercent: number;
    backlogAgingBoost: number;
  };
  notifications: {
    notifyOnOverload: boolean;
    notifyOnSlaRisk: boolean;
    sendWeeklyDigest: boolean;
  };
  automation: {
    autoEscalateStalled: boolean;
    escalateAfterHours: number;
    autoAssignBacklogOlderThanHours: number;
  };
  scoreModifiers: {
    seniorityBoost: number;
    crossSkillBoost: number;
    burnoutPenalty: number;
  };
}

export const defaultAdvancedAssignmentSettings: AdvancedAssignmentSettings = {
  matching: {
    mode: "balanced",
    prioritizeExactMatch: true,
    allowPartialMatch: true,
    fallbackStrategy: "smart_balance",
  },
  guardrails: {
    maxAssignmentsPerUserPerDay: 0,
    cooldownMinutes: 0,
    slaGracePercent: 15,
    backlogAgingBoost: 0,
  },
  notifications: {
    notifyOnOverload: true,
    notifyOnSlaRisk: true,
    sendWeeklyDigest: false,
  },
  automation: {
    autoEscalateStalled: false,
    escalateAfterHours: 12,
    autoAssignBacklogOlderThanHours: 24,
  },
  scoreModifiers: {
    seniorityBoost: 0.1,
    crossSkillBoost: 0.1,
    burnoutPenalty: 0.15,
  },
};


