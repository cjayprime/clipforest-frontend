import { ArrowRight, Check, ChevronDown, Scissors, Sparkles } from 'lucide-react';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';
import { MarketingFooter, MarketingHeader, useMarketingSession } from '@/components/marketing';
import type { ClipForestPage } from './_app';
import base from '@/styles/landing.module.css';
import styles from '@/styles/pricing.module.css';

// Credits are monthly allowances; annual prices are billed as one yearly payment.
const plans = [
  { name: 'Starter', annual: 10, monthly: 15, credits: 100, description: 'Find your first great moment.', featured: false },
  { name: 'Creator', annual: 25, monthly: 35, credits: 300, description: 'Give every episode a second life.', featured: true },
  { name: 'Studio', annual: 75, monthly: 99, credits: 1000, description: 'For a calendar full of content.', featured: false },
];
const common = ['AI-ranked moments', 'Word-timed captions · 4 styles', 'Automatic, center & fit framing', '1080 × 1920 MP4 downloads', 'Manual ranges & render versions'];
const Pricing: ClipForestPage = () => {
  const session = useMarketingSession();
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const destination = session.data ? '/dashboard' : '/register';
  return (
    <div className={base.page}>
      <Head><title>Pricing · ClipForest</title><meta name="description" content="Choose a ClipForest plan with 100, 300, or 1,000 monthly credits. Annual plans start at $10 per month, billed yearly." /></Head>
      <a className={base.skip} href="#pricing-main">Skip to content</a>
      <MarketingHeader session={session} pricing />
      <main id="pricing-main" className={styles.main}>
        <section className={styles.intro}>
          <span className={base.eyebrow}><span /> MORE MOMENTS. YOUR OWN PACE.</span>
          <h1>A little less editing.<br /><em>A lot more creating.</em></h1>
          <p>From your first clip to your next big series.<br />Find the room your ideas need.</p>
          <div className={styles.billing} role="group" aria-label="Billing period">
            <button type="button" aria-pressed={billing === 'monthly'} onClick={() => setBilling('monthly')}>Monthly</button>
            <button type="button" aria-pressed={billing === 'annual'} onClick={() => setBilling('annual')}>Annually <span>Save up to 33%</span></button>
          </div>
          <p className={styles.billingNote}>All prices in USD. Credits are allocated monthly on either billing option.</p>
        </section>
        <section className={styles.plans} aria-label="ClipForest plans">
          {plans.map(plan => <article className={`${styles.plan} ${plan.featured ? styles.featured : ''}`} key={plan.name}>
            {plan.featured && <div className={styles.ribbon}>FOR YOUR CREATIVE RHYTHM</div>}
            <span className={styles.planLabel}>{plan.name.toUpperCase()}</span>
            <h2>{plan.description}</h2>
            <div className={styles.price}><span>${plan[billing]}</span><span>USD / month</span></div>
            <p className={styles.billed}>{billing === 'annual' ? `$${plan.annual * 12} billed yearly · save $${(plan.monthly - plan.annual) * 12}/year` : `$${plan.monthly} billed monthly`}</p>
            <p className={styles.allowance}><strong>{plan.credits.toLocaleString('en-US')} credits</strong> every month</p>
            <Link href={destination} className={plan.featured ? base.primaryButton : styles.outlineButton}>{session.data ? 'Open dashboard' : 'Get started'}<ArrowRight size={16} /></Link>
            <p className={styles.ctaNote}>Create an account · billing coming soon</p>
            <ul>{[`${plan.credits.toLocaleString('en-US')} monthly credits`, 'AI moment discovery', 'Captioned 1080p exports', 'Smart vertical framing', 'Manual edits & render versions'].map(feature => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
          </article>)}
        </section>
        <div className={styles.notice}><Sparkles size={16} /><span><strong>Subscriptions are coming soon.</strong> You can create an account now. The buttons above do not activate a paid plan or charge you.</span></div>
        <section className={styles.compare}>
          <div className={styles.sectionHeading}><span className={base.eyebrow}>THE GOOD STUFF COMES STANDARD</span><h2>Same creative toolkit.<br />More room to make.</h2><p>Every plan includes the essentials. Choose the monthly credit allowance that fits your workflow.</p></div>
          <div className={styles.tableWrap}><table><caption className={styles.srOnly}>ClipForest plan comparison</caption><thead><tr><th scope="col">What’s included</th>{plans.map(p => <th key={p.name} scope="col">{p.name}</th>)}</tr></thead><tbody><tr><th scope="row">Credits / month</th>{plans.map(p => <td key={p.name}>{p.credits.toLocaleString('en-US')}</td>)}</tr>{common.map(feature => <tr key={feature}><th scope="row">{feature}</th>{plans.map(p => <td key={p.name}><Check size={17} aria-label="Included" /></td>)}</tr>)}</tbody></table></div>
        </section>
        <section className={styles.faq} aria-labelledby="pricing-faq">
          <div><span className={base.eyebrow}>GOOD QUESTIONS</span><h2 id="pricing-faq">Before you<br />make the cut.</h2></div>
          <div className={base.questions}>{[
            ['Can I buy a plan now?', 'Paid subscriptions are coming soon. Get started creates a regular ClipForest account; it does not purchase, activate, or charge for a plan.'],
            ['How does annual billing work?', 'Annual billing is one payment for the year: $120 for Starter, $300 for Creator, or $900 for Studio. The displayed $10, $25, and $75 rates are the monthly equivalents. Each plan still provides its listed credit allowance every month.'],
            ['What does a credit cover?', 'Credits will measure processing usage. The credit cost of each operation and any rollover rules will be published before paid subscriptions launch. A credit should not yet be interpreted as a minute of video or one exported clip.'],
            ['Does rerendering transcribe the video again?', 'No. Adjusting timing, framing, or captions uses the saved transcript and creates a new render version. Re-analysis also reuses the transcript to find a new set of moments.'],
            ['Do I need a different plan for captions or vertical video?', 'All three plans include the same core editing toolkit: word-timed captions, vertical framing, manual adjustments, and MP4 exports. The main difference is the monthly credit allowance.'],
          ].map(([q,a]) => <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>)}</div>
        </section>
        <section className={styles.bottom}><Scissors size={25} /><h2>Your next clip starts<br />with what you already have.</h2><p>Bring the long version. Find the part worth sharing.</p><Link href={destination} className={base.primaryButton}>{session.data ? 'Go to dashboard' : 'Start creating'}<ArrowRight size={18} /></Link></section>
      </main>
      <MarketingFooter />
    </div>
  );
};
Pricing.public = true;
export default Pricing;
