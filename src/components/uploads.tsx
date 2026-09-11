'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { errorMessage } from '@/lib/api';
import { uploadFile } from '@/lib/upload';

export interface UploadState {
  videoId: string;
  fileName: string;
  loaded: number;
  total: number;
  state: 'uploading' | 'finishing' | 'done' | 'error' | 'cancelled';
  error?: string;
}

interface UploadsApi {
  uploads: Record<string, UploadState>;
  start: (videoId: string, file: File) => void;
  cancel: (videoId: string) => void;
}

const Ctx = createContext<UploadsApi | null>(null);

/** Keeps direct-to-storage uploads alive while the user navigates inside the app. */
export function UploadsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const controllers = useRef(new Map<string, AbortController>());

  const patch = useCallback((id: string, p: Partial<UploadState>) => {
    setUploads((u) => (u[id] ? { ...u, [id]: { ...u[id], ...p } } : u));
  }, []);

  const start = useCallback(
    (videoId: string, file: File) => {
      const ctrl = new AbortController();
      controllers.current.set(videoId, ctrl);
      setUploads((u) => ({ ...u, [videoId]: { videoId, fileName: file.name, loaded: 0, total: file.size, state: 'uploading' } }));
      const warn = (e: BeforeUnloadEvent) => e.preventDefault();
      window.addEventListener('beforeunload', warn);
      uploadFile(
        videoId,
        file,
        ({ loaded, total }) => patch(videoId, { loaded, total, state: loaded >= total ? 'finishing' : 'uploading' }),
        ctrl.signal,
      )
        .then(() => {
          patch(videoId, { state: 'done', loaded: file.size });
          void qc.invalidateQueries({ queryKey: ['video', videoId] });
          void qc.invalidateQueries({ queryKey: ['videos'] });
        })
        .catch((err) => {
          patch(videoId, ctrl.signal.aborted ? { state: 'cancelled' } : { state: 'error', error: errorMessage(err) });
        })
        .finally(() => {
          window.removeEventListener('beforeunload', warn);
          controllers.current.delete(videoId);
        });
    },
    [patch, qc],
  );

  const cancel = useCallback((videoId: string) => controllers.current.get(videoId)?.abort(), []);

  return <Ctx.Provider value={{ uploads, start, cancel }}>{children}</Ctx.Provider>;
}

export function useUploads() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUploads must be used inside UploadsProvider');
  return ctx;
}
