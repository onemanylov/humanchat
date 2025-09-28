import type * as Party from 'partykit/server';
import { verifyJwtToken, type TokenPayload } from './auth';
import { insertMessage } from './storage';
import { checkRateLimit } from './utils/rateLimit';
import type { EnvLike } from './utils/env';
import { containsProhibitedLink } from '~/lib/chat/validation';
import type { ChatMessage } from '~/lib/chat/types';
import { CHAT_MESSAGE_MAX_LENGTH } from '~/lib/constants/chat';

export default class ChatServer implements Party.Server {
  readonly options: Party.ServerOptions = {
    hibernate: true,
  };

  constructor(readonly room: Party.Room) {}

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

    const text = String(parsed.text).trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
    if (!text) return;

    if (containsProhibitedLink(text)) {
      return sender.send(
        JSON.stringify({
          type: 'error:validation',
          reason: 'links',
          message: 'Links are not allowed',
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
      await insertMessage(this.envSource, chatMessage);
      this.room.broadcast(
        JSON.stringify({ type: 'chat:new', message: chatMessage }),
      );
    } catch (err) {
      console.error('Message storage error:', err);
    }
  }
}
