import { useQueryClient } from '@tanstack/react-query';
import { VideoOff } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { usePlayback } from '@/lib/hooks';
import { Badge } from './ui';

export interface SourcePlayerHandle {
  playRange: (startMs: number, endMs: number) => void;
  seek: (ms: number) => void;
  currentMs: () => number;
}

/**
 * Plays the original source (or a browser proxy) from a short-lived signed URL.
 * When a URL expires mid-session it is re-signed transparently and playback
 * resumes at the same position (PRD §21.2).
 */
export const SourcePlayer = forwardRef<SourcePlayerHandle, { videoId: string; onTime?: (ms: number) => void; className?: string }>(
  function SourcePlayer({ videoId, onTime, className }, ref) {
    const pb = usePlayback(videoId);
    const qc = useQueryClient();
    const video = useRef<HTMLVideoElement>(null);
    const stopAt = useRef<number | null>(null);
    const resumeAt = useRef<number | null>(null);
    const lastRefresh = useRef(0);

    useImperativeHandle(ref, () => ({
      playRange(startMs, endMs) {
        const v = video.current;
        if (!v) return;
        v.currentTime = startMs / 1000;
        stopAt.current = endMs;
        void v.play().catch(() => undefined);
      },
      seek(ms) {
        if (video.current) video.current.currentTime = ms / 1000;
        stopAt.current = null;
      },
      currentMs: () => Math.round((video.current?.currentTime ?? 0) * 1000),
    }));

    useEffect(() => {
      const v = video.current;
      if (v && resumeAt.current !== null) {
        const at = resumeAt.current;
        const onLoaded = () => {
          v.currentTime = at;
          resumeAt.current = null;
        };
        v.addEventListener('loadedmetadata', onLoaded, { once: true });
        return () => v.removeEventListener('loadedmetadata', onLoaded);
      }
    }, [pb.data?.sourceUrl]);

    const onError = () => {
      const now = Date.now();
      if (now - lastRefresh.current < 20_000) return;
      lastRefresh.current = now;
      resumeAt.current = video.current?.currentTime ?? 0;
      void qc.invalidateQueries({ queryKey: ['playback', videoId] });
    };

    if (pb.isLoading) return <div className={`aspect-video animate-pulse rounded-xl bg-surface ${className ?? ''}`} />;
    if (!pb.data?.sourceUrl) {
      return (
        <div className={`flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-lowest text-sm text-outline ${className ?? ''}`}>
          <VideoOff className="size-6" aria-hidden />
          Source preview is not available.
        </div>
      );
    }
    return (
      <div className={`relative overflow-hidden rounded-xl border border-outline-variant/40 bg-black shadow-2xl ${className ?? ''}`}>
        <video
          ref={video}
          src={pb.data.sourceUrl}
          poster={pb.data.thumbnailUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
          onError={onError}
          onTimeUpdate={(e) => {
            const ms = e.currentTarget.currentTime * 1000;
            onTime?.(ms);
            if (stopAt.current !== null && ms >= stopAt.current) {
              e.currentTarget.pause();
              stopAt.current = null;
            }
          }}
        />
        {pb.data.isProxy && (
          <Badge tone="muted" className="absolute left-3 top-3">
            Preview proxy
          </Badge>
        )}
      </div>
    );
  },
);
