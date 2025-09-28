'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useChat } from '~/providers/ChatProvider';
import { ChatInputContainer } from './ChatInputContainer';
import { ChatInputField } from './ChatInputField';
import { ChatInputSignInPrompt } from './ChatInputSignInPrompt';
import { ChatModerationWarningPill } from '../ui/ChatModerationWarningPill';
import { ChatBanBanner } from '../ui/ChatBanBanner';
import { CHAT_MESSAGE_MAX_LENGTH } from '~/lib/constants/chat';

export type ChatInputProps = {
  className?: string;
  onValidationChange?: (validation: { showLengthError: boolean; errorMessage: string | null }) => void;
};

export function ChatInput({ className, onValidationChange }: ChatInputProps) {
  const { 
    currentUser, 
    sendMessage, 
    isSending, 
    rateLimit, 
    moderationWarning, 
    banStatus 
  } = useChat();
  const [inputValue, setInputValue] = useState('');

  const validation = useMemo(() => {
    const trimmedValue = inputValue.trim();
    const isRateLimited = !!rateLimit;
    const isBanned = !!banStatus?.isBanned;
    const isTooLong = trimmedValue.length > CHAT_MESSAGE_MAX_LENGTH;
    const isEmpty = trimmedValue.length === 0;
    
    return {
      canSend: !isEmpty && !isTooLong && !isRateLimited && !isSending && !isBanned,
      showLengthError: isTooLong,
      errorMessage: isTooLong ? 'Message is too long' : null,
    };
  }, [inputValue, rateLimit, isSending, banStatus]);

  // Notify parent of validation state changes
  useEffect(() => {
    onValidationChange?.({
      showLengthError: validation.showLengthError,
      errorMessage: validation.errorMessage,
    });
  }, [validation.showLengthError, validation.errorMessage, onValidationChange]);

  const handleSend = async () => {
    if (!validation.canSend) return;
    
    const success = await sendMessage(inputValue.trim());
    if (success) {
      setInputValue('');
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  if (!currentUser) {
    return <ChatInputSignInPrompt className={className} />;
  }

  // Show ban banner if user is banned
  if (banStatus?.isBanned) {
    return (
      <ChatInputContainer className={className}>
        <ChatBanBanner
          reason={banStatus.reason || 'policy violation'}
          isTemporary={banStatus.isTemporary}
          expiresAt={banStatus.expiresAt}
        />
      </ChatInputContainer>
    );
  }

  return (
    <ChatInputContainer className={className}>
      {/* Show moderation warning pill if there's a warning */}
      {moderationWarning && (
        <div className="mb-2">
          <ChatModerationWarningPill reason={moderationWarning.reason} />
        </div>
      )}
      
      <ChatInputField
        value={inputValue}
        onChange={setInputValue}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        disabled={isSending}
        isRateLimited={!!rateLimit}
        isSending={isSending}
        canSend={validation.canSend}
      />
    </ChatInputContainer>
  );
}