import type * as Party from 'partykit/server';
import { verifyJwtToken, type TokenPayload } from './auth';
import { insertMessage, deleteMessage } from './storage';
import { checkRateLimit } from './utils/rateLimit';
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
      console.warn('[onMessage] invalid payload', err);
    }
  }

  private async handleChatMessage(parsed: any, sender: Party.Connection) {
    // Verify JWT token
    const secret = this.room.env.JWT_SECRET as string | undefined;
    if (!secret) {
      return sender.send(
        JSON.stringify({
          type: 'error:auth',
          message: 'Server configuration error',
        }),
      );
    }

    let tokenPayload: TokenPayload;
    try {
      const { payload } = await verifyJwtToken<TokenPayload>(
        parsed.token,
        secret,
      );
      tokenPayload = payload;
    } catch (err) {
      return sender.send(
        JSON.stringify({
          type: 'error:auth',
          message: 'Invalid or expired token',
        }),
      );
    }

    // Check if user is banned before processing
    const wallet = tokenPayload.wallet;
    if (wallet) {
      const banService = new BanService(this.envSource);
      const banStatus = await banService.getBanStatus(wallet);
      
      if (banStatus.isBanned) {
        const message = banStatus.isTemporary 
          ? VIOLATION_MESSAGES.TEMP_BAN(banStatus.reason || 'policy violation')
          : VIOLATION_MESSAGES.PERM_BAN(banStatus.reason || 'policy violation');
        
        return sender.send(
          JSON.stringify({
            type: 'error:banned',
            message,
            isTemporary: banStatus.isTemporary,
            expiresAt: banStatus.expiresAt,
            reason: banStatus.reason,
          }),
        );
      }
    }

    const text = String(parsed.text).trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
    if (!text) return;

    if (containsProhibitedContent(text)) {
      return sender.send(
        JSON.stringify({
          type: 'error:validation',
          reason: 'prohibited_content',
          message: 'Links and wallet addresses are not allowed',
        }),
      );
    }

    // Rate limiting
    const key = tokenPayload.wallet ?? `conn:${sender.id}`;
    try {
      const result = await checkRateLimit(this.room.env, key);
      if (result && !result.success) {
        return sender.send(
          JSON.stringify({
            type: 'error:rateLimit',
            message: 'Rate limit exceeded',
            retryAt: result.reset,
            limit: result.limit,
            remaining: result.remaining,
          }),
        );
      }
    } catch (err) {
      console.error('Rate limit error:', err);
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
      console.error('Message storage error:', err);
    }
  }

  private async moderateMessageAsync(message: ChatMessage) {
    try {
      const moderationService = this.getModerationService();
      if (!moderationService || !message.wallet) {
        return; // Skip moderation if service unavailable or no wallet
      }

      const moderationResult = await moderationService.moderateText(message.text);
      
      if (moderationResult.flagged) {
        console.log(`Message flagged: ${message.id} - ${moderationResult.reason}`);
        
        // Delete the message from storage
        await deleteMessage(this.envSource, message.id);
        
        // Broadcast message deletion to all clients
        this.room.broadcast(
          JSON.stringify({
            type: 'chat:message:deleted',
            messageId: message.id,
          }),
        );

        // Handle user violation
        const violationService = new UserViolationService(this.envSource);
        const banService = new BanService(this.envSource);
        
        const action = await violationService.recordViolation(
          message.wallet,
          moderationResult.reason || 'policy violation'
        );

        switch (action) {
          case 'warning':
            this.room.broadcast(
              JSON.stringify({
                type: 'chat:user:warned',
                wallet: message.wallet,
                reason: moderationResult.reason || 'policy violation',
              }),
            );
            break;

          case 'tempBan':
            await banService.applyTempBan(
              message.wallet,
              moderationResult.reason || 'policy violation'
            );
            
            this.room.broadcast(
              JSON.stringify({
                type: 'chat:user:banned',
                wallet: message.wallet,
                reason: moderationResult.reason || 'policy violation',
                isTemporary: true,
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
              }),
            );
            break;

          case 'permBan':
            await banService.applyPermBan(
              message.wallet,
              moderationResult.reason || 'policy violation'
            );
            
            this.room.broadcast(
              JSON.stringify({
                type: 'chat:user:banned',
                wallet: message.wallet,
                reason: moderationResult.reason || 'policy violation',
                isTemporary: false,
              }),
            );
            break;
        }
      }
    } catch (error) {
      console.error('Moderation error:', error);
      // Don't take action on moderation errors to avoid false positives
    }
  }
}
