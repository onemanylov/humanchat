### Chat Feature – End-to-End Technical Documentation

## Overview
- Real-time chat using PartyKit WebSockets with Upstash Redis for persistence.
- Client uses TanStack Query and custom hooks for message history, pagination, preview, validation states, and scroll behavior.

## Architecture
- PartyKit Worker: `party/server.ts`
- Storage and Redis helpers: `party/storage.ts`, `party/utils/redis.ts`, `party/utils/rateLimit.ts`
- Auth for PartyKit: `party/auth.ts`
- Client chat library: `src/lib/chat/*`
- UI components: `src/components/chat/*`
- Server chat API: `src/server/chat.ts`
- Host config: `src/lib/party/host.ts`
- Constants: `src/lib/constants/chat.ts`

## Data Model
- Message type definition shared by worker and client: `src/lib/chat/types.ts`
```ts
export type ChatMessage = {
  id: string;
  text: string;
  wallet: string | null;
  username: string | null;
  profilePictureUrl: string | null;
  ts: number;
};
```

- Redis keys (by network): `party/utils/redis.ts`
```ts
export function getChatKeys(source: EnvLike): {
  CHAT_LIST_KEY: string;
  CHAT_LAST_KEY: string;
} {
  const network = getNetwork(source);
  return {
    CHAT_LIST_KEY: `${network}:chat:messages`,
    CHAT_LAST_KEY: `${network}:chat:last`,
  };
}
```

## Backend: PartyKit Worker
- Auth and connection setup plus rate limit init.
```ts
static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
  try {
    const token = tokenFromRequest(request);
    if (!token) {
      return new Response("Unauthorized: missing token", { status: 401 });
    }

    const secret = lobby.env.JWT_SECRET as string | undefined;
    if (!secret) {
      return new Response("Server configuration error", { status: 401 });
    }

    const { payload } = await verifyJwtToken(token, secret);
    if (!payload.wallet) {
      return new Response("Unauthorized: invalid payload", { status: 401 });
    }

    request.headers.set("X-Wallet", payload.wallet);
    return request;
  } catch (err) {
    console.error("[onBeforeConnect] verify error", err);
    return new Response("Unauthorized: verify error", { status: 401 });
  }
}
```
```ts
onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
  const wallet = ctx.request.headers.get("X-Wallet");

  this.connections.set(conn.id, {
    wallet: wallet || null,
  });

  if (!this.ratelimit) {
    this.ratelimit = initializeRateLimit(
      this.room.env as Record<string, string | undefined>,
    );
  }
}
```
- Message handling: user messages with validation, rate limiting, persistence, and broadcast.
```ts
onMessage(message: string, sender: Party.Connection) {
  if (this.room.id !== GLOBAL_CHAT_ROOM_ID) {
    this.room.broadcast(`${sender.id}: ${message}`, [sender.id]);
    return;
  }

  try {
    const parsed = JSON.parse(message);
    const connection = this.connections.get(sender.id);
    if (!connection) return;

    if (
      parsed?.type === "chat:message" &&
      typeof parsed.text === "string" &&
      parsed.text.trim()
    ) {
      this.handleChatMessage(parsed, sender, connection);
    }
  } catch (_) {
    // Invalid JSON, ignore
  }
}
```
```ts
private async handleChatMessage(
  parsed: any,
  sender: Party.Connection,
  connection: ConnectionState,
) {
  const text = String(parsed.text).trim().slice(0, 500);

  if (containsProhibitedLink(text)) {
    sender.send(
      JSON.stringify({
        type: "error:validation",
        reason: "links",
        message: "Links are not allowed",
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
            type: "error:rateLimit",
            message: "Rate limit exceeded",
            retryAt: result.reset,
            limit: result.limit,
            remaining: result.remaining,
          }),
        );
        return;
      }
    } catch (e) {
      console.error("Rate limit error:", e);
    }
  }

  const chatMessage: ChatMessage = {
    id: crypto.randomUUID(),
    text,
    wallet: parsed.wallet ?? null,
    username: parsed.username ?? null,
    profilePictureUrl: parsed.profilePictureUrl ?? null,
    ts: Date.now(),
  };

  try {
    await insertMessage(this.room, chatMessage);
    this.room.broadcast(
      JSON.stringify({ type: "chat:new", message: chatMessage }),
    );
  } catch (err) {
    console.error("Message storage error:", err);
  }
}
```

### Validation and Rate Limit
- Shared validation rules: `src/lib/chat/validation.ts`
```1:15:src/lib/chat/validation.ts
// Shared link validation used by client and server to stay in sync
export const linkRegex =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|app|gg|xyz|ai|co|dev|fm|tv)\b)/i;

// Wallet address patterns
export const walletAddressRegex =
  /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/;

export function containsProhibitedLink(text: string): boolean {
  return linkRegex.test(text);
}

export function containsProhibitedContent(text: string): boolean {
  return linkRegex.test(text) || walletAddressRegex.test(text);
}
```
- Rate limiter using Upstash Redis TTL window: `party/utils/rateLimit.ts`
```15:36:party/utils/rateLimit.ts
export function initializeRateLimit(
  env: Record<string, string | undefined>,
): CustomRateLimit | null {
  const max = Number(env.CHAT_RATE_LIMIT_MAX ?? 5);
  const windowSeconds = Number(env.CHAT_RATE_LIMIT_WINDOW_SECONDS ?? 60);
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (
    !url ||
    !token ||
    !Number.isFinite(max) ||
    !Number.isFinite(windowSeconds)
  ) {
    console.warn(
      "[chat] Rate limiting disabled (missing Upstash configuration)",
    );
    return null;
  }

  return new CustomRateLimiter({ env }, max, windowSeconds);
}
```

## Storage
- Message persistence helpers: `party/storage.ts`
```ts
export async function insertMessage(
  room: Party.Room,
  message: ChatMessage,
): Promise<void> {
  const { CHAT_LIST_KEY, CHAT_LAST_KEY } = getChatKeys(room);

  await redisRPUSH(room, CHAT_LIST_KEY, JSON.stringify(message));
  await redisSET(room, CHAT_LAST_KEY, JSON.stringify(message));
}
```
- Retrieval helpers in the same file page through the Redis list to serve chat history and preview data.

## Server API (TanStack React Start)
- Message history endpoints: `src/server/chat.ts`
```24:59:src/server/chat.ts
export const getInitialMessages = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      limit: z.number().optional().default(100),
    }),
  )
  .handler(async ({ data }) => {
    try {
      // Get a few extra messages to properly determine if there are more
      const extraLimit = data.limit + 10;
      const messages = await getRecentMessages(mockRoom, extraLimit);

      // If we got more than requested, there are definitely more messages
      const hasMore = messages.length > data.limit;

      // Return only the requested number of messages
      const returnedMessages = messages.slice(-data.limit);
      const oldestTimestamp =
        returnedMessages.length > 0 ? returnedMessages[0]!.ts : undefined;

      return {
        messages: returnedMessages,
        hasMore,
        oldestTimestamp,
      };
    } catch (error) {
      console.error("[getInitialMessages] Error:", error);
      return {
        messages: [],
        hasMore: false,
        oldestTimestamp: undefined,
      };
    }
  });
```
```61:92:src/server/chat.ts
export const loadMoreMessages = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      beforeTimestamp: z.number(),
      limit: z.number().optional().default(100),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const result = await getMessagesBefore(
        mockRoom,
        data.beforeTimestamp,
        data.limit,
      );

      return {
        messages: result.messages,
        hasMore: result.hasMore,
        oldestTimestamp:
          result.messages.length > 0 ? result.messages[0]!.ts : undefined,
      };
    } catch (error) {
      console.error("[loadMoreMessages] Error:", error);
      return {
        messages: [],
        hasMore: false,
        oldestTimestamp: undefined,
      };
    }
  });
```

## Client: Connection and History
- WebSocket connection and message handling: `src/lib/chat/connection.ts`
```11:65:src/lib/chat/connection.ts
export function useChatConnection(options: ConnectionOptions = {}) {
  const token = useAuthToken();
  const {
    messages,
    isLoadingMore,
    hasMoreMessages,
    loadOlderMessages,
    addMessage,
  } = useChatMessages();

  const socket = usePartySocket({
    host: resolvePartyHost(),
    room: GLOBAL_CHAT_ROOM_ID,
    query: () => (token ? { token } : {}),
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch {
        // ignore malformed messages
      }
    },
  });

  const handleMessage = (data: any) => {
    switch (data.type) {
      case "chat:new":
        if (data.message) {
          addMessage(data.message);
        }
        break;
      case "error:rateLimit":
        options.onRateLimit?.(data);
        break;
      case "error:validation":
        console.warn("Message validation error:", data.message);
        break;
    }
  };

  return {
    socket,
    messages,
    isLoadingMore,
    hasMoreMessages,
    loadOlderMessages,
    addMessage,
  };
}
```

- History and pagination with TanStack Query: `src/lib/chat/hooks.ts`
```14:88:src/lib/chat/hooks.ts
export function useChatMessages(): UseChatMessagesReturn {
  const queryClient = useQueryClient();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading: isInitialLoad } = useQuery({
    queryKey: CHAT_QUERY_KEYS.messages(
      CHAT_QUERY_CONFIG.INITIAL_MESSAGES_LIMIT,
    ),
    queryFn: () =>
      getInitialMessages({
        data: { limit: CHAT_QUERY_CONFIG.INITIAL_MESSAGES_LIMIT },
      }),
    staleTime: CHAT_QUERY_CONFIG.MESSAGES_STALE_TIME,
    gcTime: CHAT_QUERY_CONFIG.MESSAGES_GC_TIME,
  });

  const messages = data?.messages ?? [];
  const hasMoreMessages = Boolean(data?.hasMore);
  const oldestTimestamp = data?.oldestTimestamp;

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !oldestTimestamp) return;

    setIsLoadingMore(true);
    try {
      const result = await loadMoreMessages({
        data: {
          beforeTimestamp: oldestTimestamp,
          limit: CHAT_QUERY_CONFIG.PAGINATION_LIMIT,
        },
      });

      queryClient.setQueryData(
        CHAT_QUERY_KEYS.messages(CHAT_QUERY_CONFIG.INITIAL_MESSAGES_LIMIT),
        (prev: ChatMessagesData | undefined) => {
          const prevMessages = prev?.messages ?? [];
          const existing = new Set(prevMessages.map((m) => m.id));
          const unique = result.messages.filter((m) => !existing.has(m.id));
          return {
            messages: [...unique, ...prevMessages],
            hasMore: result.hasMore,
            oldestTimestamp: result.oldestTimestamp,
          };
        },
      );
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, oldestTimestamp, queryClient]);

  const addMessage = (message: ChatMessage) => {
    queryClient.setQueryData(
      CHAT_QUERY_KEYS.messages(CHAT_QUERY_CONFIG.INITIAL_MESSAGES_LIMIT),
      (prev: ChatMessagesData | undefined) => {
        const prevMessages = prev?.messages ?? [];
        return {
          messages: [...prevMessages, message],
          hasMore: prev?.hasMore ?? false,
          oldestTimestamp: prev?.oldestTimestamp,
        };
      },
    );
  };

  return {
    messages,
    isLoadingMore,
    hasMoreMessages,
    isInitialLoad,
    loadOlderMessages,
    addMessage,
  };
}
```

## Client: UI Components
- Container and send flow: `src/components/chat/Chat.tsx`
```15:36:src/components/chat/Chat.tsx
const {
  socket,
  messages,
  isLoadingMore,
  hasMoreMessages,
  loadOlderMessages,
} = useChatConnection({
  onRateLimit: (data) => setRateLimit({ until: data.retryAt }),
});

const sendMessage = (text: string) => {
  if (!socket) return;

  socket.send(
    JSON.stringify({
      type: "chat:message",
      text,
      wallet: user.wallet,
      username: user.username,
      profilePictureUrl: user.profilePictureUrl,
    }),
  );
...
```
- Messages list and scroll behavior/date pill: `src/components/chat/ChatMessages.tsx`
```21:41:src/components/chat/ChatMessages.tsx
export function ChatMessages({
  messages,
  isLoadingMore,
  hasMoreMessages,
  onScroll,
  onLoadMore,
  onScrollToBottom,
}: ChatMessagesProps) {
  const { t } = useLingui();
  const {
    listRef,
    handleScroll,
    pillVisible,
    scrollPillLabel,
    isAtBottom,
    scrollToBottom,
    scrollDistance,
  } = useChatScroll({
    messages,
    onScroll,
  });
```
- Individual message layout: `src/components/chat/ChatMessage.tsx` handles avatars, grouped timestamps, and bubble styling for standard chat messages.
- Input with validation and rate-limit countdown: `src/components/chat/ChatInput.tsx`
```tsx
<input
  ref={inputRef}
  onKeyDown={(e) => e.key === "Enter" && handleSend()}
  onChange={(e) => handleInputChange(e.target.value)}
  placeholder="Type a message"
  disabled={!!isRateLimited}
  className={cn(
    "flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[14px] text-white/90 outline-none placeholder:text-white/40 disabled:opacity-60",
    isRateLimited && "cursor-not-allowed opacity-60",
    contentBlocked && "ring-2 ring-rose-500/70",
  )}
/>
```
- Preview bubble with real-time updates: `src/components/chat/ChatPreview.tsx`
```tsx
<Avatar className="h-8 w-8">
  <AvatarImage src={avatarUrl} alt={displayName} />
  <AvatarFallback>
    {displayName.slice(0, 1).toUpperCase()}
  </AvatarFallback>
</Avatar>
<div className="flex min-w-0 flex-col">
  <span className="text-[13px] font-medium text-white/90">
    {displayName}
  </span>
  <span className="max-w-[70vw] truncate text-[12px] text-white/60">
    {lastMessage?.text ?? <Trans>Tap to start chatting</Trans>}
  </span>
</div>
```

## Environment/Config
- `GLOBAL_CHAT_ROOM_ID`: `src/lib/constants/chat.ts`
- Party host resolution: `src/lib/party/host.ts`
- Required env for PartyKit and app:
  - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - JWT_SECRET (PartyKit)
  - VITE_PARTYKIT_HOST or PARTYKIT_HOST
  - VITE_NETWORK
  - CHAT_RATE_LIMIT_MAX, CHAT_RATE_LIMIT_WINDOW_SECONDS

## i18n
- UI strings use Lingui `<Trans>` and `msg` consistently, per project rules.

## Examples

- Sending a message from client:
```25:36:src/components/chat/Chat.tsx
const sendMessage = (text: string) => {
  if (!socket) return;

  socket.send(
    JSON.stringify({
      type: "chat:message",
      text,
      wallet: user.wallet,
      username: user.username,
      profilePictureUrl: user.profilePictureUrl,
    }),
  );
```

- Handling live messages on client:
```35:55:src/lib/chat/connection.ts
const handleMessage = (data: any) => {
  switch (data.type) {
    case "chat:new":
      if (data.message) {
        addMessage(data.message);
      }
      break;
    case "error:rateLimit":
      options.onRateLimit?.(data);
      break;
    case "error:validation":
      console.warn("Message validation error:", data.message);
      break;
  }
};
```

- Redis persistence and last-message caching:
```16:27:party/storage.ts
export async function insertMessage(
  room: Party.Room,
  message: ChatMessage,
): Promise<void> {
  const { CHAT_LIST_KEY, CHAT_LAST_KEY } = getChatKeys(room);

  // Store message in list (no size limit - keep full history)
  await redisRPUSH(room, CHAT_LIST_KEY, JSON.stringify(message));

  // Cache last message for chat preview
  await redisSET(room, CHAT_LAST_KEY, JSON.stringify(message));
}
```

- Rate limit result to client:
```198:213:party/server.ts
if (this.ratelimit) {
  const key = connection.wallet ?? `conn:${sender.id}`;
  try {
    const result = await this.ratelimit.limit(key);
    if (!result.success) {
      sender.send(
        JSON.stringify({
          type: "error:rateLimit",
          message: "Rate limit exceeded",
          retryAt: result.reset,
          limit: result.limit,
          remaining: result.remaining,
        }),
      );
      return;
    }
  } catch (e) {
    console.error("Rate limit error:", e);
    // Continue processing on rate limit errors
  }
}
```

## Developer Notes
- Client hooks follow the user’s preference for `useQuery` custom hooks for data fetching.
- Class names use `cn()` utility in `ChatInput`, aligning with preference.
- i18n uses Lingui `<Trans>` and `msg`.
- All JSX files use `.tsx`.

I’ve finished the file inventory and read-through, mapped data flow and dependencies, and produced the documentation with inlined code references.
