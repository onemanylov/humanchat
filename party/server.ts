import type * as Party from 'partykit/server';
import { tokenFromRequest, verifyJwtToken } from './auth';
import { insertMessage } from './storage';
import { initializeRateLimit, CustomRateLimiter } from './utils/rateLimit';
import type { EnvLike } from './utils/env';
import { containsProhibitedLink } from '~/lib/chat/validation';
import type { ChatMessage } from '~/lib/chat/types';
import { CHAT_MESSAGE_MAX_LENGTH } from '~/lib/constants/chat';

interface ConnectionState {
  wallet: string | null;
}

export default class ChatServer implements Party.Server {
  readonly connections = new Map<string, ConnectionState>();
  private ratelimit: CustomRateLimiter | null = null;

  constructor(readonly room: Party.Room) {}

  private get envSource(): EnvLike {
    return { env: this.room.env as Record<string, string | undefined> };
  }

  static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
    try {
      const token = tokenFromRequest(request);
      if (!token) {
        return new Response('Unauthorized: missing token', { status: 401 });
      }

      const secret = lobby.env.JWT_SECRET;
      if (!secret) {
        return new Response('Server configuration error', { status: 401 });
      }

      const { payload } = await verifyJwtToken(token, secret);
      if (!payload.wallet) {
        return new Response('Unauthorized: invalid payload', { status: 401 });
      }

      request.headers.set('X-Wallet', payload.wallet);
      if (payload.username) {
        request.headers.set('X-Username', payload.username);
      }
      return request;
    } catch (err) {
      console.error('[onBeforeConnect] verify error', err);
      return new Response('Unauthorized: verify error', { status: 401 });
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const wallet = ctx.request.headers.get('X-Wallet');
    this.connections.set(conn.id, {
      wallet: wallet ?? null,
    });

    if (!this.ratelimit) {
      this.ratelimit = initializeRateLimit(this.envSource.env);
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const parsed = JSON.parse(message);
      const connection = this.connections.get(sender.id);
      if (!connection) return;

      if (
        parsed?.type === 'chat:message' &&
        typeof parsed.text === 'string' &&
        parsed.text.trim()
      ) {
        await this.handleChatMessage(parsed, sender, connection);
      }
    } catch (err) {
      // ignore malformed payloads
      console.warn('[onMessage] invalid payload', err);
    }
  }

  onClose(conn: Party.Connection) {
    this.connections.delete(conn.id);
  }

  private async handleChatMessage(
    parsed: any,
    sender: Party.Connection,
    connection: ConnectionState,
  ) {
    const text = String(parsed.text)
      .trim()
      .slice(0, CHAT_MESSAGE_MAX_LENGTH);

    if (!text) return;

    if (containsProhibitedLink(text)) {
      sender.send(
        JSON.stringify({
          type: 'error:validation',
          reason: 'links',
          message: 'Links are not allowed',
        }),
      );
      return;
    }

    if (this.ratelimit) {
      const key = connection.wallet ?? `conn:${sender.id}`;
      try {
        const result = await this.ratelimit.limit(key);
        if (!result.success) {
          sender.send(
            JSON.stringify({
              type: 'error:rateLimit',
              message: 'Rate limit exceeded',
              retryAt: result.reset,
              limit: result.limit,
              remaining: result.remaining,
            }),
          );
          return;
        }
      } catch (err) {
        console.error('Rate limit error:', err);
      }
    }

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      clientId: parsed.clientId ?? undefined,
      text,
      wallet: connection.wallet,
      username: parsed.username ?? null,
      profilePictureUrl: parsed.profilePictureUrl ?? null,
      ts: Date.now(),
    };

    try {
      await insertMessage(this.envSource, chatMessage);
      const envelope = JSON.stringify({ type: 'chat:new', message: chatMessage });
      this.room.broadcast(envelope);
    } catch (err) {
      console.error('Message storage error:', err);
    }
  }
}
