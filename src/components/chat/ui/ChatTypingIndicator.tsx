'use client';

export type ChatTypingIndicatorProps = {
  isVisible: boolean;
  usernames?: string[];
  className?: string;
};

export function ChatTypingIndicator({ 
  isVisible, 
  usernames = [], 
  className 
}: ChatTypingIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  const getTypingText = () => {
    if (usernames.length === 0) {
      return 'Someone is typing...';
    }
    
    if (usernames.length === 1) {
      return `${usernames[0]} is typing...`;
    }
    
    if (usernames.length === 2) {
      return `${usernames[0]} and ${usernames[1]} are typing...`;
    }
    
    return `${usernames[0]} and ${usernames.length - 1} others are typing...`;
  };

  return (
    <div className={`px-4 py-2 text-xs text-white/60 italic ${className || ''}`}>
      {getTypingText()}
      <span className="ml-1 animate-pulse">⋯</span>
    </div>
  );
}