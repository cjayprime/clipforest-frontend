'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ProgressEvent } from './types';

type LiveStatus = 'connecting' | 'open' | 'closed';
const LiveContext = createContext<LiveStatus>('closed');

export function useLiveStatus() {
  return useContext(LiveContext);
}

/**
 * Subscribes to the per-user SSE stream and patches/invalidates cached queries.
 * If the stream drops, hooks fall back to short-interval polling, and on
 * reconnect everything is refetched — no state depends on missed events.
 */
export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>('connecting');

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let disposed = false;

    const onEvent = (raw: MessageEvent) => {
      let e: ProgressEvent;
      try {
        e = JSON.parse(raw.data);
      } catch {
        return;
      }
      if (e.type === 'video.updated' && e.videoId) {
        qc.setQueryData(['video', e.videoId], (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: e.status, progress: e.progress ?? old.progress, stage: e.stage ?? old.stage, substage: e.substage ?? old.substage } : old,
        );
        if (e.status === 'READY' || e.status === 'FAILED' || e.status === 'DELETED') {
          void qc.invalidateQueries({ queryKey: ['video', e.videoId] });
          void qc.invalidateQueries({ queryKey: ['candidates', e.videoId] });
          void qc.invalidateQueries({ queryKey: ['me'] });
        }
        void qc.invalidateQueries({ queryKey: ['videos'] });
      }
      if (e.type === 'render.updated' && e.renderId) {
        qc.setQueryData(['render', e.renderId], (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: e.status, progress: e.progress ?? old.progress, substage: e.substage ?? old.substage } : old,
        );
        if (e.status === 'COMPLETED' || e.status === 'FAILED') {
          void qc.invalidateQueries({ queryKey: ['render', e.renderId] });
          // Rendering and transcription bill usage minutes shown in the sidebar.
          void qc.invalidateQueries({ queryKey: ['me'] });
        }
        void qc.invalidateQueries({ queryKey: ['renders'] });
        if (e.videoId) void qc.invalidateQueries({ queryKey: ['candidates', e.videoId] });
      }
    };

    const connect = () => {
      if (disposed) return;
      setStatus('connecting');
      es = new EventSource('/api/events', { withCredentials: true });
      es.onopen = () => {
        attempts = 0;
        setStatus('open');
        // Reconstruct state after (re)connecting instead of trusting missed events.
        void qc.invalidateQueries();
      };
      es.addEventListener('video.updated', onEvent as EventListener);
      es.addEventListener('render.updated', onEvent as EventListener);
      es.onerror = () => {
        es?.close();
        setStatus('closed');
        retry = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts++));
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      es?.close();
    };
  }, [qc]);

  return <LiveContext.Provider value={status}>{children}</LiveContext.Provider>;
}
