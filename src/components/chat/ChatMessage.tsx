'use client';

import Image from 'next/image';
import type { ChatMessage } from '~/lib/chat/types';
import { cn } from '~/lib/utils';

export type ChatMessageRowProps = {
  message: ChatMessage;
  isOwn: boolean;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

function formatTimestamp(ts: number) {
  try {
    return timeFormatter.format(new Date(ts));
  } catch {
    return '';
  }
}

function formatDisplayName(message: ChatMessage) {
  if (message.username && message.username.trim().length > 0) {
    return message.username.trim();
  }
  if (message.wallet) {
    const wallet = message.wallet;
    return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  }
  return 'Anonymous';
}

function renderAvatar(message: ChatMessage, isOwn: boolean) {
  const fallback = formatDisplayName(message).slice(0, 1).toUpperCase();
  const className = cn(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/80 shadow-inner',
    isOwn && 'order-2 bg-violet-500/30 text-white',
  );

  if (message.profilePictureUrl) {
    return (
      <Image
        src={message.profilePictureUrl}
        alt={formatDisplayName(message)}
        width={36}
        height={36}
        className={cn('h-9 w-9 shrink-0 rounded-full object-cover', isOwn && 'order-2')}
        unoptimized
      />
    );
  }

  return <div className={className}>{fallback || '?'}</div>;
}

export function ChatMessageRow({ message, isOwn }: ChatMessageRowProps) {
  const timestamp = message.pending ? 'Sending…' : formatTimestamp(message.ts);

  return (
    <div
      className={cn(
        'flex w-full items-end gap-3',
        isOwn ? 'justify-end text-right' : 'justify-start text-left',
      )}
    >
      {!isOwn && renderAvatar(message, isOwn)}
      <div className="max-w-[70%] space-y-1">
        <div className={cn('flex items-center gap-3 text-[11px] uppercase tracking-wide text-white/50', isOwn && 'flex-row-reverse')}>
          <span>{formatDisplayName(message)}</span>
          <span className={cn(message.pending && 'text-white/40')}>{timestamp}</span>
        </div>
        <div
          className={cn(
            'rounded-2xl bg-white/10 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition-opacity',
            isOwn && 'bg-violet-500/40 text-white',
            message.pending && 'opacity-70',
          )}
        >
          {message.text}
        </div>
      </div>
      {isOwn && renderAvatar(message, isOwn)}
    </div>
  );
}
