'use client';

import type { ChatMessage } from '~/lib/chat/types';
import { formatDisplayName } from '~/lib/utils/user-formatting';

export type ChatMessageAuthorProps = {
  message: ChatMessage;
  className?: string;
};

// Re-export for backward compatibility
export { formatDisplayName };

export function ChatMessageAuthor({ message, className }: ChatMessageAuthorProps) {
  const displayName = formatDisplayName(message);

  return (
    <div className={`text-[11px] font-medium opacity-70 ${className || ''}`}>
      {displayName}
    </div>
  );
}