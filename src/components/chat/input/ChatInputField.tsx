'use client';

import React from 'react';
import { cn } from '~/lib/utils';

export type ChatInputFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  disabled?: boolean;
  isRateLimited?: boolean;
  isSending?: boolean;
  className?: string;
};

export function ChatInputField({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled = false,
  isRateLimited = false,
  isSending = false,
  className,
}: ChatInputFieldProps) {
  const isDisabled = disabled || isRateLimited || isSending;
  
  const effectivePlaceholder = isRateLimited 
    ? 'Rate limit reached…' 
    : placeholder || 'Type your message';

  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder={effectivePlaceholder}
      disabled={isDisabled}
      rows={1}
      className={cn(
        'bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/40 h-full w-full flex-1 resize-none rounded-xl border border-transparent px-4 py-3 text-sm focus:ring-2 focus:outline-none',
        'scrollbar-thin',
        isDisabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    />
  );
}