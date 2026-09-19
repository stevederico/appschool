import { useState } from 'react';
import type { MouseEvent } from 'react';

/** Props for {@link BookmarkButton}. */
interface BookmarkButtonProps {
  /** Whether the section is currently bookmarked. */
  isBookmarked: boolean;
  /** Toggle handler; may be async. */
  onToggle: () => void | Promise<void>;
  /** Icon size in pixels. */
  size?: number;
  /** Additional CSS classes. */
  className?: string;
}

export default function BookmarkButton({
  isBookmarked,
  onToggle,
  size = 16,
  className = ''
}: BookmarkButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-1 transition-all cursor-pointer ${
        isBookmarked
          ? 'text-yellow-400 hover:text-yellow-300'
          : 'text-white hover:text-white/80'
      } ${loading ? 'opacity-20' : ''} ${className}`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this section'}
    >
      {loading ? (
        <svg className="animate-spin" width={size} height={size} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      )}
    </button>
  );
}
