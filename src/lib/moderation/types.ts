export type ModerationResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type CustomModerationResult = {
  flagged: boolean;
  reason?: string;
  category?: string;
};

export type ModerationResult = {
  flagged: boolean;
  reason?: string;
  categories: string[];
};

export type UserViolation = {
  warnings: number;
  tempBans: number;
  permBanned: boolean;
  lastViolation?: number;
};

export type BanStatus = {
  isBanned: boolean;
  isTemporary: boolean;
  expiresAt?: number;
  reason?: string;
};

export type ViolationAction = 'warning' | 'tempBan' | 'permBan';