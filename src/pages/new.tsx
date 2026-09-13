import { Captions, Crop, ListChecks, ScanFace } from 'lucide-react';
import Head from 'next/head';
import { NewVideoPanel } from '@/components/new-video';
import { PageContainer } from '@/components/shell';
import { bytes } from '@/lib/format';
import { useAppConfig } from '@/lib/hooks';

export default function NewVideoPage() {
  const cfg = useAppConfig().data;
  const facts = [
    { icon: ListChecks, title: 'Ranked moments', body: 'The transcript is scanned in overlapping windows; strong moments are deduplicated, snapped to sentence boundaries and scored 0–100.' },
    { icon: ScanFace, title: 'Smart framing', body: 'Only the clip you generate is analyzed for faces, with a smoothed virtual camera and a safe fallback.' },
    { icon: Captions, title: 'Word-timed captions', body: 'Burned-in captions come from the word timings, with the spoken word highlighted as it is said.' },
    { icon: Crop, title: 'Adjust and re-render', body: 'Change start/end, framing and caption style without re-transcribing.' },
  ];
  return (
    <PageContainer>
      <Head>
        <title>New video · ClipRover</title>
      </Head>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight text-fg">New video</h1>
          <p className="text-fg-muted">Upload a long-form recording or import a YouTube link. Files go straight to secure storage.</p>
        </div>
        <NewVideoPanel />
        <section className="rounded-xl border border-outline-variant/30 bg-surface-low p-5">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-outline">File requirements</h2>
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
            <li>Formats: {(cfg?.acceptedExtensions ?? ['mp4', 'mov', 'webm']).map((x) => x.toUpperCase()).join(', ')}</li>
            <li>Maximum size: {bytes(cfg?.maxUploadBytes ?? 0)}</li>
            <li>Maximum length: {Math.round((cfg?.maxVideoDurationSec ?? 10800) / 60)} minutes</li>
            <li>Must contain an audio track with speech</li>
          </ul>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          {facts.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-fg">{title}</h3>
                <p className="mt-1 text-sm text-fg-muted">{body}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </PageContainer>
  );
}
