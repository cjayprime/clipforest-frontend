import { ArrowDown, ArrowRight, AudioLines, Captions, Check, ChevronDown, Crop, Film, MoveUpRight, Play, Scissors, Sparkles, Upload } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { MarketingHeader, MarketingFooter, useMarketingSession } from '@/components/marketing';
import type { ClipRoverPage } from './_app';
import styles from '@/styles/landing.module.css';

const moments = [
  { title: 'The idea that changed everything', time: '02:14 – 02:52', score: 92 },
  { title: 'Start before you feel ready', time: '08:06 – 08:41', score: 88 },
  { title: 'Make something worth sharing', time: '14:32 – 15:10', score: 85 },
];
const faqs = [
  ['What kind of videos can I use?', 'Upload an MP4, MOV, WebM, M4V, or MKV, or paste a supported YouTube link. Videos with spoken content—podcasts, interviews, tutorials, and conversations—give the AI the most to work with. Only use content you own or have permission to process.'],
  ['How does ClipRover choose the moments?', 'ClipRover transcribes your video and analyzes the spoken words for hooks, clear ideas, stories, and natural endings. Suggested moments are ranked to help you decide where to start. Scores are editorial guidance, not a guarantee of views.'],
  ['Can I change a suggested clip?', 'Yes. Adjust the start and end, choose automatic framing, a center crop, or a full-frame fit, and pick a caption style. Each rerender saves a new version, so you can keep your earlier edits.'],
  ['What do I get when I export?', 'A downloadable MP4 in 9:16, 4:5, 1:1 or 16:9, with captions burned in if you enable them. It is ready for YouTube Shorts, Instagram Reels, TikTok or a regular feed.'],
];

const Landing: ClipRoverPage = () => {
  const session = useMarketingSession();
  const destination = session.data ? '/dashboard' : '/register';
  return (
    <div className={styles.page}>
      <Head>
        <title>ClipRover — Your next great clip is already in there</title>
        <meta name="description" content="Turn long videos into standout short clips. Find the best spoken moments with AI, add captions, reframe for vertical, and export with ClipRover." />
        <meta property="og:title" content="ClipRover — Long videos. Short-form potential." />
        <meta property="og:description" content="Find the moments worth sharing. Turn your long videos into captioned, vertical clips with AI." />
      </Head>
      <a className={styles.skip} href="#main">Skip to content</a>
      <MarketingHeader session={session} />
      <main id="main">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><span /> LESS SCRUBBING. MORE CREATING.</div>
            <h1>Your next great clip<br />is already <em>in there.</em></h1>
            <p>You made the long video. Let AI find the moments worth sharing—and turn them into captioned, ready-to-post clips.</p>
            <div className={styles.heroActions}><Link className={styles.primaryButton} href={destination}>Find my best moments <ArrowRight size={18} /></Link><a className={styles.textButton} href="#how-it-works"><span><Play size={12} fill="currentColor" /></span> See how it works</a></div>
            <div className={styles.heroNotes}><span><Check size={14} /> YouTube links or uploads</span><span><Check size={14} /> Your edit. Your final say.</span></div>
          </div>
          <div className={styles.studio} aria-label="Illustrative preview of ClipRover finding moments and creating a vertical clip">
            <div className={styles.studioTop}><span><span className={styles.statusDot} /> THE CREATOR’S CUT</span><span>STUDIO PREVIEW <MoveUpRight size={12} /></span></div>
            <div className={styles.studioBody}>
              <div className={styles.sourceColumn}>
                <div className={styles.sourceScreen}><span className={styles.screenLabel}><Film size={12} /> YOUR LONG-FORM VIDEO</span><div className={styles.orbit} /><AudioLines className={styles.audioArt} strokeWidth={1} /><div className={styles.sourceTitle}>A conversation<br />worth <i>keeping.</i></div><div className={styles.playerBar}><Play size={11} fill="currentColor" /><span /><small>24:08</small></div></div>
                <div className={styles.momentsHeader}><span><Sparkles size={13} /> Moments worth sharing</span><small>AI PICKS</small></div>
                <div className={styles.moments}>{moments.map((m, i) => <div key={m.title} className={styles.moment}><span className={styles.momentNumber}>0{i + 1}</span><div><strong>{m.title}</strong><small>{m.time}</small></div><span className={styles.score}>{m.score}<small>/100</small></span></div>)}</div>
              </div>
              <div className={styles.clipColumn}><div className={styles.clipTop}><span><Scissors size={12} /> THE SHORT CUT</span><span>9:16</span></div><div className={styles.verticalClip}><div className={styles.clipOrbit} /><AudioLines className={styles.clipArt} strokeWidth={1.1} /><span className={styles.clipEpisode}>THE CREATIVE PROCESS<br />EP. 024</span><div className={styles.caption}>ONE IDEA.<br /><mark>NEW POSSIBILITIES.</mark></div><div className={styles.clipBottom}><span>00:38</span><Captions size={20} /></div></div><div className={styles.export}><Check size={14} /> Captioned. Reframed. Ready.</div></div>
            </div>
            <div className={styles.timeline}><span>01:00</span><div className={styles.waveform}>{Array.from({ length: 72 }, (_, i) => <i key={i} style={{ height: `${12 + ((i * 17 + i * i) % 28)}px` }} />)}<div className={styles.selection}><Scissors size={10} /><span>THE GOOD PART</span></div></div><span>24:08</span></div>
          </div>
          <div className={styles.formatStrip}><span>LONG-FORM IN. YOUR NEXT POST OUT.</span><div><Play size={18} /> YouTube Shorts</div><div><Film size={17} /> Instagram Reels</div><div><AudioLines size={18} /> TikTok</div></div>
        </section>
        <section id="how-it-works" className={styles.workflow}>
          <div className={styles.sectionIntro}><div><span className={styles.eyebrow}>FROM FULL EPISODE TO FRESH FEED</span><h2>More from what<br />you’ve already made.</h2></div><p>The story is yours. We help you find the opening hook, keep the good part, and give it a new format.</p></div>
          <div className={styles.steps}>{[
            { icon: Upload, title: 'Drop in the long version.', text: 'Paste a YouTube link or upload your video. Start with a podcast, an interview, a lesson, or a great conversation.', tag: '01 / ADD YOUR VIDEO' },
            { icon: Sparkles, title: 'Find your “that’s the one.”', text: 'Get ranked moments with a title and a reason behind every pick. Preview the suggestions and choose what feels right.', tag: '02 / DISCOVER THE MOMENTS' },
            { icon: Scissors, title: 'Make the final cut.', text: 'Fine-tune the timing, frame your subject, and style the captions. Export a vertical MP4 and take it to your audience.', tag: '03 / MAKE IT YOURS' },
          ].map(({ icon: Icon, title, text, tag }) => <article key={tag} className={styles.step}><div className={styles.stepIcon}><Icon size={23} /></div><span>{tag}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>
        <section id="features" className={styles.features}>
          <div className={styles.sectionIntro}><div><span className={styles.eyebrow}>A SMALL TOOLKIT. A BIG HEAD START.</span><h2>Less busywork.<br /><span className={styles.muted}>More of your point of view.</span></h2></div></div>
          <div className={styles.featureGrid}>
            <article className={styles.feature}><div className={styles.captionDemo} aria-hidden><span>make every</span><strong>WORD <mark>COUNT.</mark></strong><div><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className={styles.featureCopy}><Captions size={22} /><h3>Words that keep up.</h3><p>Word-timed captions bring your message into focus. Choose from four styles, from clean and minimal to bold and expressive.</p></div></article>
            <article className={styles.feature}><div className={styles.frameDemo} aria-hidden><div className={styles.frameGrid} /><div className={styles.subject}><AudioLines size={85} strokeWidth={1} /></div><div className={styles.cropFrame}><span>SUBJECT IN FRAME</span><Crop size={16} /></div><span className={styles.frameRatio}>16:9 → 9:16</span></div><div className={styles.featureCopy}><Crop size={22} /><h3>A new frame. Same story.</h3><p>Face-aware framing follows your subject into vertical. Prefer the full picture? Switch to a center crop or a blurred-background fit.</p></div></article>
          </div>
          <div className={styles.controlNote}><span><Scissors size={19} /> Built for your judgment, too.</span><p>Adjust any range. Create a clip manually. Save a new version without losing the last one.</p><Link href={destination}>Take the creative lead <ArrowRight size={16} /></Link></div>
        </section>
        <section id="faq" className={styles.faq}><div><span className={styles.eyebrow}>BEFORE YOU HIT UPLOAD</span><h2>A few good<br />questions.</h2></div><div className={styles.questions}>{faqs.map(([q, a]) => <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>)}</div></section>
        <section className={styles.finalCta}><div className={styles.eyebrow}><span /> MAKE ROOM FOR THE GOOD PARTS</div><h2>Long video.<br /><em>New possibilities.</em></h2><p>Your next post doesn’t have to start from scratch.</p><Link className={styles.primaryButton} href={destination}>Create your first clip <ArrowRight size={18} /></Link><a href="#main" className={styles.backTop} aria-label="Back to top"><ArrowDown size={18} /></a></section>
      </main>
      <MarketingFooter />
    </div>
  );
};
Landing.public = true;
export default Landing;
