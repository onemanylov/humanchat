'use client';

export type ChatLoadMoreButtonProps = {
  onLoadMore: () => Promise<void>;
  isLoading: boolean;
  hasMore: boolean;
  className?: string;
};

export function ChatLoadMoreButton({ 
  onLoadMore, 
  isLoading, 
  hasMore, 
  className 
}: ChatLoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <button
      onClick={() => {
        void onLoadMore();
      }}
      disabled={isLoading}
      className={`border-border mx-auto rounded-full border px-6 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    >
      {isLoading ? 'Loading…' : 'Load more messages'}
    </button>
  );
}