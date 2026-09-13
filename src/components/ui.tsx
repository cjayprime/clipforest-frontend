import clsx from 'clsx';
import { type ButtonHTMLAttributes, forwardRef, type HTMLAttributes, type ReactNode, useState } from 'react';
import { Check, Copy, LoaderCircle as Loader2, RotateCcw, TriangleAlert as AlertTriangle } from 'lucide-react';
import { RENDER_STATUS_LABEL, scoreTier, VIDEO_STATUS_LABEL } from '@/lib/format';
import type { ApiErrorBody, RenderStatus, VideoStatus } from '@/lib/types';

/** The semantic colour a badge carries. Shared by Badge and both status badges. */
export type Tone = 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'danger' | 'warning' | 'muted';

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium',
        tone === 'primary' && 'border-primary/40 bg-primary/10 text-primary',
        tone === 'secondary' && 'border-secondary/40 bg-secondary/10 text-secondary',
        tone === 'tertiary' && 'border-tertiary/40 bg-tertiary/10 text-tertiary',
        tone === 'neutral' && 'border-outline-variant/50 bg-surface-high text-fg-muted',
        tone === 'muted' && 'border-outline-variant/30 bg-surface-low text-outline',
        tone === 'danger' && 'border-danger/40 bg-danger-strong/20 text-danger',
        tone === 'warning' && 'border-warning/40 bg-warning/10 text-warning',
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function RenderStatusBadge({ status, progress }: { status: RenderStatus; progress?: number }) {
  const tone: Tone = status === 'COMPLETED' ? 'tertiary' : status === 'FAILED' ? 'danger' : 'primary';
  const busy = status !== 'COMPLETED' && status !== 'FAILED';
  return (
    <Badge tone={tone}>
      {busy && <Loader2 className="size-3 animate-spin" aria-hidden />}
      {RENDER_STATUS_LABEL[status]}
      {busy && progress !== undefined && progress > 0 ? ` ${progress}%` : ''}
    </Badge>
  );
}

export function ScoreBadge({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const tier = scoreTier(score);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border bg-surface-lowest px-2 py-0.5 font-mono text-xs font-semibold',
        tier.tone === 'tertiary' && 'border-tertiary/70 text-tertiary',
        tier.tone === 'primary' && 'border-primary/60 text-primary',
        tier.tone === 'neutral' && 'border-outline-variant text-fg-muted',
        tier.tone === 'muted' && 'border-outline-variant/60 text-outline',
      )}
      aria-label={`Score ${score} out of 100, ${tier.label}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      <span className="tabular">{score}</span>
      {showLabel && <span className="rounded bg-current/15 px-1 text-[11px] uppercase tracking-wider">{tier.label}</span>}
    </span>
  );
}

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const tone: Tone = status === 'READY' ? 'tertiary' : status === 'FAILED' ? 'danger' : status === 'CREATED' ? 'muted' : 'primary';
  const busy = !['READY', 'FAILED', 'CREATED'].includes(status);
  return (
    <Badge tone={tone}>
      {busy ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : status === 'READY' ? (
        <Check className="size-3" aria-hidden />
      ) : status === 'FAILED' ? (
        <AlertTriangle className="size-3" aria-hidden />
      ) : null}
      {VIDEO_STATUS_LABEL[status]}
    </Badge>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode }
>(function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        size === 'sm' && 'h-9 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-11 px-5 text-sm',
        variant === 'primary' && 'bg-primary text-on-primary shadow-[0_3px_0_#a0bc64] hover:bg-[#dcff9b]',
        variant === 'secondary' && 'border border-outline-variant/60 bg-surface text-fg hover:border-outline hover:bg-surface-high',
        variant === 'ghost' && 'text-fg-muted hover:bg-white/5 hover:text-fg',
        variant === 'danger' && 'text-danger hover:bg-danger-strong/25',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

/** The shared text-input styling, applied by callers as `className={inputClass}`. */
export const inputClass =
  'h-10 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-3 text-sm text-fg placeholder:text-outline/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('rounded-xl border border-outline-variant/30 bg-surface-low', className)} {...rest}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant/50 bg-surface-low/40 px-6 py-12 text-center">
      {icon && <div className="flex size-11 items-center justify-center rounded-full bg-surface-high text-primary">{icon}</div>}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {children && <div className="max-w-md text-sm text-fg-muted">{children}</div>}
      {action}
    </div>
  );
}

/** Failure state (PRD §21.1): human-readable error, reference ID, retry when allowed. */
export function ErrorPanel({
  title = 'Something went wrong',
  error,
  onRetry,
  retrying,
  children,
}: {
  title?: string;
  error: Partial<ApiErrorBody> | null | undefined;
  onRetry?: () => void;
  retrying?: boolean;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const ref = error?.correlationId;
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-strong/10 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-semibold text-fg">{title}</h3>
          <p className="text-sm text-fg-muted">{error?.message ?? 'An unexpected error occurred.'}</p>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-outline">
            {error?.code && <span>Code: {error.code}</span>}
            {ref && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-outline-variant/40 px-1.5 py-0.5 hover:text-fg"
                onClick={() => {
                  void navigator.clipboard?.writeText(ref);
                  setCopied(true);
                }}
                aria-label="Copy reference ID"
              >
                Ref: {ref.slice(0, 13)}… {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            )}
          </div>
          {children}
          {onRetry && (error?.retryable ?? true) && (
            <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} icon={<RotateCcw className="size-3.5" />}>
              Try again
            </Button>
          )}
          {onRetry && error?.retryable === false && <p className="text-xs text-outline">This can’t be retried. Try a different file or source.</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Label + control + optional hint. The hint sits inside the <label>, so it
 * becomes part of the control's accessible name — worth knowing when writing
 * `getByLabel` selectors.
 */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-outline">{label}</span>
      {children}
      {hint && <span className="block text-xs text-outline">{hint}</span>}
    </label>
  );
}

export function ProgressBar({ value, label, className, animated = true }: { value: number; label: string; className?: string; animated?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={clsx('relative h-2 w-full overflow-hidden rounded-full bg-surface-high', className)}
    >
      <div
        className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-primary-strong to-primary transition-[width] duration-500"
        style={{ width: `${v}%` }}
      >
        {animated && v < 100 && <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-outline-variant/40 bg-surface-lowest p-1 font-mono text-[11px]"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx('min-h-8 rounded-md px-3 py-1.5 transition-colors', value === o.value ? 'bg-surface-high text-primary' : 'text-outline hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-outline">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-primary-strong' : 'bg-surface-highest')}
    >
      <span className={clsx('absolute top-0.5 size-4 rounded-full bg-fg transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  );
}
