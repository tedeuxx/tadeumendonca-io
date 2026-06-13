// Poll / "enquete" widget for the right-hand components zone (xl+). Shows the current published poll:
// before voting, each option is a button; after voting (or if the browser already voted), it switches
// to results — a gold progress bar + percentage per option, with the viewer's choice marked. Renders
// nothing when there's no active poll (so the aside just collapses to the other widgets). pt-BR copy.
import { cn } from '../lib/cn';
import { useCurrentPoll, usePollVote, type Poll } from '../hooks/usePoll';

export function PollWidget() {
  const { poll } = useCurrentPoll();
  if (!poll) return null; // no active poll (or still loading / errored) → no widget
  // Key by poll_id so switching to a different poll resets the local vote state cleanly.
  return <PollCard key={poll.poll_id} poll={poll} />;
}

function PollCard({ poll }: { poll: Poll }) {
  const { mine, voted, vote, counts, total, pending } = usePollVote(poll);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1.5 rounded-sm bg-primary" />
        <h2 className="font-display font-bold">Enquete</h2>
      </div>
      <p className="mb-3 text-sm font-medium">{poll.question}</p>

      <ul className="flex flex-col gap-2">
        {poll.options.map((o) => {
          if (!voted) {
            return (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => vote(o.id)}
                  className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground disabled:opacity-60"
                >
                  {o.label}
                </button>
              </li>
            );
          }
          const count = counts[o.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMine = mine === o.id;
          return (
            <li key={o.id}>
              <div className="relative overflow-hidden rounded-md border border-border px-3 py-2 text-sm">
                <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} aria-hidden />
                <div className="relative flex items-center justify-between gap-2">
                  <span className={cn('font-medium', isMine && 'text-primary')}>
                    {o.label}
                    {isMine && ' ✓'}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{pct}%</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {voted && (
        <p className="mt-3 text-xs text-muted-foreground">
          {total} {total === 1 ? 'voto' : 'votos'}
        </p>
      )}
    </div>
  );
}
