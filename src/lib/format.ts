import type { RenderStatus, VideoStatus } from './types';

/** 00:14:23 or 14:23 style timecodes from integer milliseconds. */
export function timecode(ms: number | null | undefined, opts: { forceHours?: boolean; tenths?: boolean } = {}): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '--:--';
  const total = Math.max(0, ms) / 1000;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const tenths = opts.tenths ? `.${Math.floor((total * 10) % 10)}` : '';
  return h > 0 || opts.forceHours ? `${pad(h)}:${pad(m)}:${pad(s)}${tenths}` : `${pad(m)}:${pad(s)}${tenths}`;
}

export function durationLabel(ms: number | null | undefined): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export function bytes(n: number | null | undefined): string {
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 45) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return 'yesterday';
  if (diff < 86400 * 30) return `${Math.round(diff / 86400)} days ago`;
  return new Date(iso).toLocaleDateString();
}

/** User-facing labels for processing states (PRD §3.4). */
export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  CREATED: 'Waiting for upload',
  UPLOADING: 'Uploading video',
  QUEUED: 'Queued',
  INGESTING: 'Preparing video',
  TRANSCRIBING: 'Creating transcript',
  ANALYZING: 'Finding best moments',
  READY: 'Clips found',
  FAILED: 'Processing failed',
};

export const RENDER_STATUS_LABEL: Record<RenderStatus, string> = {
  QUEUED: 'Queued',
  PREPARING: 'Preparing',
  ANALYZING_VISUALS: 'Finding faces',
  RENDERING: 'Generating clip',
  UPLOADING: 'Saving clip',
  COMPLETED: 'Clip ready',
  FAILED: 'Render failed',
};

export const PROCESSING: VideoStatus[] = ['QUEUED', 'INGESTING', 'TRANSCRIBING', 'ANALYZING'];
export const RENDER_ACTIVE: RenderStatus[] = ['QUEUED', 'PREPARING', 'ANALYZING_VISUALS', 'RENDERING', 'UPLOADING'];

export function isProcessing(status: VideoStatus) {
  return PROCESSING.includes(status) || status === 'UPLOADING';
}

export function scoreTier(score: number): { label: string; tone: 'tertiary' | 'primary' | 'neutral' | 'muted' } {
  if (score >= 85) return { label: 'Exceptional', tone: 'tertiary' };
  if (score >= 70) return { label: 'Strong', tone: 'primary' };
  if (score >= 55) return { label: 'Good', tone: 'neutral' };
  return { label: 'Fair', tone: 'muted' };
}

export const CAPTION_PRESET_LABEL: Record<string, string> = {
  'bold-default': 'Bold',
  karaoke: 'Karaoke',
  minimal: 'Minimal',
  impact: 'Impact',
};

export const FRAMING_LABEL: Record<string, string> = {
  auto: 'Auto (face tracking)',
  center: 'Center crop',
  fit: 'Fit with blurred background',
};

export const CATEGORY_LABEL: Record<string, string> = {
  insight: 'Insight',
  story: 'Story',
  humor: 'Humor',
  controversy: 'Hot take',
  advice: 'Advice',
  reaction: 'Reaction',
  other: 'Moment',
};
