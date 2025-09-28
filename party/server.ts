import type * as Party from 'partykit/server';
import { verifyJwtToken, type TokenPayload } from './auth';
import { insertMessage, deleteMessage } from './storage';
import { checkRateLimit } from './utils/rateLimit';
import { redisPersistError } from './utils/redis';
import type { EnvLike } from './utils/env';
import { containsProhibitedContent } from '~/lib/chat/validation';
import type { ChatMessage } from '~/lib/chat/types';
import { CHAT_MESSAGE_MAX_LENGTH } from '~/lib/constants/chat';
import { ModerationService } from '~/lib/moderation/ModerationService';
import { UserViolationService } from '~/lib/moderation/UserViolationService';
import { BanService } from '~/lib/moderation/BanService';
import { VIOLATION_MESSAGES } from '~/lib/moderation/config';

export default class ChatServer implements Party.Server {
  readonly options: Party.ServerOptions = {
    hibernate: true,
  };

  constructor(readonly room: Party.Room) {}

  private getModerationService(): ModerationService | null {
    const apiKey = this.room.env.OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      console.warn('OpenAI API key not configured, moderation disabled');
      return null;
    }
    return new ModerationService(apiKey);
  }

  private get envSource(): EnvLike {
    return { env: this.room.env as Record<string, string | undefined> };
  }

  private parseMessage(message: string) {
    const parsed = JSON.parse(message);
    const valid =
      parsed?.type === 'chat:message' &&
      typeof parsed.text === 'string' &&
      typeof parsed.token === 'string';

    return { parsed, valid };
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const { parsed, valid } = this.parseMessage(message);
      if (!valid) return;

      await this.handleChatMessage(parsed, sender);
    } catch (err) {
      await redisPersistError(
        this.envSource,
        'onMessage: Unexpected error',
        err,
      );
    }
  }

  private async handleChatMessage(parsed: any, sender: Party.Connection) {
    // Verify JWT token
    const secret = this.room.env.JWT_SECRET as string | undefined;
    if (!secret) {
      try {
        sender.send(
          JSON.stringify({
            type: 'error:auth',
            message: 'Server configuration error',
          }),
        );
      } catch (err) {
        await redisPersistError(
          this.envSource,
          'handleChatMessage: Error sending server config error',
          err,
        );
      }
      return;
    }

    let tokenPayload: TokenPayload;
    try {
      const { payload } = await verifyJwtToken<TokenPayload>(
        parsed.token,
        secret,
      );
      tokenPayload = payload;
    } catch (err) {
      await redisPersistError(
        this.envSource,
        'handleChatMessage: JWT verification error',
        err,
      );
      try {
        sender.send(
          JSON.stringify({
            type: 'error:auth',
            message: 'Invalid or expired token',
          }),
        );
      } catch (sendErr) {
        await redisPersistError(
          this.envSource,
          'handleChatMessage: Error sending JWT error',
          sendErr,
        );
      }
      return;
    }

    // Check if user is banned before processing
    const wallet = tokenPayload.wallet;
    if (wallet) {
      try {
        const banService = new BanService(this.envSource);
        const banStatus = await banService.getBanStatus(wallet);

        if (banStatus.isBanned) {
          const message = banStatus.isTemporary
            ? VIOLATION_MESSAGES.TEMP_BAN(
                banStatus.reason || 'policy violation',
              )
            : VIOLATION_MESSAGES.PERM_BAN(
                banStatus.reason || 'policy violation',
              );

          try {
            sender.send(
              JSON.stringify({
                type: 'error:banned',
                message,
                isTemporary: banStatus.isTemporary,
                expiresAt: banStatus.expiresAt,
                reason: banStatus.reason,
              }),
            );
          } catch (err) {
            await redisPersistError(
              this.envSource,
              'handleChatMessage: Error sending ban error',
              err,
            );
          }
          return;
        }
      } catch (err) {
        await redisPersistError(
          this.envSource,
          'handleChatMessage: Error checking ban status',
          err,
        );
        // Continue processing if ban check fails - fail open
      }
    }

    const text = String(parsed.text).trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
    if (!text) return;

    if (containsProhibitedContent(text)) {
      try {
        sender.send(
          JSON.stringify({
            type: 'error:validation',
            reason: 'prohibited_content',
            message: 'Links and wallet addresses are not allowed',
          }),
        );
      } catch (err) {
        await redisPersistError(
          this.envSource,
          'handleChatMessage: Error sending validation error',
          err,
        );
      }
      return;
    }

    // Rate limiting
    const key = tokenPayload.wallet ?? `conn:${sender.id}`;
    try {
      const result = await checkRateLimit(this.room.env, key);
      if (result && !result.success) {
        try {
          sender.send(
            JSON.stringify({
              type: 'error:rateLimit',
              message: 'Rate limit exceeded',
              retryAt: result.reset,
              limit: result.limit,
              remaining: result.remaining,
            }),
          );
        } catch (err) {
          await redisPersistError(
            this.envSource,
            'handleChatMessage: Error sending rate limit error',
            err,
          );
        }
        return;
      }
    } catch (err) {
      await redisPersistError(
        this.envSource,
        'handleChatMessage: Rate limit error',
        err,
      );
    }

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      clientId: parsed.clientId ?? undefined,
      text,
      wallet: tokenPayload.wallet || null,
      username: tokenPayload.username || null,
      profilePictureUrl: parsed.profilePictureUrl || null,
      ts: Date.now(),
    };

    try {
      // Store message and broadcast immediately (optimistic send)
      await insertMessage(this.envSource, chatMessage);
      this.room.broadcast(
        JSON.stringify({ type: 'chat:new', message: chatMessage }),
      );

      // Moderate the message asynchronously
      this.moderateMessageAsync(chatMessage);
    } catch (err) {
      await redisPersistError(
        this.envSource,
        'handleChatMessage: Message storage/broadcast error',
        err,
      );
    }
  }

  private async moderateMessageAsync(message: ChatMessage) {
    try {
      const moderationService = this.getModerationService();
      if (!moderationService || !message.wallet) {
        return; // Skip moderation if service unavailable or no wallet
      }

      const moderationResult = await moderationService.moderateText(
        message.text,
      );

      if (moderationResult.flagged) {
        console.log(
          `Message flagged: ${message.id} - ${moderationResult.reason}`,
        );

        // Delete the message from storage
        try {
          await deleteMessage(this.envSource, message.id);
        } catch (err) {
          await redisPersistError(
            this.envSource,
            'moderateMessageAsync: Error deleting message',
            err,
          );
          // Continue with violation handling even if deletion fails
        }

        // Broadcast message deletion to all clients
        try {
          this.room.broadcast(
            JSON.stringify({
              type: 'chat:message:deleted',
              messageId: message.id,
            }),
          );
        } catch (err) {
          await redisPersistError(
            this.envSource,
            'moderateMessageAsync: Error broadcasting message deletion',
            err,
          );
        }

        // Handle user violation
        const violationService = new UserViolationService(this.envSource);
        const banService = new BanService(this.envSource);

        let action: string;
        try {
          action = await violationService.recordViolation(
            message.wallet,
            moderationResult.reason || 'policy violation',
          );
        } catch (err) {
          await redisPersistError(
            this.envSource,
            'moderateMessageAsync: Error recording violation',
            err,
          );
          return; // Don't proceed with ban if violation recording fails
        }

        switch (action) {
          case 'warning':
            try {
              this.room.broadcast(
                JSON.stringify({
                  type: 'chat:user:warned',
                  wallet: message.wallet,
                  reason: moderationResult.reason || 'policy violation',
                }),
              );
            } catch (err) {
              await redisPersistError(
                this.envSource,
                'moderateMessageAsync: Error broadcasting user warning',
                err,
              );
            }
            break;

          case 'tempBan':
            try {
              await banService.applyTempBan(
                message.wallet,
                moderationResult.reason || 'policy violation',
              );
            } catch (err) {
              await redisPersistError(
                this.envSource,
                'moderateMessageAsync: Error applying temp ban',
                err,
              );
              break; // Don't broadcast if ban application fails
            }

            try {
              this.room.broadcast(
                JSON.stringify({
                  type: 'chat:user:banned',
                  wallet: message.wallet,
                  reason: moderationResult.reason || 'policy violation',
                  isTemporary: true,
                  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                }),
              );
            } catch (err) {
              await redisPersistError(
                this.envSource,
                'moderateMessageAsync: Error broadcasting temp ban',
                err,
              );
            }
            break;

          case 'permBan':
            try {
              await banService.applyPermBan(
                message.wallet,
                moderationResult.reason || 'policy violation',
              );
            } catch (err) {
              await redisPersistError(
                this.envSource,
                'moderateMessageAsync: Error applying perm ban',
                err,
              );
              break; // Don't broadcast if ban application fails
            }

            try {
              this.room.broadcast(
                JSON.stringify({
                  type: 'chat:user:banned',
                  wallet: message.wallet,
                  reason: moderationResult.reason || 'policy violation',
                  isTemporary: false,
                }),
              );
            } catch (err) {
              await redisPersistError(
                this.envSource,
                'moderateMessageAsync: Error broadcasting perm ban',
                err,
              );
            }
            break;
        }
      }
    } catch (error) {
      await redisPersistError(
        this.envSource,
        'moderateMessageAsync: Moderation error',
        error,
      );
      // Don't take action on moderation errors to avoid false positives
    }
  }
}
