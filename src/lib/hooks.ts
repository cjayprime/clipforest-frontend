/** React Query hooks over the API. */

import { type Query, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AppConfig, BillingInterval, CandidateList, CheckoutStatus, CreditBalance, Playback, Render, TranscriptRange, User, Video } from '@/lib/types';
import { useLiveStatus } from '@/lib/events';
import { isProcessing, RENDER_ACTIVE } from '@/lib/format';

/** Every React Query cache key in one place, so invalidation can't drift. */
export const keys = {
  me: ['me'] as const,
  config: ['config'] as const,
  /** Prefix for everything billing: invalidating it refreshes the balance and any checkout status. */
  billing: ['billing'] as const,
  balance: ['billing', 'balance'] as const,
  checkout: (id: string) => ['billing', 'checkout', id] as const,
  videos: (filter: string) => ['videos', filter] as const,
  video: (id: string) => ['video', id] as const,
  candidates: (id: string, sort: string, minScore?: number) => ['candidates', id, sort, minScore ?? 'default'] as const,
  playback: (id: string) => ['playback', id] as const,
  transcript: (id: string, start: number, end: number) => ['transcript', id, start, end] as const,
  renders: (videoId?: string) => ['renders', videoId ?? 'all'] as const,
  render: (id: string) => ['render', id] as const,
};

export function useAppConfig() {
  return useQuery({ queryKey: keys.config, queryFn: () => api<AppConfig>('/config'), staleTime: Infinity });
}

/** Credit balance, plan and subscription. */
export function useBalance() {
  return useQuery({ queryKey: keys.balance, queryFn: () => api<CreditBalance>('/billing/balance'), staleTime: 30_000 });
}

export function useCandidates(id: string, sort: 'score' | 'time', minScore: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: keys.candidates(id, sort, minScore),
    queryFn: () => api<CandidateList>(`/videos/${id}/candidates?sort=${sort}${minScore !== undefined ? `&minScore=${minScore}` : ''}`),
    enabled,
  });
}

/** A checkout's credit status, polled every 3 s while `poll` is true and it is still pending. */
export function useCheckoutStatus(checkoutId: string, poll: boolean) {
  return useQuery({
    queryKey: keys.checkout(checkoutId),
    queryFn: () => api<CheckoutStatus>(`/billing/checkout/${encodeURIComponent(checkoutId)}`),
    refetchInterval: (query) => (poll && query.state.data?.status !== 'credited' ? 3000 : false),
    retry: false,
  });
}

/** Invalidates whole key prefixes at once, e.g. invalidate(['video', 'videos']). */
export function useInvalidate() {
  const qc = useQueryClient();
  return (prefixes: string[]) => Promise.all(prefixes.map((p) => qc.invalidateQueries({ queryKey: [p] })));
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<{ user: User }>('/auth/me').then((r) => r.user),
    retry: false,
    staleTime: 60_000,
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

/**
 * Polling cadence while work is in flight. Realtime events are advisory, so the
 * UI still polls — slowly when the SSE stream is healthy, quickly when it isn't
 * (PRD §15: GET endpoints are authoritative).
 */
export function usePollWhen<T>(active: (data: T | undefined) => boolean) {
  const live = useLiveStatus();
  const interval = live === 'open' ? 15_000 : 3_000;
  return (query: Query<T, Error>) => (active(query.state.data) ? interval : false);
}

export function useRender(id: string) {
  const refetchInterval = usePollWhen<Render>((r) => (r ? RENDER_ACTIVE.includes(r.status) : false));
  return useQuery({ queryKey: keys.render(id), queryFn: () => api<Render>(`/renders/${id}`), refetchInterval });
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

export interface CheckoutRequest {
  plan: 'starter' | 'creator' | 'studio';
  interval: BillingInterval;
}

/**
 * Starts a Polar checkout and hands back the hosted URL. Payment details are
 * only ever entered on Polar's page — nothing sensitive touches this app.
 */
export function useStartCheckout() {
  return useMutation({
    mutationFn: (request: CheckoutRequest) =>
      api<{ url: string; plan: string; interval: BillingInterval }>('/billing/checkout', { method: 'POST', json: request }),
  });
}

/** A short-lived link to Polar's portal, where a subscription can be changed or cancelled. */
export function useOpenPortal() {
  return useMutation({ mutationFn: () => api<{ url: string }>('/billing/portal', { method: 'POST' }) });
}

export function useTranscript(id: string, startMs: number, endMs: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.transcript(id, startMs, endMs),
    queryFn: () => api<TranscriptRange>(`/videos/${id}/transcript?startMs=${startMs}&endMs=${endMs}`),
    enabled: enabled && endMs > startMs,
    staleTime: Infinity,
  });
}

/** Retry processing, or re-run moment discovery on the saved transcript. */
export function useVideoAction(id: string, action: 'process' | 'analyze') {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api<Video>(`/videos/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => invalidate(['video', 'videos', 'candidates']),
  });
}

export function useVideo(id: string) {
  const refetchInterval = usePollWhen<Video>((v) => (v ? isProcessing(v.status) : false));
  return useQuery({ queryKey: keys.video(id), queryFn: () => api<Video>(`/videos/${id}`), refetchInterval });
}

export function useVideos(filter: string) {
  const refetchInterval = usePollWhen<Video[]>((videos) => (videos ?? []).some((v) => isProcessing(v.status)));
  return useQuery({
    queryKey: keys.videos(filter),
    queryFn: () => api<{ items: Video[] }>(`/videos?filter=${filter}`).then((r) => r.items),
    refetchInterval,
  });
}
