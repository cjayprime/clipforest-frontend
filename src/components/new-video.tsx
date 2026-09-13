import clsx from 'clsx';
import { CircleCheck, CirclePlay, CloudUpload, Link2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/router';
import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { api, errorMessage } from '@/lib/api';
import { bytes } from '@/lib/format';
import { useAppConfig, useInvalidate } from '@/lib/hooks';
import type { Video } from '@/lib/types';
import { useUploads } from './uploads';
import { Button, inputClass } from './ui';

/** New Video (PRD §21.1): URL import or direct upload, rights confirmation, file requirements. */
export function NewVideoPanel() {
  const router = useRouter();
  const cfg = useAppConfig().data;
  const { start } = useUploads();
  const invalidate = useInvalidate();
  const [url, setUrl] = useState('');
  const [rights, setRights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'url' | 'file' | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const extensions = cfg?.acceptedExtensions ?? ['mp4', 'mov', 'webm', 'm4v', 'mkv'];
  const maxBytes = cfg?.maxUploadBytes ?? 5 * 1024 ** 3;
  const maxHours = Math.round(((cfg?.maxVideoDurationSec ?? 10800) / 3600) * 10) / 10;

  const requireRights = () => {
    if (rights) return true;
    setError('Please confirm that you own or are authorized to process this content.');
    return false;
  };

  const importUrl = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim() || !requireRights()) return;
    setBusy('url');
    try {
      const v = await api<Video>('/videos', { method: 'POST', json: { sourceType: 'url', sourceUrl: url.trim(), rightsConfirmed: true } });
      await invalidate(['videos']);
      await router.push(`/videos/${v.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!extensions.includes(ext)) return setError(`Unsupported file type. Use ${extensions.map((x) => x.toUpperCase()).join(', ')}.`);
    if (file.size > maxBytes) return setError(`That file is ${bytes(file.size)}; the limit is ${bytes(maxBytes)}.`);
    if (!requireRights()) return;
    setBusy('file');
    try {
      const v = await api<Video>('/videos', {
        method: 'POST',
        json: { sourceType: 'upload', originalFilename: file.name, contentType: file.type, sizeBytes: file.size, rightsConfirmed: true },
      });
      start(v.id, file);
      await invalidate(['videos']);
      await router.push(`/videos/${v.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <section aria-label="Add a video" className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 shadow-2xl sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/5 blur-3xl" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <form onSubmit={importUrl} className="flex flex-col justify-between gap-5">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
              <Link2 className="size-5 text-primary" aria-hidden /> Paste a video URL
            </h2>
            <p className="text-xs text-outline">A public YouTube link, e.g. youtube.com/watch?v=… or youtu.be/…</p>
          </div>
          <div className="relative flex items-center">
            <CirclePlay className="pointer-events-none absolute left-3 size-[18px] text-outline" aria-hidden />
            <label htmlFor="source-url" className="sr-only">
              Video URL
            </label>
            <input
              id="source-url"
              type="url"
              inputMode="url"
              placeholder="https://youtube.com/watch?v=…"
              className={clsx(inputClass, 'h-11 pl-10 pr-32')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" size="sm" className="absolute right-1.5" loading={busy === 'url'} disabled={!url.trim() || busy !== null}>
              Import video
            </Button>
          </div>
          <p className="flex items-center gap-2 font-mono text-[11px] text-outline">
            <CircleCheck className="size-3.5 text-tertiary" aria-hidden />
            Transcribes speech, finds and ranks moments, then renders 9:16 clips on demand.
          </p>
        </form>

        <div className="relative flex items-center justify-center lg:flex-col" aria-hidden>
          <div className="h-px w-full bg-outline-variant/30 lg:h-full lg:w-px" />
          <span className="absolute rounded-full border border-outline-variant/40 bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-outline">or</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={clsx(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            dragOver ? 'border-primary/70 bg-primary/5' : 'border-outline-variant/40 bg-surface/30',
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-surface-high text-primary">
            <CloudUpload className="size-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-fg">
              Drop a video here or{' '}
              <button type="button" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary" onClick={() => fileRef.current?.click()}>
                browse files
              </button>
            </p>
            <p className="font-mono text-[11px] text-outline">
              {extensions.map((x) => x.toUpperCase()).join(', ')} · up to {bytes(maxBytes)} · {maxHours} h max
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept={extensions.map((x) => `.${x}`).join(',') + ',video/*'}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void uploadFile(f);
            }}
            aria-label="Choose a video file"
          />
          {busy === 'file' && <p className="font-mono text-[11px] text-primary">Starting upload…</p>}
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-3 border-t border-outline-variant/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg-muted">
          <input type="checkbox" className="mt-0.5 size-4 accent-[#8083ff]" checked={rights} onChange={(e) => setRights(e.target.checked)} />
          <span>
            <ShieldCheck className="mr-1 inline size-4 text-tertiary" aria-hidden />I own this content or am authorized to process it.
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
