export const MODERATION_CONFIG = {
  OPENAI_MODEL: 'gpt-5-nano',
  TEMP_BAN_DURATION_HOURS: 24,
  MAX_WARNINGS_BEFORE_TEMP_BAN: 1,
  MAX_TEMP_BANS_BEFORE_PERM_BAN: 1,
  APPEAL_URL: 'https://worldcoin.org/support',

  // Custom moderation prompt
  MODERATION_PROMPT: `You are a content moderator for a crypto chat platform. Analyze the following message and determine if it violates any rules.

Rules:
1. No harassment, threats, or personal attacks
2. No hate speech based on race, religion, gender, sexuality, etc.
3. No explicit sexual content
4. No spam or excessive repetition
5. No asking/begging for money/tokens (e.g., "send me WLD", "give me tokens", "I need money")
6. No promotion of scams or illegal activities
7. No doxxing or sharing personal information

Respond with a JSON object:
{
  "flagged": boolean,
  "reason": string | null,
  "category": string | null
}

If flagged=true, provide a brief reason and category. Categories: "harassment", "hate", "sexual", "spam", "asking for money", "scam", "doxx", "other", "asking for money"

Message to analyze:`,
} as const;

// Map internal reasons to user-friendly messages
const REASON_MESSAGES: Record<string, string> = {
  'asking for money': 'asking for money',
  harassment: 'harassment',
  hate: 'hate speech',
  sexual: 'inappropriate content',
  spam: 'spam',
  scam: 'suspicious activity',
  doxx: 'sharing personal info',
  other: 'policy violation',
};

function formatReason(reason: string): string {
  return REASON_MESSAGES[reason] || reason;
}

export const VIOLATION_MESSAGES = {
  WARNING: (reason: string) =>
    `⚠️ Your message was flagged for ${formatReason(reason)}.`,
  TEMP_BAN: (reason: string) =>
    `🚫 You've been banned for 24h: ${formatReason(reason)}.`,
  PERM_BAN: (reason: string) =>
    `🚫 Permanently banned: ${formatReason(reason)}.`,
} as const;
