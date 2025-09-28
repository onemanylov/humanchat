'use client';

import type { ChatMessage } from '~/lib/chat/types';
import { cn } from '~/lib/utils';
export type ChatPreviewProps = {
  title?: string;
  lastMessage: ChatMessage | null;
  onClick?: () => void;
};

const DEFAULT_TITLE = 'Global Chat';

export function ChatPreview({ title = DEFAULT_TITLE, lastMessage, onClick }: ChatPreviewProps) {
  const previewText = lastMessage?.text ?? 'Tap to start chatting';
  const displayName = lastMessage?.username || lastMessage?.wallet || 'Someone';
  const Component: 'button' | 'div' = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { onClick } : {})}
      className={cn(
        'flex w-full items-center justify-between rounded-2xl border border-border bg-muted px-4 py-3 text-left text-sm text-foreground transition',
        onClick ? 'cursor-pointer hover:bg-muted/80' : 'cursor-default',
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="truncate text-xs text-muted-foreground">
          {lastMessage ? `${displayName}: ${previewText}` : previewText}
        </span>
      </div>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {lastMessage ? formatTime(lastMessage.ts) : ''}
      </span>
    </Component>
  );
}

function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}
