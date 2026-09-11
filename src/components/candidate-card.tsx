import clsx from 'clsx';
import { CirclePlay, ExternalLink, Sparkles, WandSparkles } from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_LABEL, durationLabel, timecode } from '@/lib/format';
import type { Candidate } from '@/lib/types';
import { Badge, Button, RenderStatusBadge, ScoreBadge } from './ui';

const DIMENSIONS: [keyof Candidate['componentScores'], string][] = [
  ['hook', 'Hook'],
  ['clarity', 'Clarity'],
  ['novelty', 'Novelty'],
  ['emotion', 'Emotion'],
  ['completeness', 'Payoff'],
  ['shareability', 'Share'],
];

export function CandidateCard({
  candidate: c,
  active,
  generating,
  onPreview,
  onGenerate,
}: {
  candidate: Candidate;
  active: boolean;
  generating: boolean;
  onPreview: () => void;
  onGenerate: () => void;
}) {
  return (
    <article
      aria-label={c.title}
      className={clsx(
        'rounded-xl p-4 transition-all',
        active ? 'border-2 border-tertiary/80 bg-surface-high shadow-[0_0_24px_-4px_rgba(78,222,163,0.2)]' : 'border border-outline-variant/40 bg-surface hover:border-primary/50',
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScoreBadge score={c.score} />
          <Badge tone="muted">{CATEGORY_LABEL[c.category] ?? c.category}</Badge>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-fg-muted">
          <span className={active ? 'text-tertiary' : undefined}>
            {timecode(c.startMs)} – {timecode(c.endMs)}
          </span>
          <span aria-hidden>·</span>
          <span className="rounded border border-outline-variant/30 bg-surface-lowest px-1.5 text-fg">{durationLabel(c.durationMs)}</span>
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold leading-snug text-fg">{c.title}</h3>

      <div className="mb-3 rounded-lg border border-outline-variant/30 bg-surface-low/80 p-2.5">
        <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] text-primary">
          <Sparkles className="size-3.5" aria-hidden /> Why it works
        </div>
        <p className="text-sm italic text-fg-muted">{c.reason}</p>
      </div>

      <p className="mb-3 line-clamp-3 rounded border border-outline-variant/20 bg-surface-lowest/60 p-2 font-mono text-xs leading-relaxed text-fg-muted">“{c.excerpt}”</p>

      <dl className="mb-3 grid grid-cols-3 gap-x-3 gap-y-1.5 sm:grid-cols-6">
        {DIMENSIONS.map(([k, label]) => (
          <div key={k}>
            <dt className="font-mono text-[9px] uppercase tracking-wider text-outline">{label}</dt>
            <dd className="flex items-center gap-1">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-highest">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.componentScores[k] ?? 0) * 10}%` }} />
              </span>
              <span className="tabular font-mono text-[10px] text-fg">{c.componentScores[k]}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-3">
        <div>{c.latestRender && <RenderStatusBadge status={c.latestRender.status} progress={c.latestRender.progress} />}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onPreview} icon={<CirclePlay className="size-4" />}>
            Preview
          </Button>
          {c.latestRender ? (
            <Link href={`/clips/${c.latestRender.id}`}>
              <Button size="sm" variant="secondary" icon={<ExternalLink className="size-3.5" />}>
                Open clip
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="primary" onClick={onGenerate} loading={generating} icon={<WandSparkles className="size-3.5" />}>
              Generate clip
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
