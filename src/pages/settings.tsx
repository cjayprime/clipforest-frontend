import { Check, CheckCircle2, Clock, ExternalLink, LoaderCircle, LogOut, Sparkles } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { keys, useAppConfig, useBalance, useCheckoutStatus, useMe, useOpenPortal, useStartCheckout } from '@/lib/hooks';
import { Badge, Button, Card, Field, inputClass, Spinner } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PageContainer } from '@/components/shell';
import { bytes } from '@/lib/format';

type PaidPlan = 'starter' | 'creator' | 'studio';

/** Credit balance (total, rollover, expiring), plan, and checkout or portal actions. */
function CreditsCard() {
  const balance = useBalance();
  const billingEnabled = useAppConfig().data?.billingEnabled ?? false;
  const checkout = useStartCheckout();
  const portal = useOpenPortal();
  const [error, setError] = useState<string | null>(null);

  // Checkout and the customer portal are Polar-hosted pages. assign() because the
  // react-hooks immutability rule rejects assigning `location.href`.
  const go = (url: string) => {
    window.location.assign(url);
  };

  const start = (plan: PaidPlan) => {
    setError(null);
    // Settings offers monthly; the annual choice lives on the pricing page.
    checkout.mutate({ plan, interval: 'month' }, { onSuccess: (r) => go(r.url), onError: (e) => setError(errorMessage(e)) });
  };

  const manage = () => {
    setError(null);
    portal.mutate(undefined, { onSuccess: (r) => go(r.url), onError: (e) => setError(errorMessage(e)) });
  };

  if (balance.isPending) {
    return (
      <Card className="p-5 sm:p-6">
        <Spinner label="Loading credits" />
      </Card>
    );
  }
  if (!balance.data) return null;

  const { credits, rolloverShare, plan, subscription, plans } = balance.data;
  const rolloverPercent = Math.round(rolloverShare * 100);

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-outline">Credits &amp; plan</h2>
        <Badge tone={plan === 'free' ? 'muted' : 'primary'}>{plan === 'free' ? 'Free' : plan}</Badge>
      </div>

      <div>
        <p className="tabular text-3xl font-semibold text-fg">{credits.total.toLocaleString('en-US')}</p>
        <p className="text-sm text-fg-muted">credits available</p>
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-outline">Rolls over</dt>
          <dd className="tabular text-lg text-fg">{credits.rollover.toLocaleString('en-US')}</dd>
          <dd className="text-xs text-outline">Kept when the month ends.</dd>
        </div>
        <div>
          <dt className="text-outline">Expires this period</dt>
          <dd className="tabular text-lg text-fg">{credits.expiring.toLocaleString('en-US')}</dd>
          <dd className="text-xs text-outline">Replaced at your next renewal.</dd>
        </div>
      </dl>

      <p className="text-xs text-outline">
        Each month {rolloverPercent}% of your allowance rolls over and the remaining {100 - rolloverPercent}% is
        use-it-or-lose-it. Expiring credits are always spent first.
      </p>

      {subscription && (
        <p className="text-sm text-fg-muted">
          {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
          {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'soon'}
          {subscription.status !== 'active' && ` · ${subscription.status}`}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-strong/15 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!billingEnabled ? (
        <p className="text-sm text-fg-muted">Paid plans are not switched on yet.</p>
      ) : subscription ? (
        <Button variant="secondary" onClick={manage} loading={portal.isPending} icon={<ExternalLink className="size-4" />}>
          Manage subscription
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {plans.map((p) => (
            <Button
              key={p.id}
              variant={p.id === 'creator' ? 'primary' : 'secondary'}
              onClick={() => { start(p.id as PaidPlan); }}
              loading={checkout.isPending && checkout.variables.plan === p.id}
              icon={<Sparkles className="size-4" />}
            >
              {p.name} · {p.monthlyCredits.toLocaleString('en-US')}/mo
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}

/** After this long without confirmation, polling stops and the slow message shows. */
const SLOW_AFTER_MS = 2 * 60_000;

/**
 * Shown on /settings?checkout=<id> after Polar sends the customer back: pending
 * until the server reports the checkout credited, then confirmed.
 */
function CheckoutReturnNotice({ checkoutId, onDismiss }: { checkoutId: string; onDismiss: () => void }) {
  const qc = useQueryClient();
  const [slow, setSlow] = useState(false);
  const status = useCheckoutStatus(checkoutId, !slow);
  const credited = status.data?.status === 'credited';

  useEffect(() => {
    const timer = setTimeout(() => {
      setSlow(true);
    }, SLOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Refresh the balance as soon as polling sees the credit, with or without SSE.
  useEffect(() => {
    if (credited) void qc.invalidateQueries({ queryKey: keys.balance });
  }, [credited, qc]);

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
      <div role="status" aria-live="polite" className="flex min-w-0 items-start gap-3">
        {credited ? (
          <>
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-fg">
              <span className="font-medium">Payment confirmed.</span> Your credits are in your balance.
            </p>
          </>
        ) : slow ? (
          <>
            <Clock className="mt-0.5 size-5 shrink-0 text-outline" aria-hidden />
            <p className="text-sm text-fg-muted">
              <span className="font-medium text-fg">Still waiting for Polar to confirm your payment.</span> Your credits
              are added the moment it does — you can safely leave this page.
            </p>
          </>
        ) : (
          <>
            {/* Not <Spinner>: that is a full-panel placeholder with its own status role. */}
            <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin text-outline" aria-hidden />
            <p className="text-sm text-fg-muted">
              <span className="font-medium text-fg">Payment received.</span> Adding your credits — this usually takes a
              few seconds.
            </p>
          </>
        )}
      </div>
      <Button variant="secondary" onClick={onDismiss}>
        Dismiss
      </Button>
    </Card>
  );
}

/**
 * Change password from Settings. The API requires the current password and
 * signs out every other device; this one keeps its session via a fresh cookie.
 */
function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await api('/auth/change-password', { method: 'POST', json: { currentPassword, newPassword } });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-outline">Password</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Changing your password signs out every other device. We will email you to confirm.
        </p>
      </div>
      <form onSubmit={submit} className="max-w-sm space-y-4">
        <Field label="Current password">
          <input
            className={inputClass}
            type="password"
            required
            maxLength={128}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <input
            className={inputClass}
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
        {done && (
          <p role="status" className="inline-flex items-center gap-2 rounded-lg border border-tertiary/30 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">
            <Check className="size-4" aria-hidden />
            Password updated.
          </p>
        )}
        <Button type="submit" variant="primary" loading={busy}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const me = useMe();
  const cfg = useAppConfig().data;
  const router = useRouter();
  const user = me.data;
  // Polar sends the customer back to /settings?checkout=<id> after paying.
  const checkoutId = typeof router.query.checkout === 'string' ? router.query.checkout : null;

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    await router.replace('/sign-in');
  };

  return (
    <PageContainer>
      <Head>
        <title>Settings · ClipRover</title>
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
            {checkoutId && (
              <CheckoutReturnNotice
                checkoutId={checkoutId}
                // Drops the query so a refresh or a shared link doesn't show it again.
                onDismiss={() => void router.replace('/settings', undefined, { shallow: true })}
              />
            )}
            <CreditsCard />
            <ChangePasswordCard />
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
                {Math.round((cfg?.renderMaxDurationMs ?? 0) / 1000)} seconds, H.264 in 9:16, 4:5, 1:1 or 16:9 (up to 1920 px).
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
