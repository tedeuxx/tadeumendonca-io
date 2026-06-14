// Avatar (/frontend/components) — renders a user's avatar image, or a letter fallback on the gold
// chip when there's no avatar yet. `src` may be a stored avatar URL (avatarUrl) or a local preview
// (object URL) during upload. Size is driven by the caller via className (h-*/w-*), BVB theme.
import { cn } from '../lib/cn';

export function Avatar({ src, fallback, className }: { src?: string; fallback: string; className?: string }) {
  if (src) {
    return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground', className)}
    >
      {fallback}
    </span>
  );
}
