'use client';

import Image from 'next/image';
import type { ChatMessage } from '~/lib/chat/types';
import { cn } from '~/lib/utils';
import { formatMessageTime } from '~/lib/utils/date-formatting';
import { formatDisplayName } from '~/lib/utils/user-formatting';
import MeshAvatar from './MeshAvatar';

export type ChatMessageRowProps = {
  message: ChatMessage;
  isOwn: boolean;
  previousMessage?: ChatMessage | null;
};

function renderAvatar(message: ChatMessage, isOwn: boolean) {
  const seed = message.wallet || 'anonymous';

  if (message.profilePictureUrl) {
    return (
      <Image
        src={message.profilePictureUrl}
        alt={formatDisplayName(message)}
        width={36}
        height={36}
        className={cn(
          'h-9 w-9 shrink-0 rounded-full object-cover',
          isOwn && 'order-2',
        )}
        unoptimized
      />
    );
  }

  return (
    <MeshAvatar
      seed={seed}
      size={36}
      className={cn('h-9 w-9', isOwn && 'order-2')}
    />
  );
}

export function ChatMessageRow({
  message,
  isOwn,
  previousMessage,
}: ChatMessageRowProps) {
  const timestamp = formatMessageTime(message.ts);
  const isNewBlock =
    !previousMessage || previousMessage.wallet !== message.wallet;

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isOwn ? 'justify-end' : 'justify-start',
      )}
    >
      {!isOwn && renderAvatar(message, isOwn)}
      <div
        className={cn(
          'max-w-[80%] rounded-[18px] px-3 py-2 text-sm',
          isOwn
            ? 'bg-gradient-to-b from-[#239cf9] to-[#1c93f5] text-white'
            : 'bg-black/7.5 text-black backdrop-blur-sm',
          !isNewBlock && !isOwn && 'rounded-tl-md',
          !isNewBlock && isOwn && 'rounded-tr-md',
        )}
      >
        {!isOwn && (
          <div className="text-[11px] font-medium opacity-50">
            {formatDisplayName(message)}
          </div>
        )}
        <div className="break-words">{message.text}</div>
        <div
          className={cn(
            'mt-1 text-right text-[10px] uppercase',
            isOwn ? 'text-white/70' : 'text-black/50',
          )}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
}
