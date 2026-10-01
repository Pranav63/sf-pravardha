import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig, useScroll, useSpring, useTransform } from 'motion/react';
import { company } from './content';
import Corridors from './components/Corridors';
import Services from './components/Services';
import People from './components/People';
import Contact from './components/Contact';
import ContactSheet from './components/ContactSheet';

const navigation = [
  { id: 'expertise', label: 'Expertise' },
  { id: 'perspective', label: 'Perspective' },
  { id: 'about', label: 'Our people' },
];
const ease = [0.22, 1, 0.36, 1] as const;

function Brand() {
  return <a className="brand" href="#home" aria-label="Pravardha Advisors home"><span className="brand-symbol"><img src="/images/pravardha-logo.jpeg" alt="" width="1232" height="864" /></span><span className="brand-name">PRAVARDHA<small>ADVISORS</small></span></a>;
}

function Header({ reducedMotion, contactOpen, onContact }: { reducedMotion: boolean; contactOpen: boolean; onContact: (trigger: HTMLElement) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const [hidden, setHidden] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
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
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', close); window.removeEventListener('pointerdown', outside); };
  }, [open]);
  useEffect(() => {
    const compact = window.matchMedia('(max-width: 780px)');
    let previous = window.scrollY;
    let travel = 0;
    const reset = () => { previous = window.scrollY; travel = 0; setHidden(false); };
    const scroll = () => {
      const current = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      const delta = current - previous;
      previous = current;
      if (!compact.matches || reducedMotion || open || contactOpen || current < 120 || header.current?.querySelector(':focus-visible')) {
        travel = 0;
        setHidden(false);
        return;
      }
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      if (travel > 28 || travel < -12) { setHidden(travel > 0); travel = 0; }
    };
    reset();
    window.addEventListener('scroll', scroll, { passive: true });
    compact.addEventListener('change', reset);
    return () => { window.removeEventListener('scroll', scroll); compact.removeEventListener('change', reset); };
  }, [open, contactOpen, reducedMotion]);
  return <header ref={header} className="site-header glass" data-tone={active === 'perspective' || active === 'contact' ? 'dark' : 'light'} data-expanded={open} data-hidden={hidden && !open && !contactOpen && !reducedMotion} onFocusCapture={() => setHidden(false)}>
    <Brand />
    <nav className="desktop-nav" aria-label="Main navigation">
      {navigation.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined}>{active === item.id && <motion.span className="nav-indicator" layoutId="navigation-pill" transition={{ type: 'spring', stiffness: 320, damping: 30 }} />}<span>{item.label}</span></a>)}
    </nav>
    <button type="button" className="header-contact" aria-haspopup="dialog" aria-controls="contact-sheet" onClick={event => onContact(event.currentTarget)}>Let’s talk</button>
    <button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><span className="menu-label">{open ? 'Close' : 'Menu'}</span><svg className="menu-lines" viewBox="0 0 20 20" fill="none" aria-hidden="true"><motion.path initial={false} animate={{ d: open ? 'M5 5L15 15M5 15L15 5' : 'M3 7L17 7M3 13L17 13' }} transition={{ duration: reducedMotion ? 0 : .22 }} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></button>
    <AnimatePresence>{open && <motion.nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reducedMotion ? 0 : .35, ease }}>{navigation.map((item) => <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}>{item.label}</a>)}<button type="button" aria-haspopup="dialog" aria-controls="contact-sheet" onClick={() => { setOpen(false); onContact(toggle.current!); }}>Let’s talk</button></motion.nav>}</AnimatePresence>
  </header>;
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
      <h1 id="hero-title">{company.hero.title.map((line, index) => <span className="hero-line" key={line}><motion.span initial={reducedMotion ? false : { y: '110%', rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 1.1, delay: .13 + index * .12, ease }}>{index === 1 ? <em>{line}</em> : line}</motion.span></span>)}</h1>
      <motion.div initial={reducedMotion ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .45, ease }}><p className="hero-description">{company.hero.description}</p><a className="button button-dark" href="#expertise">Discover our expertise</a></motion.div>
    </motion.div>
    <motion.a className="hero-glass-note glass" href="#perspective" initial={reducedMotion ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: .7, ease }}><span className="note-orbit" aria-hidden="true"><i /><i /><i /></span><span>Rooted in the Gulf.<strong>Connected to opportunity.</strong></span></motion.a>
    <motion.div className="hero-progress" style={{ scaleX: reducedMotion ? 0 : progress }} />
  </section>;
}

function Perspective({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start .85', 'end .3'] });
  const contours = (opening: number) => Array.from({ length: 34 }, (_, index) => {
    const i = index * 41 / 33;
    return `M38 ${220 + i * 1.15}C128 ${268 - i * (5.4 + opening * .9)} 212 ${20 + i * 4 - opening * 65} 291 ${98 + i * 4.3}S435 ${279 - i * 4.3 - opening * 24} 486 ${143 + i * 3.3}`;
  }).join(' ');
  const field = useTransform(scrollYProgress, [0, 1], [contours(0), contours(1)]);
  const words = ['Ambition', 'opens', 'doors.'];
  return <section className="manifesto" id="introduction" ref={ref} aria-labelledby="intro-title">
    <div className="manifesto-layout">
      <div className="manifesto-copy">
        <p className="eyebrow manifesto-kicker">BEYOND BORDERS</p>
        <h2 id="intro-title">{words.map((word, i) => <Fragment key={word}><motion.span initial={reducedMotion ? false : { y: 14 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: .5 }} transition={{ duration: .45, delay: i * .06, ease }}>{word}</motion.span>{' '}</Fragment>)}<em>The right structure<br />keeps them open.</em></h2>
        <p className="manifesto-description">{company.introduction.text}</p>
      </div>
      <div className="perspective-art" aria-hidden="true">
        <svg className="perspective-flow" viewBox="0 55 520 285" fill="none">
          <defs>
            <linearGradient id="perspective-ink" x1="38" y1="230" x2="486" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#315c49" stopOpacity="0" /><stop offset=".16" stopColor="#315c49" stopOpacity=".8" /><stop offset=".25" stopColor="#315c49" /><stop offset=".65" stopColor="#718966" /><stop offset=".85" stopColor="#a88c51" stopOpacity=".8" /><stop offset="1" stopColor="#a88c51" stopOpacity="0" /></linearGradient>
            <radialGradient id="perspective-light"><stop stopColor="#e7ddbb" stopOpacity=".6" /><stop offset="1" stopColor="#f5f3ed" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="280" cy="200" rx="220" ry="145" fill="url(#perspective-light)" />
          <motion.path className="perspective-contours" d={reducedMotion ? contours(.5) : field} stroke="url(#perspective-ink)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  </section>;
}

export default function App() {
  const [contactOpen, setContactOpen] = useState(false);
  const contactTrigger = useRef<HTMLElement | null>(null);
  const openContact = (trigger: HTMLElement) => { contactTrigger.current = trigger; setContactOpen(true); };
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const reducedMotion = systemReduced;
  return <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'} transition={{ ease, duration: .7 }}><div className="site" data-motion={reducedMotion ? 'reduced' : 'full'}>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header reducedMotion={reducedMotion} contactOpen={contactOpen} onContact={openContact} />
    <main id="main"><Hero reducedMotion={reducedMotion} /><Perspective reducedMotion={reducedMotion} /><Services reducedMotion={reducedMotion} /><Corridors reducedMotion={reducedMotion} /><People reducedMotion={reducedMotion} /><Contact reducedMotion={reducedMotion} /></main>
    <footer className="footer">
      <div className="footer-heading">
        <Brand />
        <a href="#home" className="footer-return glass" aria-label="Return to top" title="Return to top">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5M6 11L12 5L18 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </div>
      <div className="footer-details">
        <p className="footer-practice">Corporate structuring.<br />Trade finance.<br />Cross-border advisory.</p>
        <div className="footer-office"><h2>OUR OFFICE</h2><address>{company.address}</address></div>
        <div className="footer-contact"><h2>DIRECT CONTACT</h2><p className="footer-partner">{company.partner.name}</p><p className="footer-role">{company.partner.title}</p><a href={`mailto:${company.email}`}>{company.email}</a></div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {company.name}</span>
        <nav aria-label="Footer navigation">{navigation.map(item => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav>
      </div>
    </footer>
    <ContactSheet open={contactOpen} reducedMotion={reducedMotion} onDismiss={() => setContactOpen(false)} onClosed={() => contactTrigger.current?.focus({ preventScroll: true })} />

  </div></MotionConfig>;
}
