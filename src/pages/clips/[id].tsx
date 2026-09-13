import clsx from 'clsx';
import { ArrowLeft, Captions, CirclePlay, Crop, Download, History, Info, Minus, Plus, RotateCcw, ScanFace, Trash2, WandSparkles } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { bytes, CAPTION_PRESET_LABEL, durationLabel, FRAMING_LABEL, RENDER_ACTIVE, RENDER_STATUS_LABEL, timecode } from '@/lib/format';
import { useAppConfig, useInvalidate, useRender, useTranscript } from '@/lib/hooks';
import { parseTimecode } from '@/lib/format';
import type { AspectRatio, CaptionPreset, FramingMode, Render } from '@/lib/types';
import { PageContainer } from '@/components/shell';
import { SourcePlayer, type SourcePlayerHandle } from '@/components/source-player';
import { Badge, Button, EmptyState, ErrorPanel, inputClass, ProgressBar, RenderStatusBadge, ScoreBadge, Segmented, Spinner, Toggle } from '@/components/ui';

const PRESET_STYLE: Record<CaptionPreset, { sample: string; className: string; accent?: string }> = {
  'bold-default': { sample: 'BIG', className: 'font-extrabold', accent: 'text-[#FFD60A]' },
  karaoke: { sample: 'BIG', className: 'font-bold', accent: 'text-secondary underline decoration-secondary' },
  minimal: { sample: 'big', className: 'font-normal tracking-wide' },
  impact: { sample: 'BIG', className: 'font-black uppercase tracking-tight', accent: 'text-tertiary' },
};

const FRAMING_ICON: Record<FramingMode, typeof ScanFace> = { auto: ScanFace, center: Crop, fit: Captions };

/** Timecode input: shows the committed value, or the user's draft while they type. */
function TimeField({ label, value, onChange, max }: { label: string; value: number; onChange: (ms: number) => void; max: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const ms = draft === null ? null : parseTimecode(draft);
    if (ms !== null) onChange(Math.max(0, Math.min(max, ms)));
    setDraft(null);
  };
  const nudge = (d: number) => onChange(Math.max(0, Math.min(max, value + d)));
  return (
    <div className="space-y-1">
      <span className="font-mono text-[11px] uppercase tracking-wider text-outline">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" className="rounded-md border border-outline-variant/40 p-2 text-fg-muted hover:text-fg" onClick={() => nudge(-500)} aria-label={`${label} half a second earlier`}>
          <Minus className="size-3.5" />
        </button>
        <input
          className={clsx(inputClass, 'h-9 text-center font-mono')}
          value={draft ?? timecode(value, { tenths: true })}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          aria-label={`${label} time`}
        />
        <button type="button" className="rounded-md border border-outline-variant/40 p-2 text-fg-muted hover:text-fg" onClick={() => nudge(500)} aria-label={`${label} half a second later`}>
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Render detail (PRD §21.1): preview, status, download, trim, framing, captions, rerender. */
function ClipEditor({ id }: { id: string }) {
  const q = useRender(id);
  if (q.isLoading) return <Spinner label="Loading clip" />;
  if (q.error || !q.data) {
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return (
      <PageContainer>
        {notFound ? (
          <EmptyState title="Clip not found" action={<Link href="/clips" className="text-sm text-primary hover:underline">Back to clips</Link>}>
            It may have been deleted.
          </EmptyState>
        ) : (
          <ErrorPanel error={q.error instanceof ApiError ? q.error : { message: errorMessage(q.error) }} onRetry={() => void q.refetch()} />
        )}
      </PageContainer>
    );
  }
  // Keyed by render so the form state initializes from each version's snapshot.
  return <EditorBody key={q.data.id} r={q.data} refetch={() => void q.refetch()} />;
}

function EditorBody({ r, refetch }: { r: Render; refetch: () => void }) {
  const router = useRouter();
  const cfg = useAppConfig().data;
  const invalidate = useInvalidate();
  const source = useRef<SourcePlayerHandle>(null);

  const [startMs, setStartMs] = useState(r.startMs);
  const [endMs, setEndMs] = useState(r.endMs);
  const [aspect, setAspect] = useState<AspectRatio>(r.settings.aspectRatio);
  const [framing, setFraming] = useState<FramingMode>(r.settings.framingMode);
  const [captionsOn, setCaptionsOn] = useState(r.settings.captions.enabled);
  const [preset, setPreset] = useState<CaptionPreset>(r.settings.captions.preset);
  const [title, setTitle] = useState(r.title);
  const [wordMode, setWordMode] = useState<'start' | 'end'>('start');
  const [busy, setBusy] = useState<'rerender' | 'title' | 'retry' | 'delete' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const durationMs = r.video?.durationMs ?? 0;
  const transcript = useTranscript(r.videoId, Math.max(0, startMs - 10_000), Math.min(durationMs || endMs + 10_000, endMs + 10_000), true);

  const minMs = cfg?.renderMinDurationMs ?? 5_000;
  const maxMs = cfg?.renderMaxDurationMs ?? 180_000;
  const rangeError = useMemo(() => {
    if (endMs <= startMs) return 'End must be after start.';
    if (endMs - startMs < minMs) return `Clips must be at least ${Math.round(minMs / 1000)} s.`;
    if (endMs - startMs > maxMs) return `Clips can be at most ${Math.round(maxMs / 1000)} s.`;
    if (durationMs && endMs > durationMs) return 'End is past the end of the video.';
    return null;
  }, [startMs, endMs, minMs, maxMs, durationMs]);

  const active = RENDER_ACTIVE.includes(r.status);
  const settingsChanged =
    startMs !== r.startMs ||
    endMs !== r.endMs ||
    aspect !== r.settings.aspectRatio ||
    framing !== r.settings.framingMode ||
    captionsOn !== r.settings.captions.enabled ||
    preset !== r.settings.captions.preset;
  const fellBack = Boolean(r.framing?.strategy && r.framing.strategy !== r.settings.framingMode);
  const frame = r.settings.output;
  const previewStyle = {
    aspectRatio: `${frame.width} / ${frame.height}`,
    width: frame.width > frame.height ? 'min(100%, 640px)' : frame.width === frame.height ? 'min(100%, 480px)' : 'min(100%, 360px)',
  };

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const rerender = () =>
    run('rerender', async () => {
      const next = await api<Render>(`/renders/${r.id}/rerender`, {
        method: 'POST',
        json: { startMs, endMs, aspectRatio: aspect, framingMode: framing, captions: { enabled: captionsOn, preset }, title: title.trim() || undefined },
      });
      await invalidate(['renders', 'candidates']);
      await router.push(`/clips/${next.id}`);
    });

  const saveTitle = () =>
    run('title', async () => {
      await api(`/renders/${r.id}`, { method: 'PATCH', json: { title: title.trim() } });
      await invalidate(['render', 'renders']);
    });

  const retry = () =>
    run('retry', async () => {
      await api(`/renders/${r.id}/retry`, { method: 'POST' });
      await invalidate(['render']);
    });

  const remove = () => {
    if (!window.confirm('Delete this clip version?')) return;
    void run('delete', async () => {
      await api(`/renders/${r.id}`, { method: 'DELETE' });
      await invalidate(['renders', 'candidates']);
      await router.push('/clips');
    });
  };

  const words = transcript.data?.words ?? [];

  return (
    <div className="flex flex-col">
      <Head>
        <title>{`${r.title} · ClipRover`}</title>
      </Head>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-lowest px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Link href={`/videos/${r.videoId}`} className="flex items-center gap-1 text-fg-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden /> {r.video?.title ?? 'Video'}
          </Link>
          <span className="text-outline">/</span>
          <span className="max-w-[20rem] truncate font-semibold text-fg">{r.title}</span>
          <Badge tone="neutral">{r.settings.aspectRatio}</Badge>
          <Badge tone="muted">v{r.version}</Badge>
          {r.candidate && <ScoreBadge score={r.candidate.score} showLabel={false} />}
          <RenderStatusBadge status={r.status} progress={r.progress} />
        </div>
        <div className="flex items-center gap-2">
          {r.downloadUrl && (
            <a href={r.downloadUrl} download className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-on-primary shadow-[0_3px_0_#a0bc64] hover:bg-[#dcff9b]"><Download className="size-4" aria-hidden />Download MP4</a>
          )}
          <Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} onClick={remove} loading={busy === 'delete'} aria-label="Delete clip" />
        </div>
      </div>

      <div className="clip-workspace">
        {/* Settings */}
        <aside className="space-y-6 border-outline-variant/30 bg-surface-low p-5 md:border-r" aria-label="Clip settings">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">Title (not burned in)</span>
            <div className="flex gap-2">
              <input className={inputClass} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} aria-label="Clip title" />
              <Button size="sm" className="h-10" onClick={() => void saveTitle()} disabled={!title.trim() || title === r.title} loading={busy === 'title'}>
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">Aspect ratio</span>
            <Segmented
              label="Aspect ratio"
              value={aspect}
              onChange={setAspect}
              options={(cfg?.aspectRatios ?? ['9:16']).map((a) => ({ value: a, label: a }))}
            />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">Framing</span>
            <div role="radiogroup" aria-label="Framing mode" className="grid gap-2">
              {(['auto', 'center', 'fit'] as FramingMode[]).map((m) => {
                const Icon = FRAMING_ICON[m];
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={framing === m}
                    onClick={() => setFraming(m)}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg border p-2.5 text-left text-sm transition-colors',
                      framing === m ? 'border-2 border-primary-strong bg-surface-high text-fg' : 'border-outline-variant/30 bg-surface text-fg-muted hover:text-fg',
                    )}
                  >
                    <Icon className="size-4 text-primary" aria-hidden />
                    {FRAMING_LABEL[m]}
                  </button>
                );
              })}
            </div>
            {fellBack && (
              <p className="flex gap-1.5 text-xs text-outline">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                No stable face was found in this range, so this version used {FRAMING_LABEL[r.framing!.strategy as FramingMode]?.toLowerCase() ?? r.framing!.strategy}.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-outline">Captions</span>
              <Toggle checked={captionsOn} onChange={setCaptionsOn} label="Burn in captions" />
            </div>
            <div role="radiogroup" aria-label="Caption style" className={clsx('grid grid-cols-2 gap-2', !captionsOn && 'pointer-events-none opacity-40')}>
              {(['bold-default', 'karaoke', 'minimal', 'impact'] as CaptionPreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={preset === p}
                  onClick={() => setPreset(p)}
                  className={clsx(
                    'flex flex-col gap-1.5 rounded-lg border p-2 text-left',
                    preset === p ? 'border-2 border-primary-strong bg-surface-high' : 'border-outline-variant/30 bg-surface hover:border-outline-variant',
                  )}
                >
                  <span className={clsx('flex h-9 items-center justify-center rounded border border-outline-variant/30 bg-surface-lowest text-xs text-fg', PRESET_STYLE[p].className)}>
                    {PRESET_STYLE[p].sample}&nbsp;<span className={PRESET_STYLE[p].accent}>MOMENT</span>
                  </span>
                  <span className="text-xs text-fg">{CAPTION_PRESET_LABEL[p]}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Preview */}
        <section className="flex flex-col items-center gap-4 bg-[radial-gradient(circle,rgba(157,168,160,0.12)_1px,transparent_1px)] [background-size:24px_24px] p-6" aria-label="Preview">
          {r.status === 'COMPLETED' && r.outputUrl ? (
            <video
              key={r.outputUrl}
              src={r.outputUrl}
              poster={r.thumbnailUrl ?? undefined}
              controls
              playsInline
              style={previewStyle}
              className="clip-preview rounded-2xl border-2 border-outline-variant/50 bg-black shadow-2xl"
              onError={refetch}
            />
          ) : r.status === 'FAILED' ? (
            <div className="w-full max-w-md">
              <ErrorPanel title="This render failed" error={r.error} onRetry={() => void retry()} retrying={busy === 'retry'} />
            </div>
          ) : (
            <div style={previewStyle} className="flex clip-preview flex-col items-center justify-center gap-4 rounded-2xl border-2 border-outline-variant/50 bg-surface-lowest p-8 text-center">
              <WandSparkles className="size-8 animate-pulse text-primary" aria-hidden />
              <p className="text-lg font-semibold text-fg">{RENDER_STATUS_LABEL[r.status]}…</p>
              <ProgressBar value={r.progress} label={`${RENDER_STATUS_LABEL[r.status]} ${r.progress}%`} className="w-full max-w-48" />
              <p className="tabular font-mono text-sm text-fg-muted" aria-live="polite">
                {r.progress}%
              </p>
              <p className="max-w-[16rem] text-xs text-outline">Renders run one at a time on the server. You can leave this page; it updates automatically.</p>
            </div>
          )}
          {r.status === 'COMPLETED' && (
            <p className="font-mono text-[11px] text-outline">
              {r.width}×{r.height} · {durationLabel(r.durationMs)} · {bytes(r.fileSize)} · H.264/AAC
            </p>
          )}
        </section>

        {/* Trim, transcript, versions */}
        <aside className="space-y-6 border-outline-variant/30 bg-surface-low p-5 2xl:border-l" aria-label="Trim and versions">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">Trim</h2>
              <span className="tabular font-mono text-[11px] text-fg-muted">{durationLabel(endMs - startMs)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Start" value={startMs} onChange={setStartMs} max={durationMs || endMs} />
              <TimeField label="End" value={endMs} onChange={setEndMs} max={durationMs || endMs + 60_000} />
            </div>
            {rangeError && <p className="text-xs text-danger">{rangeError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" icon={<CirclePlay className="size-4" />} onClick={() => source.current?.playRange(startMs, endMs)}>
                Preview range in source
              </Button>
              {r.candidate && (startMs !== r.candidate.startMs || endMs !== r.candidate.endMs) && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw className="size-3.5" />}
                  onClick={() => {
                    setStartMs(r.candidate!.startMs);
                    setEndMs(r.candidate!.endMs);
                  }}
                >
                  Suggested range
                </Button>
              )}
            </div>
            <SourcePlayer ref={source} videoId={r.videoId} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">Transcript</h2>
              <Segmented
                label="Clicking a word sets"
                value={wordMode}
                onChange={setWordMode}
                options={[
                  { value: 'start', label: 'Set start' },
                  { value: 'end', label: 'Set end' },
                ]}
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface-lowest p-3 text-sm leading-relaxed">
              {transcript.isLoading ? (
                <span className="text-outline">Loading transcript…</span>
              ) : words.length === 0 ? (
                <span className="text-outline">No speech in this range.</span>
              ) : (
                words.map((w, i) => {
                  const inside = w.startMs >= startMs && w.endMs <= endMs + 50;
                  return (
                    <button
                      key={`${w.startMs}-${i}`}
                      type="button"
                      onClick={() => (wordMode === 'start' ? setStartMs(w.startMs) : setEndMs(w.endMs))}
                      className={clsx('mr-1 rounded px-0.5 hover:bg-surface-high', inside ? 'text-fg' : 'text-outline')}
                      title={`${timecode(w.startMs, { tenths: true })} – ${timecode(w.endMs, { tenths: true })}`}
                    >
                      {w.text}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-outline-variant/30 pt-4">
            {actionError && (
              <p role="alert" className="text-sm text-danger">
                {actionError}
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={<WandSparkles className="size-4" />}
              disabled={!settingsChanged || Boolean(rangeError)}
              loading={busy === 'rerender'}
              onClick={() => void rerender()}
            >
              {active ? 'Render new version' : `Re-render as v${(r.versions?.[0]?.version ?? r.version) + 1}`}
            </Button>
            <p className="text-center text-xs text-outline">
              {settingsChanged ? 'Only this range is re-analyzed; nothing is re-transcribed.' : 'Change the range, framing or captions to re-render.'}
            </p>
          </div>

          {r.versions && r.versions.length > 1 && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                <History className="size-4 text-primary" aria-hidden /> Versions
              </h2>
              <ul className="space-y-1">
                {r.versions.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/clips/${v.id}`}
                      className={clsx(
                        'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs',
                        v.id === r.id ? 'border-primary/40 bg-surface-high text-fg' : 'border-outline-variant/30 text-fg-muted hover:text-fg',
                      )}
                      aria-current={v.id === r.id ? 'page' : undefined}
                    >
                      <span className="font-mono">
                        v{v.version} · {timecode(v.startMs)}–{timecode(v.endMs)} · {v.settings.captions.enabled ? CAPTION_PRESET_LABEL[v.settings.captions.preset] : 'no captions'}
                      </span>
                      <RenderStatusBadge status={v.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function ClipPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  if (!router.isReady || !id) return <Spinner label="Loading clip" />;
  return <ClipEditor key={id} id={id} />;
}
