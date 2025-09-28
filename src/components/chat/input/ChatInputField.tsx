'use client';

import React, { useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = disabled || isRateLimited || isSending;

  const effectivePlaceholder = isRateLimited
    ? 'Rate limit reached…'
    : placeholder || 'Type your message';

  // Auto-resize textarea based on content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';

    // Calculate max height (30vh)
    const maxHeight = window.innerHeight * 0.3;
    const minHeight = 44; // Match minHeight from style

    // Set new height based on content, constrained by min/max
    const contentHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));

    textarea.style.height = `${newHeight}px`;

    // Show scrollbar if content exceeds max height
    textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  };

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex items-end">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={effectivePlaceholder}
        disabled={isDisabled}
        rows={1}
        style={{
          minHeight: '44px', // Ensure minimum height for consistency
          lineHeight: '1.5',
        }}
        className={cn(
          'bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/40 w-full flex-1 resize-none rounded-xl border border-transparent px-4 py-3 pr-12 text-sm focus:ring-2 focus:outline-none',
          'scrollbar-thin',
          isDisabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      />
      {onSend && (
        <div className="absolute right-2 bottom-1.5">
          <ChatSendButton 
            onClick={onSend} 
            disabled={!canSend || isDisabled}
            hasContent={value.trim().length > 0}
          />
        </div>
      )}
    </div>
  );
}
