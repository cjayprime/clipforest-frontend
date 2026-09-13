import { useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '@/lib/api';
import { Logo } from './shell';
import { Button, Field, inputClass } from './ui';

export function AuthForm({ mode }: { mode: 'sign-in' | 'register' }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Query values are only available after hydration on statically optimized pages;
  // reading them before `isReady` makes the server and client markup disagree.
  const next = router.isReady && typeof router.query.next === 'string' ? router.query.next : null;
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(mode === 'sign-in' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        json: mode === 'sign-in' ? { email, password } : { email, password, displayName: displayName || undefined },
      });
      qc.clear();
      await router.replace(target);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Head>
        <title>{mode === 'sign-in' ? 'Sign in · ClipRover' : 'Create account · ClipRover'}</title>
      </Head>
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-2xl bg-primary/10 blur-3xl" aria-hidden />
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link href="/" aria-label="Cliprover home"><Logo /></Link>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-low p-6 sm:p-8">
          <h1 className="text-3xl font-medium tracking-tight text-fg">{mode === 'sign-in' ? 'Sign in' : 'Create your account'}</h1>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            {mode === 'sign-in' ? 'Welcome back. Your clips are waiting.' : 'Turn long videos into ranked, ready-to-post shorts.'}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === 'register' && (
              <Field label="Name (optional)">
                <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" maxLength={80} />
              </Field>
            )}
            <Field label="Email">
              <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <div className="space-y-2">
              <Field label="Password" hint={mode === 'register' ? 'At least 8 characters.' : undefined}>
                <input
                  className={inputClass}
                  type="password"
                  required
                  minLength={mode === 'register' ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                />
              </Field>
              {/* Outside the Field: an anchor inside its <label> would also focus the input. */}
              {mode === 'sign-in' && (
                <div className="text-right">
                  <Link className="text-xs text-fg-muted underline-offset-4 hover:text-primary hover:underline" href="/forgot-password">
                    Forgot your password?
                  </Link>
                </div>
              )}
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-danger/30 bg-danger-strong/15 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-fg-muted">
          {mode === 'sign-in' ? (
            <>
              New here?{' '}
              <Link className="text-primary underline-offset-4 hover:underline" href={{ pathname: '/register', query: next ? { next } : {} }}>
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link className="text-primary underline-offset-4 hover:underline" href="/sign-in">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
