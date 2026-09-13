import Head from 'next/head';
import { useState } from 'react';
import { PageContainer } from '@/components/shell';
import { Segmented } from '@/components/ui';
import { VideoGrid } from '@/components/video-card';
import { useVideos } from '@/lib/hooks';

type Filter = 'all' | 'processing' | 'ready' | 'failed';

export default function VideosPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const videos = useVideos(filter);
  return (
    <PageContainer>
      <Head>
        <title>Videos · ClipRover</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-fg">Videos</h1>
            <p className="mt-1 text-sm text-fg-muted">Every source you’ve added, with its processing status.</p>
          </div>
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
        </div>
        <VideoGrid videos={videos.data} loading={videos.isLoading} />
      </div>
    </PageContainer>
  );
}
