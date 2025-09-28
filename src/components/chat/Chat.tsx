'use client';

import React from 'react';
import { useChat } from '~/providers/ChatProvider';
import { ChatMessages } from './messages/ChatMessages';
import { ChatInput } from './input/ChatInput';
import { ChatRateLimitBanner } from './ui/ChatRateLimitBanner';
import { ChatPillContainer } from './ui/ChatPillContainer';
import { ChatValidationPill } from './ui/ChatValidationPill';
import TopBar from './ui/TopBar';

export default function Chat() {
  const { rateLimit, remainingSeconds, onlineUsers } = useChat();
  const [inputValidation, setInputValidation] = React.useState<{
    showLengthError: boolean;
    errorMessage: string | null;
  }>({ showLengthError: false, errorMessage: null });

  return (
    <div className="relative flex h-screen w-screen flex-col bg-background text-foreground">
      {/* Fixed overlaying top bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar onlineUsers={onlineUsers} />
      </div>
      
      {/* Messages take full height */}
      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        <ChatMessages />
      </div>

      {/* Fixed floating input at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
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
  );
}