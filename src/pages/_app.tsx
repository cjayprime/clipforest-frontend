import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { Geist, JetBrains_Mono } from 'next/font/google';
import Head from 'next/head';
import Router from 'next/router';
import { useState } from 'react';
import { AppShell } from '@/components/shell';
import { UploadsProvider } from '@/components/uploads';
import { ApiError } from '@/lib/api';
import { LiveEventsProvider } from '@/lib/events';
import '@/styles/globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] });

/** Pages opt out of the authenticated app shell with `Page.public = true`. */
export type ClipRoverPage<P = object> = NextPage<P> & { public?: boolean };

function handleAuthError(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/sign-in') || path.startsWith('/register')) return;
    // Clear a stale session cookie, then go to sign-in (the proxy only checks cookie presence).
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      void Router.replace({ pathname: '/sign-in', query: { next: path + window.location.search } });
    });
  }
}

export default function App({ Component, pageProps }: AppProps & { Component: ClipRoverPage }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleAuthError }),
        mutationCache: new MutationCache({ onError: handleAuthError }),
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
          },
        },
      }),
  );

  const page = <Component {...pageProps} />;
  return (
    <QueryClientProvider client={client}>
      <Head>
        <title>ClipRover</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${geist.variable} ${mono.variable} min-h-screen font-sans`}>
        {Component.public ? (
          page
        ) : (
          // Providers stay mounted across page changes, so uploads and the live stream persist.
          <LiveEventsProvider>
            <UploadsProvider>
              <AppShell>{page}</AppShell>
            </UploadsProvider>
          </LiveEventsProvider>
        )}
      </div>
    </QueryClientProvider>
  );
}
