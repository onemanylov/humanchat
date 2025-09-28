import type {
  ModerationResponse,
  ModerationResult,
  CustomModerationResult,
} from './types';
import { MODERATION_CONFIG } from './config';

export class ModerationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async moderateText(text: string): Promise<ModerationResult> {
    try {
      const result = this.detectAskingForMoney(text);
      if (result.flagged) {
        return {
          flagged: true,
          reason: result.reason,
          categories: ['asking for money'],
        };
      }

      // Then use GPT-4o-mini for more complex moderation
      const gptResult = await this.moderateWithGPT(text);
      if (gptResult.flagged) {
        return {
          flagged: true,
          reason: gptResult.reason || 'policy violation',
          categories: gptResult.category ? [gptResult.category] : ['other'],
        };
      }

      return { flagged: false, categories: [] };
    } catch (error) {
      console.error('Moderation service error:', error);
      // In case of service failure, don't flag content to avoid false positives
      return { flagged: false, categories: [] };
    }
  }

  private detectAskingForMoney(text: string): {
    flagged: boolean;
    reason?: string;
  } {
    const lowerText = text.toLowerCase();

    const patterns = [
      /send\s+me\s+\d*\s*wld/i,
      /give\s+me\s+\d*\s*wld/i,
      /send\s+me\s+\d*\s*token/i,
      /give\s+me\s+\d*\s*token/i,
      /send\s+me\s+\d*\s*coin/i,
      /give\s+me\s+\d*\s*coin/i,
      /send\s+me\s+money/i,
      /give\s+me\s+money/i,
      /i\s+need\s+money/i,
      /i\s+need\s+wld/i,
      /i\s+need\s+token/i,
      /can\s+you\s+send/i,
      /please\s+send/i,
      /donate\s+to\s+me/i,
      /help\s+me\s+with\s+money/i,
      /need\s+financial\s+help/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        return {
          flagged: true,
          reason: 'asking for money',
        };
      }
    }

    return { flagged: false };
  }

  private async moderateWithGPT(text: string): Promise<CustomModerationResult> {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODERATION_CONFIG.OPENAI_MODEL,
            messages: [
              {
                role: 'user',
                content: `${MODERATION_CONFIG.MODERATION_PROMPT}\n\n"${text}"`,
              },
            ],
            max_completion_tokens: 100,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API failed: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data: ModerationResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return { flagged: false };
      }

      // Try to parse JSON response
      try {
        const result: CustomModerationResult = JSON.parse(content);
        return result;
      } catch (parseError) {
        console.warn('Failed to parse GPT moderation response:', content);
        return { flagged: false };
      }
    } catch (error) {
      console.error('GPT moderation error:', error);
      return { flagged: false };
    }
  }
}
