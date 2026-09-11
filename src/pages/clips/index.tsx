import { Scissors } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { PageContainer } from '@/components/shell';
import { EmptyState, RenderStatusBadge, Segmented, Spinner } from '@/components/ui';
import { durationLabel, relativeTime, RENDER_ACTIVE } from '@/lib/format';
import { useRenders } from '@/lib/hooks';

type Filter = 'latest' | 'all' | 'active';

export default function ClipsPage() {
  const renders = useRenders();
  const [filter, setFilter] = useState<Filter>('latest');
  const items = (renders.data ?? []).filter((r) => (filter === 'latest' ? r.isLatest : filter === 'active' ? RENDER_ACTIVE.includes(r.status) : true));

  return (
    <PageContainer>
      <Head>
        <title>Clips · ClipForest</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">Clips</h1>
            <p className="mt-1 text-sm text-fg-muted">Rendered 9:16 clips across all your videos.</p>
          </div>
          <Segmented
            label="Filter clips"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'latest', label: 'Latest versions' },
              { value: 'active', label: 'Rendering' },
              { value: 'all', label: 'All versions' },
            ]}
          />
        </div>
        {renders.isLoading ? (
          <Spinner label="Loading clips" />
        ) : items.length === 0 ? (
          <EmptyState icon={<Scissors className="size-5" />} title="No clips yet" action={<Link href="/videos" className="text-sm text-primary hover:underline">Pick a moment to clip</Link>}>
            Open a processed video and choose Generate clip on any moment.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((r) => (
              <Link key={r.id} href={`/clips/${r.id}`} className="group flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-lowest p-2 transition-colors hover:border-outline">
                <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-surface">
                  {r.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnailUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Scissors className="size-6 text-outline-variant" aria-hidden />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded bg-surface-lowest/80 px-1.5 py-0.5 font-mono text-[10px] text-fg backdrop-blur">
                    {durationLabel(r.durationMs ?? r.endMs - r.startMs)}
                  </span>
                  <span className="absolute left-2 top-2 rounded bg-surface-lowest/80 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted backdrop-blur">v{r.version}</span>
                </div>
                <div className="space-y-1 px-1 pb-1">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-fg">{r.title}</h3>
                  <p className="truncate font-mono text-[10px] text-outline">{r.videoTitle}</p>
                  <div className="flex items-center justify-between gap-2">
                    <RenderStatusBadge status={r.status} progress={r.progress} />
                    <span className="font-mono text-[10px] text-outline">{relativeTime(r.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
