import clsx from 'clsx';
import {
  ArrowLeft,
  AudioLines,
  Check,
  CloudCheck,
  FileVideo,
  LayoutDashboard,
  LoaderCircle,
  Radar,
  RefreshCw,
  Ruler,
  Scissors,
  Timer,
  Trash2,
  Upload,
} from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef, useState, type FormEvent } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { bytes, durationLabel, relativeTime, timecode, VIDEO_STATUS_LABEL } from '@/lib/format';
import { useAppConfig, useCandidates, useInvalidate, useVideo, useVideoAction } from '@/lib/hooks';
import { parseTimecode } from '@/lib/timecode';
import type { Candidate, Render, Video } from '@/lib/types';
import { CandidateCard } from './candidate-card';
import { PageContainer } from './shell';
import { SourcePlayer, type SourcePlayerHandle } from './source-player';
import { Timeline } from './timeline';
import { Badge, Button, Card, EmptyState, ErrorPanel, inputClass, ProgressBar, Segmented, Spinner, VideoStatusBadge } from './ui';
import { useUploads } from './uploads';

const SUBSTAGE: Record<string, string> = {
  queued: 'Waiting for a worker',
  validating: 'Validating the file',
  downloading: 'Downloading the source',
  storing: 'Saving the source',
  probing: 'Reading video metadata',
  'making-preview': 'Creating a browser-friendly preview',
  'extracting-audio': 'Extracting speech audio',
  'preparing-audio': 'Preparing audio',
  transcribing: 'Transcribing with word timings',
  'finding-moments': 'Scanning the transcript for moments',
  ranking: 'Ranking the shortlist',
};

function substageLabel(s: string | null) {
  if (!s) return null;
  if (s.startsWith('retrying')) return 'Retrying after a temporary error';
  return SUBSTAGE[s] ?? s;
}

export function VideoScreen({ id }: { id: string }) {
  const q = useVideo(id);
  if (q.isLoading) return <Spinner label="Loading video" />;
  if (q.error) {
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return (
      <PageContainer>
        {notFound ? (
          <EmptyState title="Video not found" action={<Link href="/videos" className="text-sm text-primary hover:underline">Back to videos</Link>}>
            It may have been deleted, or it belongs to another account.
          </EmptyState>
        ) : (
          <ErrorPanel error={q.error instanceof ApiError ? q.error : { message: errorMessage(q.error) }} onRetry={() => void q.refetch()} />
        )}
      </PageContainer>
    );
  }
  const video = q.data!;
  return (
    <>
      <Head>
        <title>{`${video.title} · ClipForest`}</title>
      </Head>
      {video.status === 'READY' ? <ResultsView video={video} /> : video.status === 'FAILED' ? <FailureView video={video} /> : <ProcessingView video={video} />}
    </>
  );
}

function useDeleteVideo(video: Video) {
  const router = useRouter();
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    const msg =
      video.status === 'READY' || video.status === 'FAILED'
        ? 'Delete this video, its moments and all generated clips? This cannot be undone.'
        : 'Cancel processing and delete this video? This cannot be undone.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await api(`/videos/${video.id}`, { method: 'DELETE' });
      await invalidate(['videos', 'renders']);
      await router.push('/');
    } catch (err) {
      window.alert(errorMessage(err));
      setBusy(false);
    }
  };
  return { run, busy };
}

function TechSpecs({ video }: { video: Video }) {
  const items = [
    { icon: Timer, label: 'Duration', value: video.durationMs ? durationLabel(video.durationMs) : 'Detecting…', sub: video.durationMs ? timecode(video.durationMs) : '' },
    {
      icon: Ruler,
      label: 'Resolution',
      value: video.width ? `${video.width} × ${video.height}` : 'Detecting…',
      sub: video.fps ? `${video.fps} fps · ${video.orientation ?? ''}` : '',
    },
    { icon: AudioLines, label: 'Audio / language', value: video.hasAudio === false ? 'No audio' : video.language ? video.language.toUpperCase() : video.audioCodec ?? 'Detecting…', sub: video.audioCodec ?? '' },
    {
      icon: FileVideo,
      label: 'Source',
      value: video.sourceType === 'url' ? 'YouTube import' : 'Direct upload',
      sub: video.sizeBytes ? bytes(video.sizeBytes) : video.originalFilename,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(({ icon: Icon, label, value, sub }) => (
        <Card key={label} className="flex flex-col gap-1 p-3.5">
          <div className="flex items-center justify-between font-mono text-[10px] text-outline">
            {label}
            <Icon className="size-4" aria-hidden />
          </div>
          <span className="truncate text-base font-semibold text-fg">{value}</span>
          <span className="truncate font-mono text-[10px] text-outline">{sub}</span>
        </Card>
      ))}
    </div>
  );
}

const STEPS = [
  { key: 'upload', label: 'Uploading video', desc: 'Sending the file directly to secure storage.', statuses: ['CREATED', 'UPLOADING'] },
  { key: 'ingest', label: 'Preparing video', desc: 'Validating the media, reading metadata and extracting speech audio.', statuses: ['QUEUED', 'INGESTING'] },
  { key: 'transcribe', label: 'Creating transcript', desc: 'Transcribing speech with word-level timestamps.', statuses: ['TRANSCRIBING'] },
  { key: 'analyze', label: 'Finding best moments', desc: 'Scanning overlapping windows, removing duplicates, refining boundaries and ranking.', statuses: ['ANALYZING'] },
];

function UploadResume({ video }: { video: Video }) {
  const { start } = useUploads();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
      <p className="font-medium text-fg">The upload isn’t running in this tab.</p>
      <p className="mt-1 text-fg-muted">
        If you refreshed or closed the page, select the same file ({video.originalFilename}, {bytes(video.sizeBytes)}) to upload it again.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" icon={<Upload className="size-3.5" />} onClick={() => ref.current?.click()}>
          Choose file
        </Button>
        {error && <span className="text-danger">{error}</span>}
      </div>
      <input
        ref={ref}
        type="file"
        className="sr-only"
        aria-label="Choose the same file again"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (video.sizeBytes && f.size !== video.sizeBytes) return setError('That is a different file (the size does not match).');
          setError(null);
          start(video.id, f);
        }}
      />
    </div>
  );
}

function ProcessingView({ video }: { video: Video }) {
  const { uploads, cancel } = useUploads();
  const upload = uploads[video.id];
  const del = useDeleteVideo(video);
  const waitingUpload = video.status === 'CREATED' || video.status === 'UPLOADING';
  const uploadActive = upload && (upload.state === 'uploading' || upload.state === 'finishing');
  const pct = waitingUpload ? (upload ? Math.round((upload.loaded / Math.max(1, upload.total)) * 100) : 0) : video.progress;
  const current = STEPS.findIndex((s) => s.statuses.includes(video.status));
  const headline = waitingUpload ? 'Uploading your video…' : video.status === 'ANALYZING' ? 'Finding your best moments…' : VIDEO_STATUS_LABEL[video.status] + '…';
  const sub = substageLabel(video.substage);

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Link href="/videos" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> Videos
        </Link>
        <Card className="relative overflow-hidden rounded-2xl p-6 shadow-2xl lg:p-8">
          <div className="absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" aria-hidden />
          <div className="flex flex-col gap-4 border-b border-outline-variant/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest">
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnailUrl} alt="" className="size-full object-cover opacity-75" />
                ) : null}
                <LoaderCircle className="absolute inset-0 m-auto size-5 animate-spin text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-secondary">
                  Processing · added {relativeTime(video.createdAt)}
                </p>
                <h1 className="truncate text-lg font-semibold text-fg">{video.title}</h1>
                <p className="truncate font-mono text-[10px] text-outline">{video.sourceType === 'url' ? video.sourceUrl : video.originalFilename}</p>
              </div>
            </div>
            <VideoStatusBadge status={video.status} />
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-fg">{headline}</h2>
            <p className="text-sm text-fg-muted">{STEPS[Math.max(0, current)]?.desc}</p>
          </div>

          <div className="mt-6 space-y-3 rounded-xl border border-outline-variant/30 bg-surface-lowest/80 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-outline">Progress</span>
                <p className="tabular text-4xl font-semibold text-fg" aria-live="polite">
                  {pct}%
                </p>
              </div>
              {sub && <span className="text-right font-mono text-[11px] text-primary">{sub}</span>}
              {waitingUpload && upload && <span className="font-mono text-[11px] text-outline">{bytes(upload.loaded)} of {bytes(upload.total)}</span>}
            </div>
            <ProgressBar value={pct} label={`${headline} ${pct}%`} />
            <p className="font-mono text-[10px] text-outline">Progress is an estimate; the steps below reflect the confirmed stage.</p>
          </div>

          {waitingUpload && upload?.state === 'error' && (
            <p role="alert" className="mt-4 text-sm text-danger">
              Upload failed: {upload.error}
            </p>
          )}
          {waitingUpload && !uploadActive && (
            <div className="mt-4">
              <UploadResume video={video} />
            </div>
          )}

          <ol className="relative mt-8 flex flex-col">
            <div className="absolute bottom-6 left-4 top-5 w-0.5 -translate-x-1/2 bg-outline-variant/30" aria-hidden />
            {STEPS.map((s, i) => {
              const state = i < current ? 'done' : i === current ? 'active' : 'pending';
              return (
                <li
                  key={s.key}
                  className={clsx('relative flex items-start gap-4 py-3', state === 'active' && '-mx-4 rounded-xl border border-primary/20 bg-surface/40 px-4', state === 'pending' && 'opacity-60')}
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  <span
                    className={clsx(
                      'z-10 flex size-8 shrink-0 items-center justify-center rounded-full border',
                      state === 'done' && 'border-tertiary bg-tertiary-strong/30 text-tertiary',
                      state === 'active' && 'animate-pulse border-primary bg-primary-strong/20 text-primary',
                      state === 'pending' && 'border-outline-variant/40 bg-surface-high text-outline',
                    )}
                  >
                    {state === 'done' ? <Check className="size-4" aria-hidden /> : state === 'active' ? <Radar className="size-4" aria-hidden /> : <span className="font-mono text-xs">{i + 1}</span>}
                  </span>
                  <div className="pt-1">
                    <p className={clsx('text-sm font-semibold', state === 'active' ? 'text-primary' : 'text-fg')}>
                      {s.label}
                      <span className="ml-2 font-mono text-[10px] font-normal text-outline">{state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Pending'}</span>
                    </p>
                    <p className="text-xs text-fg-muted">{s.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex flex-col gap-4 border-t border-outline-variant/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-high text-secondary">
                <CloudCheck className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-fg">{waitingUpload ? 'Keep this tab open while uploading.' : "You're free to leave this page."}</p>
                <p className="text-xs text-outline">{waitingUpload ? 'Processing starts automatically when the upload finishes.' : 'Processing continues on the server; this page updates automatically.'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="size-4" />}
                loading={del.busy}
                onClick={() => {
                  if (uploadActive) cancel(video.id);
                  void del.run();
                }}
              >
                Cancel & delete
              </Button>
              <Link href="/">
                <Button variant="primary" size="sm" icon={<LayoutDashboard className="size-4" />}>
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>
        <TechSpecs video={video} />
      </div>
    </PageContainer>
  );
}

function FailureView({ video }: { video: Video }) {
  const retry = useVideoAction(video.id, 'process');
  const del = useDeleteVideo(video);
  const stage = video.failedStage ? VIDEO_STATUS_LABEL[video.failedStage as Video['status']] ?? video.failedStage : null;
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Link href="/videos" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> Videos
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-fg">{video.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{stage ? `Failed while: ${stage.toLowerCase()}` : 'Processing failed'}</p>
        </div>
        <ErrorPanel title="Processing failed" error={video.error} onRetry={() => retry.mutate()} retrying={retry.isPending}>
          {retry.error && <p className="text-sm text-danger">{errorMessage(retry.error)}</p>}
          {video.hasTranscript && <p className="text-xs text-outline">The transcript is saved — retrying only re-runs moment discovery.</p>}
        </ErrorPanel>
        <div>
          <Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} onClick={() => void del.run()} loading={del.busy}>
            Delete video
          </Button>
        </div>
        <TechSpecs video={video} />
      </div>
    </PageContainer>
  );
}

function ManualRangeForm({ video, playerMs }: { video: Video; playerMs: () => number }) {
  const router = useRouter();
  const cfg = useAppConfig().data;
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const s = parseTimecode(start);
    const en = parseTimecode(end);
    if (s === null || en === null) return setError('Use times like 12:30 or 1:02:05.');
    setBusy(true);
    setError(null);
    try {
      const r = await api<Render>(`/videos/${video.id}/renders`, { method: 'POST', json: { startMs: s, endMs: en } });
      await router.push(`/clips/${r.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };
  const use = (setter: (v: string) => void) => setter(timecode(playerMs(), { tenths: true }));
  return (
    <form onSubmit={submit} className="rounded-xl border border-outline-variant/30 bg-surface-low p-4">
      <h3 className="text-sm font-semibold text-fg">Create a clip from a custom range</h3>
      <p className="mt-1 text-xs text-outline">
        {Math.round((cfg?.renderMinDurationMs ?? 5000) / 1000)}–{Math.round((cfg?.renderMaxDurationMs ?? 180000) / 1000)} seconds. Use the player to find the moment.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {[
          { label: 'Start', value: start, set: setStart },
          { label: 'End', value: end, set: setEnd },
        ].map((f) => (
          <label key={f.label} className="block space-y-1">
            <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-outline">
              {f.label}
              <button type="button" className="normal-case tracking-normal text-primary hover:underline" onClick={() => use(f.set)}>
                use player time
              </button>
            </span>
            <input className={inputClass} placeholder="mm:ss" value={f.value} onChange={(e) => f.set(e.target.value)} />
          </label>
        ))}
        <Button type="submit" variant="primary" loading={busy} icon={<Scissors className="size-4" />}>
          Create clip
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

function ResultsView({ video }: { video: Video }) {
  const router = useRouter();
  const invalidate = useInvalidate();
  const [sort, setSort] = useState<'score' | 'time'>('score');
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const list = useCandidates(video.id, sort, minScore, true);
  const player = useRef<SourcePlayerHandle>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const reanalyze = useVideoAction(video.id, 'analyze');
  const del = useDeleteVideo(video);

  const items = list.data?.items ?? [];
  const hidden = list.data?.hiddenCount ?? 0;

  const preview = (c: Candidate) => {
    setActiveId(c.id);
    player.current?.playRange(c.startMs, c.endMs);
  };

  const generate = async (c: Candidate) => {
    setPending(c.id);
    setGenError(null);
    try {
      const r = await api<Render>(`/candidates/${c.id}/renders`, { method: 'POST', json: {} });
      await invalidate(['renders', 'candidates']);
      await router.push(`/clips/${r.id}`);
    } catch (err) {
      setGenError(errorMessage(err));
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 bg-canvas/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Link href="/videos" className="flex items-center gap-1 text-fg-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden /> Videos
          </Link>
          <span className="text-outline">/</span>
          <h1 className="max-w-[28rem] truncate font-medium text-fg">{video.title}</h1>
          <Badge tone="neutral">{timecode(video.durationMs)}</Badge>
          <Badge tone="tertiary" dot>
            {list.data?.total ?? 0} moments found
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            icon={<RefreshCw className="size-3.5" />}
            loading={reanalyze.isPending}
            onClick={() => {
              if (window.confirm('Find moments again from the saved transcript? The current list is replaced; clips you already generated are kept.')) reanalyze.mutate();
            }}
          >
            Re-analyze
          </Button>
          <Button size="sm" variant="danger" icon={<Trash2 className="size-3.5" />} onClick={() => void del.run()} loading={del.busy} aria-label="Delete video" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12">
        <section className="flex flex-col gap-4 border-outline-variant/30 p-4 sm:p-6 xl:col-span-7 xl:border-r">
          <div className="xl:sticky xl:top-[7.5rem]">
            <SourcePlayer ref={player} videoId={video.id} onTime={setNow} />
            <div className="mt-4">
              <Timeline
                durationMs={video.durationMs ?? 0}
                candidates={items}
                activeId={activeId}
                currentMs={now}
                onSelect={preview}
                onSeek={(ms) => player.current?.seek(ms)}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 p-4 sm:p-6 xl:col-span-5" aria-labelledby="moments-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 id="moments-heading" className="text-xl font-semibold text-fg">
                Best moments
              </h2>
              <Badge tone="primary">{items.length}</Badge>
            </div>
            <Segmented
              label="Sort moments"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'score', label: 'Best score' },
                { value: 'time', label: 'Source time' },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-outline">
            <span>Showing score ≥ {list.data?.minScore ?? '…'}</span>
            {hidden > 0 && (
              <button type="button" className="text-primary hover:underline" onClick={() => setMinScore(0)}>
                Show {hidden} lower-scored
              </button>
            )}
            {minScore === 0 && (
              <button type="button" className="text-primary hover:underline" onClick={() => setMinScore(undefined)}>
                Reset threshold
              </button>
            )}
          </div>
          {genError && <ErrorPanel title="Couldn't start the clip" error={{ message: genError }} />}
          {list.isLoading ? (
            <Spinner label="Loading moments" />
          ) : items.length === 0 ? (
            <EmptyState icon={<Radar className="size-5" />} title="No strong short-form moments detected">
              We didn’t find moments that meet the quality bar
              {hidden > 0 ? `; ${hidden} lower-scored candidates are hidden.` : '.'} You can lower the threshold or clip any range yourself.
              {hidden > 0 && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => setMinScore(0)}>
                    Show lower-scored moments
                  </Button>
                </div>
              )}
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((c) => (
                <CandidateCard key={c.id} candidate={c} active={c.id === activeId} generating={pending === c.id} onPreview={() => preview(c)} onGenerate={() => void generate(c)} />
              ))}
            </div>
          )}
          <ManualRangeForm video={video} playerMs={() => player.current?.currentMs() ?? now} />
        </section>
      </div>
    </div>
  );
}
