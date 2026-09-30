import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import { company } from './content';
import Corridors from './components/Corridors';
import Services from './components/Services';

const navigation = [
  { id: 'expertise', label: 'Expertise' },
  { id: 'perspective', label: 'Perspective' },
  { id: 'about', label: 'Our people' },
];
const ease = [0.22, 1, 0.36, 1] as const;

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={diagonal ? 'arrow diagonal' : 'arrow'}><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function Brand() {
  return <a className="brand" href="#home" aria-label="Pravardha Advisors home"><span className="brand-symbol"><img src="/images/pravardha-logo.jpeg" alt="" width="1232" height="864" /></span><span className="brand-name">PRAVARDHA<small>ADVISORS</small></span></a>;
}

function Header({ reducedMotion }: { reducedMotion: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('main > section[id]');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    }), { rootMargin: '-20% 0px -55% 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return <motion.header className="site-header glass" initial={false} layout transition={{ duration: reducedMotion ? 0 : .4, ease }}>
    <Brand />
    <nav className="desktop-nav" aria-label="Main navigation">
      {navigation.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined}>{active === item.id && <motion.span className="nav-indicator" layoutId="navigation-pill" transition={{ type: 'spring', stiffness: 320, damping: 30 }} />}<span>{item.label}</span></a>)}
    </nav>
    <a href="#contact" className="header-contact">Let’s talk <Arrow diagonal /></a>
    <button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}<span className={`menu-lines ${open ? 'open' : ''}`} /></button>
    <AnimatePresence>{open && <motion.nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reducedMotion ? 0 : .35, ease }}>{navigation.map((item) => <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}>{item.label}<Arrow diagonal /></a>)}<a href="#contact" onClick={() => setOpen(false)}>Let’s talk<Arrow diagonal /></a></motion.nav>}</AnimatePresence>
  </motion.header>;
}

function Hero({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const textY = useTransform(scrollYProgress, [0, .8], [0, -110]);
  const opacity = useTransform(scrollYProgress, [0, .7], [1, .15]);
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 25 });
  return <section ref={ref} className="hero" id="home" aria-labelledby="hero-title">
    <motion.div className="hero-art" data-testid="hero-art" style={reducedMotion ? undefined : { y, scale }}><img src="/images/architecture.jpg" alt="Sculptural emerald glass and champagne metal arches on a stone foundation" width="1536" height="1024" fetchPriority="high" /></motion.div>
    <motion.div className="hero-content" style={reducedMotion ? undefined : { y: textY, opacity }}>
      <motion.p className="eyebrow hero-eyebrow" initial={reducedMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}><span className="status-dot" />A BROADER PERSPECTIVE ON BUSINESS</motion.p>
      <h1 id="hero-title">{company.hero.title.map((line, index) => <span className="hero-line" key={line}><motion.span initial={reducedMotion ? false : { y: '110%', rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 1.1, delay: .13 + index * .12, ease }}>{index === 1 ? <em>{line}</em> : line}</motion.span></span>)}</h1>
      <motion.div initial={reducedMotion ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .45, ease }}><p className="hero-description">{company.hero.description}</p><a className="button button-dark" href="#expertise">Discover our expertise<Arrow diagonal /></a></motion.div>
    </motion.div>
    <motion.a className="hero-glass-note glass" href="#perspective" initial={reducedMotion ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: .7, ease }}><span className="note-orbit" aria-hidden="true"><i /><i /><i /></span><span>Rooted in the Gulf.<strong>Connected to opportunity.</strong></span><Arrow diagonal /></motion.a>
    <div className="hero-bottom"><span>UAE BASED. INTERNATIONALLY MINDED.</span><a href="#introduction">Scroll to explore <span className="scroll-cue" aria-hidden="true">↓</span></a></div>
    <motion.div className="hero-progress" style={{ scaleX: reducedMotion ? 0 : progress }} />
  </section>;
}

function Perspective({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start .85', 'end .3'] });
  const x = useTransform(scrollYProgress, [0, 1], ['10%', '-10%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const scale = useTransform(scrollYProgress, [0, .7, 1], [.65, 1, 1.05]);
  const words = ['Ambition', 'opens', 'doors.'];
  return <section className="manifesto" id="introduction" ref={ref} aria-labelledby="intro-title">
    <motion.div className="manifesto-watermark" aria-hidden="true" style={reducedMotion ? undefined : { x }}>BEYOND BORDERS</motion.div>
    <div className="manifesto-layout"><div><p className="eyebrow">THE PRAVARDHA PERSPECTIVE</p><h2 id="intro-title">{words.map((word, i) => <Fragment key={word}><motion.span initial={reducedMotion ? false : { opacity: .12, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: .9 }} transition={{ duration: .7, delay: i * .1, ease }}>{word}</motion.span>{' '}</Fragment>)}<em>The right structure<br />keeps them open.</em></h2></div><div className="manifesto-right"><motion.div className="connection-seal" style={reducedMotion ? undefined : { rotate, scale }} aria-hidden="true"><span /><span /><span /><b>p.</b></motion.div><p>{company.introduction.text}</p></div></div>
    <div className="manifesto-rule"><span>SEE THE WHOLE PICTURE</span><span>MAKE YOUR NEXT MOVE</span><Arrow /></div>
  </section>;
}

function People({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, .5, 1], [-7, 0, 7]);
  const y = useTransform(scrollYProgress, [0, 1], [90, -60]);
  return <section ref={ref} className="people" id="about" aria-labelledby="people-title"><div className="people-intro"><p className="eyebrow">PERSONAL INVOLVEMENT. A WIDER VIEW.</p><h2 id="people-title">Good advice starts<br />with <em>understanding.</em></h2><p>{company.partner.text}</p><p className="people-note">{company.partner.note}</p></div><motion.div className="partner-card" style={reducedMotion ? undefined : { rotate, y }} whileHover={reducedMotion ? undefined : { rotate: 0, scale: 1.025 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}><span className="partner-card-label">YOUR PARTNER IN PERSPECTIVE</span><div className="partner-monogram" aria-hidden="true">pg<span>.</span><i /><i /></div><div className="partner-card-bottom"><div><h3>{company.partner.name}</h3><p>{company.partner.title}</p></div><a href={`mailto:${company.email}`} aria-label="Email Parul Gupta"><Arrow diagonal /></a></div><p className="partner-experience">{company.partner.experience}</p></motion.div></section>;
}

function Contact({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], [150, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [.85, 1]);
  const emailHref = `mailto:${company.email}?subject=${encodeURIComponent('An introduction — Pravardha Advisors')}`;
  return <section ref={ref} className="contact" id="contact" aria-labelledby="contact-title"><div className="contact-light" aria-hidden="true" /><motion.div className="contact-orbit" style={reducedMotion ? undefined : { y, scale }} aria-hidden="true"><span /><span /><span /></motion.div><div className="contact-content"><p className="eyebrow"><span className="status-dot" />EVERY NEXT CHAPTER STARTS SOMEWHERE.</p><h2 id="contact-title">Your next move.<br /><em>Let’s shape it.</em></h2><p>{company.contact.description}</p><motion.a href={emailHref} className="contact-button glass" whileHover={reducedMotion ? undefined : { scale: 1.04 }} whileTap={reducedMotion ? undefined : { scale: .96 }}>Start a conversation<Arrow diagonal /></motion.a><a className="contact-email" href={`mailto:${company.email}`}>{company.email}</a></div><div className="contact-location">RAS AL KHAIMAH, UAE<span>→</span>THE WORLD, IN PERSPECTIVE</div></section>;
}

export default function App() {
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [motionPreference, setMotionPreference] = useState<boolean | null>(null);
  const reducedMotion = motionPreference ?? !!systemReduced;
  const { scrollY } = useScroll();
  const [showMotionControl, setShowMotionControl] = useState(false);
  useMotionValueEvent(scrollY, 'change', (value) => setShowMotionControl(value > 100));
  return <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'} transition={{ ease, duration: .7 }}><div className="site" data-motion={reducedMotion ? 'reduced' : 'full'}>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header reducedMotion={reducedMotion} />
    <main id="main"><Hero reducedMotion={reducedMotion} /><Perspective reducedMotion={reducedMotion} /><Services reducedMotion={reducedMotion} /><Corridors reducedMotion={reducedMotion} /><People reducedMotion={reducedMotion} /><Contact reducedMotion={reducedMotion} /></main>
    <footer className="footer"><div className="footer-main"><Brand /><p>{company.location}<br /><a href={`mailto:${company.email}`}>{company.email}</a></p><a href="#home" className="back-top">Back to top <span>↑</span></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {company.name}</span><span>Corporate structuring · Trade finance · Cross-border advisory</span></div></footer>
    <motion.button className="motion-control glass" onClick={() => setMotionPreference(!reducedMotion)} aria-hidden={!showMotionControl} tabIndex={showMotionControl ? 0 : -1} style={{ pointerEvents: showMotionControl ? 'auto' : 'none' }} animate={{ opacity: showMotionControl ? 1 : 0, y: showMotionControl ? 0 : 12 }}><span aria-hidden="true">{reducedMotion ? '▷' : 'Ⅱ'}</span>{reducedMotion ? 'Play motion' : 'Pause motion'}</motion.button>
  </div></MotionConfig>;
}
