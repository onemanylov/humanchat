'use client';

export type ChatLoadingIndicatorProps = {
  isVisible: boolean;
  message?: string;
  className?: string;
};

export function ChatLoadingIndicator({ 
  isVisible, 
  message = 'Loading messages…', 
  className 
}: ChatLoadingIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`text-muted-foreground flex h-full w-full items-center justify-center text-sm ${className || ''}`}>
      {message}
    </div>
  );
}