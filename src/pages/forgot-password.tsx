import Head from 'next/head';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Logo } from '@/components/shell';
import { Button, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { ClipRoverPage } from './_app';

const ForgotPasswordPage: ClipRoverPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/auth/forgot-password', { method: 'POST', json: { email } });
      // The API answers the same way whether or not the address has an account,
      // so this screen must not imply one exists.
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Head>
        <title>Reset your password · ClipRover</title>
      </Head>
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-2xl bg-primary/10 blur-3xl" aria-hidden />
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link href="/" aria-label="Cliprover home">
            <Logo />
          </Link>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-low p-6 sm:p-8">
          {sent ? (
            <div role="status">
              <h1 className="text-3xl font-medium tracking-tight text-fg">Check your inbox</h1>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                If an account exists for <span className="text-fg">{email}</span>, we have sent a link to reset its
                password. The link works once and expires in an hour.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Nothing arrived? Check your spam folder, or{' '}
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => setSent(false)}
                >
                  try another address
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-medium tracking-tight text-fg">Reset your password</h1>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Enter the email you signed up with and we will send you a link to choose a new password.
              </p>
              <form onSubmit={submit} className="mt-8 space-y-5">
                <Field label="Email">
                  <input
                    className={inputClass}
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                {error && (
                  <p role="alert" className="rounded-lg border border-danger/30 bg-danger-strong/15 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
                  Send reset link
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

ForgotPasswordPage.public = true;

export default ForgotPasswordPage;
