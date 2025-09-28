'use client';

import React from 'react';
import { cn } from '~/lib/utils';
import { ChatSendButton } from './ChatSendButton';

export type ChatInputFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onSend?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isRateLimited?: boolean;
  isSending?: boolean;
  canSend?: boolean;
  className?: string;
};

export function ChatInputField({
  value,
  onChange,
  onKeyDown,
  onSend,
  placeholder,
  disabled = false,
  isRateLimited = false,
  isSending = false,
  canSend = false,
  className,
}: ChatInputFieldProps) {
  const isDisabled = disabled || isRateLimited || isSending;
  
  const effectivePlaceholder = isRateLimited 
    ? 'Rate limit reached…' 
    : placeholder || 'Type your message';

  return (
    <div className="relative flex items-center">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={effectivePlaceholder}
        disabled={isDisabled}
        rows={1}
        className={cn(
          'bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/40 h-full w-full flex-1 resize-none rounded-xl border border-transparent px-4 py-3 pr-12 text-sm focus:ring-2 focus:outline-none',
          'scrollbar-thin',
          isDisabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      />
      {onSend && (
        <div className="absolute right-2">
          <ChatSendButton 
            onClick={onSend}
            disabled={!canSend || isDisabled}
          />
        </div>
      )}
    </div>
  );
}