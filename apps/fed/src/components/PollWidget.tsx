// Poll / "enquete" widget for the right-hand components zone (xl+). Shows the current published poll:
// before voting, each option is a button; after voting (or if the browser already voted), it switches
// to results — a gold progress bar + percentage per option, with the viewer's choice marked. Admins get
// edit/delete on the current poll and a "Nova enquete" entry (and a create stub when there's no active
// poll). Renders nothing for a non-admin when there's no active poll. pt-BR copy.
import { Link as RouterLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '../lib/cn';
import { useAuth } from '../auth/authStore';
import { AdminActions } from './AdminActions';
import { useCurrentPoll, usePollVote, useDeletePoll, type Poll } from '../hooks/usePoll';

export function PollWidget() {
  const { poll, isLoading } = useCurrentPoll();
  const { isAdmin } = useAuth();
  // Key by poll_id so switching to a different poll resets the local vote state cleanly.
  if (poll) return <PollCard key={poll.poll_id} poll={poll} isAdmin={isAdmin} />;
  if (isAdmin && !isLoading) return <PollAdminEmpty />; // let an admin create the first poll
  return null; // no active poll (or still loading / errored) → no widget for visitors
}

function WidgetHeader() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-4 w-1.5 rounded-sm bg-primary" />
      <h2 className="font-display font-bold">Enquete</h2>
    </div>
  );
}

function NewPollLink() {
  return (
    <RouterLink
      to="/compose-poll"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
    >
      <Plus size={15} /> Nova enquete
    </RouterLink>
  );
}

function PollAdminEmpty() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <WidgetHeader />
      <p className="mb-3 text-sm text-muted-foreground">Nenhuma enquete ativa.</p>
      <NewPollLink />
    </div>
  );
}

function PollCard({ poll, isAdmin }: { poll: Poll; isAdmin: boolean }) {
  const { mine, voted, vote, counts, total, pending } = usePollVote(poll);
  const del = useDeletePoll();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <WidgetHeader />
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

      {isAdmin && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <AdminActions editTo={`/compose-poll/${poll.poll_id}`} onDelete={() => del.mutate(poll.poll_id)} isDeleting={del.isPending} />
          <NewPollLink />
        </div>
      )}
    </div>
  );
}
