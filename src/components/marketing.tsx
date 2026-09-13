import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import styles from '@/styles/landing.module.css';

export function useMarketingSession() {
  // An anonymous session is expected on this public page, not an auth redirect.
  return useQuery({
    queryKey: ['landing-session'],
    queryFn: async () => {
      try { return (await api<{ user: User }>('/auth/me')).user; }
      catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
    },
    retry: false,
    meta: { publicPage: true },
  });
}

export function MarketingHeader({ session, pricing = false }: { session: ReturnType<typeof useMarketingSession>; pricing?: boolean }) {
  return (
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.logo} aria-label="ClipRover home"><span><Clapperboard size={21} /></span>cliprover<span className={styles.logoDot}>.</span></Link>
          <div className={styles.navLinks}><Link href="/#how-it-works">How it works</Link><Link href="/#features">The toolkit</Link><Link href="/pricing" aria-current={pricing ? 'page' : undefined}>Pricing</Link><Link href="/#faq">FAQs</Link></div>
          <div className={styles.navActions} aria-busy={session.isPending}>
            {session.isPending ? <span className={styles.navPlaceholder} aria-label="Checking session" /> : session.data ? <Link className={styles.smallButton} href="/dashboard">Dashboard <ArrowRight size={15} /></Link> : <><Link className={styles.login} href="/sign-in">Log in</Link><Link className={styles.smallButton} href="/register">Get started <ArrowRight size={15} /></Link></>}
          </div>
        </nav>
      </header>
  );
}

export function MarketingFooter() {
  return (
      <footer className={styles.footer}><Link href="/" className={styles.logo}><span><Clapperboard size={19} /></span>cliprover<span className={styles.logoDot}>.</span></Link><nav aria-label="Footer navigation"><Link href="/pricing">Pricing</Link></nav><small>© {new Date().getFullYear()} ClipRover</small></footer>
  );
}
