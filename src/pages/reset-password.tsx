import { useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type FormEvent } from 'react';
import { Logo } from '@/components/shell';
import { Button, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { ClipRoverPage } from './_app';

const ResetPasswordPage: ClipRoverPage = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Query values only exist after hydration on a statically optimized page.
  const token = router.isReady && typeof router.query.token === 'string' ? router.query.token : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/auth/reset-password', { method: 'POST', json: { token, password } });
      // Redeeming the link signs you in, so go straight to the app.
      qc.clear();
      await router.replace('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Head>
        <title>Choose a new password · ClipRover</title>
      </Head>
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-2xl bg-primary/10 blur-3xl" aria-hidden />
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link href="/" aria-label="Cliprover home">
            <Logo />
          </Link>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-low p-6 sm:p-8">
          <h1 className="text-3xl font-medium tracking-tight text-fg">Choose a new password</h1>
          {router.isReady && !token ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                This link is missing its reset token. Request a fresh one — links work only once.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary shadow-[0_3px_0_#a0bc64] hover:bg-[#dcff9b]"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Pick something you have not used here before. This signs out every other device.
              </p>
              <form onSubmit={submit} className="mt-8 space-y-5">
                <Field label="New password" hint="At least 8 characters.">
                  <input
                    className={inputClass}
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    className={inputClass}
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                {error && (
                  <p role="alert" className="rounded-lg border border-danger/30 bg-danger-strong/15 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!router.isReady}>
                  Set new password
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-sm text-fg-muted">
          <Link className="text-primary underline-offset-4 hover:underline" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

ResetPasswordPage.public = true;

export default ResetPasswordPage;
