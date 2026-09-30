import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { company, services } from '../content';
import './Services.css';

const ServiceSculpture = lazy(() => import('./ServiceSculpture'));
const visualChapters = ['Foundation', 'Momentum', 'Connection'];

export default function Services({ reducedMotion }: { reducedMotion?: boolean }) {
  const track = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(0);
  const [largeScreen, setLargeScreen] = useState(false);
  const systemReducedMotion = useReducedMotion();
  const reduce = reducedMotion ?? Boolean(systemReducedMotion);
  // Preserve the track when motion is paused mid-scene to avoid a page jump.
  const [hasMotionLayout, setHasMotionLayout] = useState(!reduce);
  useEffect(() => { if (!reduce) setHasMotionLayout(true); }, [reduce]);
  const pinned = largeScreen && hasMotionLayout;
  const service = services[active];
  const visual = visualChapters[active];
  const nearViewport = useInView(track, { once: true, margin: '400px' });

  useEffect(() => {
    const media = window.matchMedia('(min-width: 960px) and (min-height: 760px)');
    const update = () => setLargeScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const { scrollYProgress } = useScroll({ target: track, offset: ['start 90px', 'end end'] });
  const { scrollYProgress: visualProgress } = useScroll({ target: visualRef, offset: ['start end', 'end start'] });
  const sculptureProgress = useTransform(() => pinned ? scrollYProgress.get() : active * .35 + visualProgress.get() * .3);
  const progress = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (pinned) setActive(Math.min(services.length - 1, Math.floor(value * services.length)));
  });

  function selectChapter(index: number) {
    setActive(index);
    if (!pinned || !track.current) return;
    const start = track.current.getBoundingClientRect().top + window.scrollY - 90;
    const distance = track.current.offsetHeight - window.innerHeight + 90;
    // Scroll directly to the chapter; the scene itself animates the transition.
    window.scrollTo({ top: start + distance * ((index + 0.15) / services.length), behavior: 'instant' });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % services.length;
    else if (event.key === 'ArrowLeft') next = (index + services.length - 1) % services.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = services.length - 1;
    else return;
    event.preventDefault();
    selectChapter(next);
    buttons.current[next]?.focus({ preventScroll: true });
  }

  return (
    <section ref={track} id="expertise" className={`expertise service-track${pinned ? ' service-track--pinned' : ''}`} aria-labelledby="expertise-title">
      <div className="service-stage" data-testid="service-stage" data-active={active}>
        <div className="service-stage-heading">
          <h2 id="expertise-title">01 / OUR EXPERTISE</h2>
          <span>Three perspectives. One way forward.</span>
        </div>

        <div className="service-scene">
          <div className="service-detail" id="service-detail" aria-live="polite" aria-atomic="true">
            <div className="service-copy-stage">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={service.id}
                  className="service-copy"
                  initial={reduce ? false : { opacity: 0, y: 58, rotateX: -9 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -38, rotateX: 7 }}
                  transition={{ duration: reduce ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="service-label"><span>{service.number}</span>{service.label}</p>
                  <h3>{service.heading}</h3>
                  <p className="service-description">{service.description}</p>
                  <ul className="service-inclusions">
                    {service.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
            <a className="service-enquiry" href={`mailto:${company.email}?subject=${encodeURIComponent(`Discuss ${service.title.toLowerCase()} — Pravardha Advisors`)}&body=${encodeURIComponent(`Hello Parul,\n\nI would like to discuss ${service.title.toLowerCase()}.\n\n`)}`}>
              Discuss your requirements
            </a>
          </div>

          <div ref={visualRef} className="service-visual" aria-hidden="true">
            <div className="service-visual-corners"><span /><span /><span /><span /></div>
            <span className="service-visual-note">A CONNECTED PERSPECTIVE</span>
            {nearViewport && <Suspense fallback={null}><ServiceSculpture progress={sculptureProgress} chapter={active} pinned={pinned} reducedMotion={reduce} /></Suspense>}
            <div className="service-visual-caption">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span key={visual} initial={reduce ? false : { y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -28, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.5 }}>{visual}<i>.</i></motion.span>
              </AnimatePresence>
              <span className="service-visual-number">{service.number}<small> / 03</small></span>
            </div>
          </div>
        </div>

        <div className="service-controls-row">
          <div className="service-controls" role="group" aria-label="Explore advisory services">
            {services.map((item, index) => (
              <button
                key={item.id}
                ref={(element) => { buttons.current[index] = element; }}
                type="button"
                className={`service-button${active === index ? ' active' : ''}`}
                aria-pressed={active === index}
                aria-controls="service-detail"
                onClick={() => selectChapter(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                {active === index && <motion.span className="service-selection" layoutId="service-selection" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }} />}
                <span className="service-button-number">{item.number}</span><span>{item.title}</span>
              </button>
            ))}
          </div>
          <span className="service-scroll-hint">{pinned ? 'SCROLL TO EXPLORE' : 'SELECT A PERSPECTIVE'}</span>
        </div>
        <div className="service-progress" aria-hidden="true"><motion.span style={{ scaleX: pinned ? progress : (active + 1) / services.length }} /></div>
      </div>
    </section>
  );
}
