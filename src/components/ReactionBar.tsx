// Reaction bar (/frontend/design-system) — the 5 emoji reactions with live counts. Public: anyone can
// react (one per browser, tracked in localStorage by useReactions). The viewer's reaction is highlighted.
import { useReactions, REACTION_EMOJIS } from '../hooks/useReactions';
import { cn } from '../lib/cn';

export function ReactionBar({ postId, initialCounts, size = 'md' }: { postId: string; initialCounts?: Record<string, number>; size?: 'sm' | 'md' }) {
  const { counts, mine, toggle, pending } = useReactions(postId, initialCounts);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = mine === emoji;
        return (
          <button
            key={emoji}
            type="button"
            disabled={pending}
            onClick={() => void toggle(emoji)}
            aria-pressed={active}
            aria-label={`React ${emoji}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border transition-colors disabled:opacity-60',
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
              active ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
