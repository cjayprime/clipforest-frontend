import { api } from './api';
import type { Video } from './types';

/**
 * Direct-to-storage upload (PRD FR-ING-001). The file goes straight from the
 * browser to R2 via short-lived signed URLs; the API only signs and verifies.
 * Large files use multipart with parallel parts, per-part retries and on-demand
 * URL signing so multi-GB uploads survive URL expiry.
 */

type SingleSession = { mode: 'single'; url: string; headers: Record<string, string> };
type MultipartSession = {
  mode: 'multipart';
  uploadId: string;
  partSize: number;
  partCount: number;
  parts: { partNumber: number; url: string }[];
};
type Session = SingleSession | MultipartSession;

export interface UploadProgress {
  loaded: number;
  total: number;
}

function put(url: string, body: Blob, headers: Record<string, string>, onProgress: (loaded: number) => void, signal?: AbortSignal) {
  return new Promise<string | null>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.getResponseHeader('ETag')) : reject(new Error(`Storage returned ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4, signal?: AbortSignal): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if ((err as Error).name === 'AbortError' || signal?.aborted) throw err;
      last = err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
  throw last;
}

export async function uploadFile(
  videoId: string,
  file: File,
  onProgress: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<Video> {
  const session = await api<Session>(`/videos/${videoId}/upload-session`, { method: 'POST' });

  if (session.mode === 'single') {
    await withRetry(() => put(session.url, file, session.headers, (loaded) => onProgress({ loaded, total: file.size }), signal), 4, signal);
    onProgress({ loaded: file.size, total: file.size });
    return api<Video>(`/videos/${videoId}/upload-complete`, { method: 'POST', json: { observedSizeBytes: file.size } });
  }

  const urls = new Map(session.parts.map((p) => [p.partNumber, p.url]));
  const loadedByPart = new Map<number, number>();
  const report = () => onProgress({ loaded: [...loadedByPart.values()].reduce((a, b) => a + b, 0), total: file.size });
  const completed: { partNumber: number; etag: string }[] = [];
  const queue = Array.from({ length: session.partCount }, (_, i) => i + 1);

  const urlFor = async (partNumber: number, fresh = false) => {
    if (!fresh && urls.has(partNumber)) return urls.get(partNumber)!;
    const batch = queue.filter((n) => n >= partNumber).slice(0, 20);
    const signed = await api<{ parts: { partNumber: number; url: string }[] }>(`/videos/${videoId}/upload-session/parts`, {
      method: 'POST',
      json: { partNumbers: [partNumber, ...batch.filter((n) => n !== partNumber)] },
    });
    for (const p of signed.parts) urls.set(p.partNumber, p.url);
    return urls.get(partNumber)!;
  };

  let next = 0;
  const worker = async () => {
    while (next < queue.length) {
      const partNumber = queue[next++];
      const start = (partNumber - 1) * session.partSize;
      const blob = file.slice(start, Math.min(file.size, start + session.partSize));
      let attempt = 0;
      const etag = await withRetry(
        async () => {
          const url = await urlFor(partNumber, attempt++ > 0);
          return put(url, blob, {}, (loaded) => {
            loadedByPart.set(partNumber, loaded);
            report();
          }, signal);
        },
        4,
        signal,
      );
      if (!etag) throw new Error('Storage did not return an ETag. Check the bucket CORS ExposeHeaders setting.');
      loadedByPart.set(partNumber, blob.size);
      report();
      completed.push({ partNumber, etag });
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, session.partCount) }, worker));
  return api<Video>(`/videos/${videoId}/upload-complete`, {
    method: 'POST',
    json: { parts: completed.sort((a, b) => a.partNumber - b.partNumber), observedSizeBytes: file.size },
  });
}
