'use client';

import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { api } from './api';
import { isProcessing, RENDER_ACTIVE } from './format';
import type { AppConfig, CandidateList, Playback, Render, TranscriptRange, User, Video } from './types';
import { useLiveStatus } from './events';

export const keys = {
  me: ['me'] as const,
  config: ['config'] as const,
  videos: (filter: string) => ['videos', filter] as const,
  video: (id: string) => ['video', id] as const,
  candidates: (id: string, sort: string, minScore?: number) => ['candidates', id, sort, minScore ?? 'default'] as const,
  playback: (id: string) => ['playback', id] as const,
  transcript: (id: string, start: number, end: number) => ['transcript', id, start, end] as const,
  renders: (videoId?: string) => ['renders', videoId ?? 'all'] as const,
  render: (id: string) => ['render', id] as const,
};

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: () => api<{ user: User }>('/auth/me').then((r) => r.user), retry: false, staleTime: 60_000 });
}

export function useAppConfig() {
  return useQuery({ queryKey: keys.config, queryFn: () => api<AppConfig>('/config'), staleTime: Infinity });
}

/**
 * Polling cadence while work is in flight. Realtime events are advisory, so the
 * UI still polls — slowly when the SSE stream is healthy, quickly when it isn't
 * (PRD §15: GET endpoints are authoritative).
 */
function usePollWhen<T>(active: (data: T | undefined) => boolean) {
  const live = useLiveStatus();
  const interval = live === 'open' ? 15_000 : 3_000;
  return (query: Query<T, Error>) => (active(query.state.data) ? interval : false);
}

export function useVideos(filter: string) {
  const refetchInterval = usePollWhen<Video[]>((videos) => (videos ?? []).some((v) => isProcessing(v.status)));
  return useQuery({
    queryKey: keys.videos(filter),
    queryFn: () => api<{ items: Video[] }>(`/videos?filter=${filter}`).then((r) => r.items),
    refetchInterval,
  });
}

export function useVideo(id: string) {
  const refetchInterval = usePollWhen<Video>((v) => (v ? isProcessing(v.status) : false));
  return useQuery({ queryKey: keys.video(id), queryFn: () => api<Video>(`/videos/${id}`), refetchInterval });
}

export function useCandidates(id: string, sort: 'score' | 'time', minScore: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: keys.candidates(id, sort, minScore),
    queryFn: () => api<CandidateList>(`/videos/${id}/candidates?sort=${sort}${minScore !== undefined ? `&minScore=${minScore}` : ''}`),
    enabled,
  });
}

export function usePlayback(id: string, enabled = true) {
  return useQuery({
    queryKey: keys.playback(id),
    queryFn: () => api<Playback>(`/videos/${id}/playback`),
    enabled,
    staleTime: 30 * 60_000,
    // Signed URLs are refreshed well before they expire.
    refetchInterval: 45 * 60_000,
  });
}

export function useTranscript(id: string, startMs: number, endMs: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.transcript(id, startMs, endMs),
    queryFn: () => api<TranscriptRange>(`/videos/${id}/transcript?startMs=${startMs}&endMs=${endMs}`),
    enabled: enabled && endMs > startMs,
    staleTime: Infinity,
  });
}

export function useRenders(videoId?: string) {
  const path = videoId ? `/videos/${videoId}/renders` : '/renders';
  const refetchInterval = usePollWhen<Render[]>((rs) => (rs ?? []).some((r) => RENDER_ACTIVE.includes(r.status)));
  return useQuery({
    queryKey: keys.renders(videoId),
    queryFn: () => api<{ items: Render[] }>(path).then((r) => r.items),
    refetchInterval,
  });
}

export function useRender(id: string) {
  const refetchInterval = usePollWhen<Render>((r) => (r ? RENDER_ACTIVE.includes(r.status) : false));
  return useQuery({ queryKey: keys.render(id), queryFn: () => api<Render>(`/renders/${id}`), refetchInterval });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (prefixes: string[]) => Promise.all(prefixes.map((p) => qc.invalidateQueries({ queryKey: [p] })));
}

export function useVideoAction(id: string, action: 'process' | 'analyze') {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api<Video>(`/videos/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => invalidate(['video', 'videos', 'candidates']),
  });
}
