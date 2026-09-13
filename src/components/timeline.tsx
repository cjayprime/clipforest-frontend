import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { scoreTier, timecode } from '@/lib/format';
import type { Candidate } from '@/lib/types';

/** Full-source timeline with a marker per candidate range and the player's playhead. */
export function Timeline({
  durationMs,
  candidates,
  activeId,
  currentMs,
  onSelect,
  onSeek,
}: {
  durationMs: number;
  candidates: Candidate[];
  activeId: string | null;
  currentMs: number;
  onSelect: (c: Candidate) => void;
  onSeek: (ms: number) => void;
}) {
  const pct = (ms: number) => `${Math.max(0, Math.min(100, (ms / Math.max(1, durationMs)) * 100))}%`;
  // Keyed by position, not value: before the duration loads every tick is 0, and
  // duplicate keys made React keep stale ruler labels.
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((durationMs * i) / 5));
  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.round(((e.clientX - rect.left) / rect.width) * durationMs));
  };

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-low p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">Moments timeline</h3>
        <div className="flex items-center gap-3 font-mono text-[11px] text-outline">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tertiary" aria-hidden /> 85+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" aria-hidden /> 70–84
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-outline" aria-hidden /> below 70
          </span>
        </div>
      </div>
      <div className="relative select-none rounded-lg border border-outline-variant/30 bg-surface-lowest px-3 pb-2 pt-6">
        <div className="absolute inset-x-3 top-1 flex justify-between font-mono text-[11px] text-outline" aria-hidden>
          {ticks.map((t, i) => (
            <span key={i}>{timecode(t)}</span>
          ))}
        </div>
        <div className="relative mt-1 h-14 cursor-pointer" onClick={seek} role="presentation">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-outline-variant/50" aria-hidden />
          {candidates.map((c) => {
            const tier = scoreTier(c.score);
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(c);
                }}
                aria-label={`${c.title}, score ${c.score}, ${timecode(c.startMs)} to ${timecode(c.endMs)}`}
                aria-pressed={active}
                title={`${c.title} · ${c.score}/100 · ${timecode(c.startMs)}–${timecode(c.endMs)}`}
                className={clsx(
                  'moment-marker absolute top-0 flex h-full min-w-2 items-center justify-center rounded border font-mono text-[11px] font-bold transition-all',
                  tier.tone === 'tertiary' ? 'border-tertiary/70 bg-tertiary/20 text-tertiary' : tier.tone === 'primary' ? 'border-primary/60 bg-primary/20 text-primary' : 'border-outline/50 bg-outline/15 text-outline',
                  active && 'z-10 border-2 shadow-[0_0_15px_rgba(78,222,163,0.35)]',
                )}
                style={{ left: pct(c.startMs), width: `max(0.5rem, ${(c.durationMs / Math.max(1, durationMs)) * 100}%)` }}
              >
                <span className="moment-score">{c.score}</span>
              </button>
            );
          })}
          <div className="pointer-events-none absolute top-0 z-20 flex h-full flex-col items-center" style={{ left: pct(currentMs) }} aria-hidden>
            <div className="-mb-1 size-2.5 rotate-45 bg-primary-strong" />
            <div className="h-full w-0.5 bg-fg shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
