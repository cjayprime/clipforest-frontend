import { ArrowRight, Film, LoaderCircle, Scissors, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { isProcessing, relativeTime, timecode, VIDEO_STATUS_LABEL } from '@/lib/format';
import type { Video } from '@/lib/types';
import { useUploads } from './uploads';
import { Badge, EmptyState, ProgressBar, Spinner, VideoStatusBadge } from './ui';

export function VideoCard({ video }: { video: Video }) {
  const { uploads } = useUploads();
  const upload = uploads[video.id];
  const busy = isProcessing(video.status) || video.status === 'CREATED';
  const progress =
    video.status === 'CREATED' || video.status === 'UPLOADING'
      ? upload
        ? Math.round((upload.loaded / Math.max(1, upload.total)) * 100)
        : 0
      : video.progress;
  const cta = video.status === 'READY' ? 'View highlights' : video.status === 'FAILED' ? 'See what happened' : 'View progress';

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group flex flex-col justify-between rounded-xl border border-outline-variant/30 bg-surface-lowest p-3 shadow-lg transition-all hover:border-outline focus-visible:border-primary"
    >
      <div className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-surface">
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnailUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-surface-high to-surface-lowest">
              <Film className="size-8 text-outline-variant" aria-hidden />
            </div>
          )}
          {video.durationMs ? (
            <span className="absolute bottom-2 right-2 rounded bg-surface-lowest/80 px-1.5 py-0.5 font-mono text-[10px] text-fg backdrop-blur">{timecode(video.durationMs)}</span>
          ) : null}
          <span className="absolute left-2 top-2 rounded bg-surface-lowest/80 px-1.5 py-0.5 font-mono text-[10px] text-secondary backdrop-blur">
            {video.sourceType === 'url' ? 'YouTube' : 'Upload'}
          </span>
          {video.status === 'READY' && video.topScore != null && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-tertiary/40 bg-tertiary-strong/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur">
              <span className="size-1.5 rounded-full bg-tertiary" aria-hidden />
              Top: {video.topScore}
            </span>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-[2px]">
              <LoaderCircle className="size-7 animate-spin text-primary" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-outline">
          <span>{relativeTime(video.createdAt)}</span>
          <VideoStatusBadge status={video.status} />
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-fg">{video.title}</h3>
        {busy && <ProgressBar value={progress} label={`${VIDEO_STATUS_LABEL[video.status]} ${progress}%`} />}
        {video.status === 'READY' && (
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">
              <Sparkles className="size-3 text-primary" aria-hidden />
              {video.candidateCount ?? 0} moments
            </Badge>
            <Badge tone="neutral">
              <Scissors className="size-3 text-primary" aria-hidden />
              {video.renderCount ?? 0} clips
            </Badge>
          </div>
        )}
        {video.status === 'FAILED' && video.error && <p className="line-clamp-2 text-xs text-danger">{video.error.message}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-3 font-mono text-[11px] text-primary">
        {cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}

export function VideoGrid({ videos, loading, limit }: { videos: Video[] | undefined; loading: boolean; limit?: number }) {
  if (loading && !videos) return <Spinner label="Loading videos" />;
  const items = limit ? (videos ?? []).slice(0, limit) : videos ?? [];
  if (!items.length) {
    return (
      <EmptyState icon={<Film className="size-5" />} title="No videos here yet">
        Paste a link or drop a file above. We’ll transcribe it, find the strongest moments and rank them for you.
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
