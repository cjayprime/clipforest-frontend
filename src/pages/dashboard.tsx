import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { NewVideoPanel } from '@/components/new-video';
import { PageContainer } from '@/components/shell';
import { Segmented } from '@/components/ui';
import { VideoGrid } from '@/components/video-card';
import { useVideos } from '@/lib/hooks';

type Filter = 'all' | 'processing' | 'ready' | 'failed';

export default function Dashboard() {
  const [filter, setFilter] = useState<Filter>('all');
  const videos = useVideos(filter);

  return (
    <PageContainer>
      <Head>
        <title>Dashboard · ClipRover</title>
      </Head>
      <div className="flex flex-col gap-10">
        <section className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-high px-2.5 py-1 font-mono text-[11px]">
            <span className="size-2 rounded-full bg-tertiary" aria-hidden />
            <span className="text-tertiary">Your creator studio</span>
          </span>
          <h1 className="text-3xl font-medium tracking-tight text-fg sm:text-4xl">Create clips people want to watch</h1>
          <p className="max-w-2xl text-base text-fg-muted">Turn long videos into ranked, captioned Shorts, Reels and TikToks — without scrubbing through the whole recording.</p>
        </section>

        <NewVideoPanel />

        <section className="space-y-5" aria-labelledby="recent-heading">
          <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/20 pb-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="recent-heading" className="text-xl font-semibold text-fg">
                Recent videos
              </h2>
              <span className="rounded-full bg-surface-high px-2 py-0.5 font-mono text-[11px] text-outline">{videos.data?.length ?? 0} total</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label="Filter videos"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'ready', label: 'Ready' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
              <Link href="/videos" className="font-mono text-[11px] text-primary hover:underline">
                View all
              </Link>
            </div>
          </div>
          <VideoGrid videos={videos.data} loading={videos.isLoading} limit={8} />
        </section>
      </div>
    </PageContainer>
  );
}
