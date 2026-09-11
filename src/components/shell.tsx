import clsx from 'clsx';
import { Clapperboard, Film, House, LogOut, Menu, Plus, Scissors, Settings, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useLiveStatus } from '@/lib/events';
import { useMe } from '@/lib/hooks';
import { Button } from './ui';

const NAV = [
  { href: '/', label: 'Home', icon: House, exact: true },
  { href: '/videos', label: 'Videos', icon: Film },
  { href: '/clips', label: 'Clips', icon: Scissors },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary-strong via-primary to-secondary text-on-primary shadow-lg shadow-primary/20">
        <Clapperboard className="size-[18px]" aria-hidden />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-semibold tracking-tight text-fg">ClipForest</span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-outline">Creator Studio</span>
        </div>
      )}
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const me = useMe();
  const user = me.data;

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    void router.replace('/sign-in');
  };

  return (
    <div className="flex h-full flex-col justify-between gap-6 p-3">
      <div className="flex flex-col gap-6">
        <div className="px-2 pt-1">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? router.pathname === href : router.pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-xs transition-colors',
                  active ? 'border border-outline-variant/30 bg-surface-high text-primary' : 'text-fg-muted hover:bg-surface hover:text-fg',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-3">
        {user && (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-low p-3">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] text-fg">
              <Zap className="size-3.5 text-primary" aria-hidden /> Usage
            </div>
            <dl className="grid grid-cols-2 gap-2 font-mono text-[10px] text-outline">
              <div>
                <dt>Transcribed</dt>
                <dd className="tabular text-sm text-fg">{user.usage.transcribedMinutes} min</dd>
              </div>
              <div>
                <dt>Rendered</dt>
                <dd className="tabular text-sm text-fg">{Math.round(user.usage.renderedSeconds / 60)} min</dd>
              </div>
            </dl>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-high font-mono text-xs uppercase text-primary">
              {(user?.displayName || user?.email || '?').slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{user?.displayName || user?.email?.split('@')[0] || '…'}</p>
              <p className="truncate font-mono text-[10px] text-outline">{user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className="rounded p-1.5 text-outline hover:bg-surface hover:text-fg" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveIndicator() {
  const live = useLiveStatus();
  return (
    <span className="hidden items-center gap-1.5 font-mono text-[10px] text-outline sm:inline-flex" role="status" aria-live="polite">
      <span className={clsx('size-1.5 rounded-full', live === 'open' ? 'bg-tertiary' : live === 'connecting' ? 'animate-pulse bg-warning' : 'bg-outline')} />
      {live === 'open' ? 'Live updates' : live === 'connecting' ? 'Connecting…' : 'Polling for updates'}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-outline-variant/30 bg-surface-lowest lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] border-r border-outline-variant/30 bg-surface-lowest">
            <button type="button" className="absolute right-2 top-3 rounded p-1.5 text-outline hover:text-fg" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-outline-variant/30 bg-canvas/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded p-1.5 text-fg-muted hover:text-fg lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <LiveIndicator />
          </div>
          <Link href="/new" tabIndex={-1}>
            <Button variant="primary" size="sm" icon={<Plus className="size-4" />}>
              New video
            </Button>
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageContainer({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={clsx('mx-auto w-full px-4 py-6 sm:px-6 lg:py-8', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>{children}</div>;
}
