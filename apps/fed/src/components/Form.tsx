// Shared form primitives (/frontend/forms, /frontend/design-system) — labelled field with optional
// description + error, plus styled native input/textarea/toggle and button variants. Used by the
// admin compose pages. Native controls (Tailwind preflight is on now), so tests target them by role.
import { type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Field({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {description && <span className="ml-2 text-sm text-muted-foreground">{description}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-sm text-red-500">{error}</span>}
    </label>
  );
}

const control =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, 'resize-y leading-relaxed', props.className)} />;
}

export function ToggleSwitch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[15px]">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform', checked ? 'left-0.5 translate-x-5' : 'left-0.5')} />
      </button>
      <span>{children}</span>
    </label>
  );
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60';

export function PrimaryButton({ children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={cn(btn, 'bg-primary text-primary-foreground hover:opacity-90', className)}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={cn(btn, 'text-muted-foreground hover:bg-muted hover:text-foreground', className)}>
      {children}
    </button>
  );
}
