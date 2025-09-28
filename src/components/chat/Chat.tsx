'use client';

import React from 'react';
import { useChat } from '~/providers/ChatProvider';
import { ChatMessages } from './messages/ChatMessages';
import { ChatInput } from './input/ChatInput';
import { ChatRateLimitBanner } from './ui/ChatRateLimitBanner';
import { ChatPillContainer } from './ui/ChatPillContainer';
import { ChatValidationPill } from './ui/ChatValidationPill';

export default function Chat() {
  const { rateLimit, remainingSeconds } = useChat();
  const [inputValidation, setInputValidation] = React.useState<{
    showLengthError: boolean;
    errorMessage: string | null;
  }>({ showLengthError: false, errorMessage: null });

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <ChatMessages />
          <ChatInput onValidationChange={setInputValidation} />
        </div>

        <ChatPillContainer>
          {inputValidation.showLengthError && inputValidation.errorMessage && (
            <ChatValidationPill message={inputValidation.errorMessage} />
          )}
          <ChatRateLimitBanner 
            rateLimit={rateLimit}
            remainingSeconds={remainingSeconds}
          />
        </ChatPillContainer>
      </div>
    </div>
  );
}