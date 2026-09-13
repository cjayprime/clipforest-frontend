import { LogOut } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PageContainer } from '@/components/shell';
import { Button, Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { bytes } from '@/lib/format';
import { useAppConfig, useMe } from '@/lib/hooks';

export default function SettingsPage() {
  const me = useMe();
  const cfg = useAppConfig().data;
  const router = useRouter();
  const user = me.data;

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    await router.replace('/sign-in');
  };

  return (
    <PageContainer>
      <Head>
        <title>Settings · ClipForest</title>
      </Head>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-medium tracking-tight text-fg">Settings</h1>
        {!user ? (
          <Spinner label="Loading account" />
        ) : (
          <>
            <Card className="space-y-5 p-5 sm:p-6">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-outline">Account</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-outline">Email</dt>
                  <dd className="break-all text-fg">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-outline">Name</dt>
                  <dd className="text-fg">{user.displayName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-outline">Plan</dt>
                  <dd className="capitalize text-fg">{user.plan}</dd>
                </div>
                <div>
                  <dt className="text-outline">Member since</dt>
                  <dd className="text-fg">{new Date(user.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
              <Button variant="secondary" icon={<LogOut className="size-4" />} onClick={() => void signOut()}>
                Sign out
              </Button>
            </Card>
            <Card className="space-y-5 p-5 sm:p-6">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-outline">Usage</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-outline">Audio transcribed</dt>
                  <dd className="tabular text-2xl font-semibold text-fg">{user.usage.transcribedMinutes} min</dd>
                </div>
                <div>
                  <dt className="text-outline">Clips rendered</dt>
                  <dd className="tabular text-2xl font-semibold text-fg">{Math.round(user.usage.renderedSeconds / 60)} min</dd>
                </div>
              </dl>
            </Card>
            <Card className="space-y-3 p-5 text-sm text-fg-muted">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-outline">Limits & data</h2>
              <p>
                Uploads up to {bytes(cfg?.maxUploadBytes)} and {Math.round((cfg?.maxVideoDurationSec ?? 0) / 60)} minutes. Clips are {Math.round((cfg?.renderMinDurationMs ?? 0) / 1000)}–
                {Math.round((cfg?.renderMaxDurationMs ?? 0) / 1000)} seconds, 1080×1920 H.264.
              </p>
              <p>Deleting a video removes its moments and clips and schedules deletion of every stored file for it.</p>
              <p className="font-mono text-[11px] text-outline">Pipeline {cfg?.pipelineVersion}</p>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}
