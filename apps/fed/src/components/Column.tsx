// Shared column primitives (/frontend/design-system) — X-style sticky column header + the explicit
// loading / error / empty states reused across the feed, articles, post, and article pages.
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function ColumnHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-1 p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-bold leading-tight">{title}</h1>
        {description && <div className="truncate text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions}
    </div>
  );
}

export function CenterLoader() {
  return (
    <div role="status" aria-label="Loading" className="flex justify-center py-16 text-muted-foreground">
      <Loader2 className="animate-spin" size={28} />
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="m-4 border border-border p-4 text-sm text-foreground">{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-16 text-center text-muted-foreground">{children}</div>;
}
