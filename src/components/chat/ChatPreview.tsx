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
        'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white/80 transition',
        onClick ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default',
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-white">{title}</span>
        <span className="truncate text-xs text-white/60">
          {lastMessage ? `${displayName}: ${previewText}` : previewText}
        </span>
      </div>
      <span className="text-[11px] uppercase tracking-wide text-white/40">
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
