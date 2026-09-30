import { motion } from 'motion/react';
import { company } from '../content';
import './People.css';

export default function People({ reducedMotion }: { reducedMotion: boolean }) {
  return <section className="people" id="about" aria-labelledby="people-title">
    <div className="people-heading">
      <p className="eyebrow">OUR PEOPLE</p>
      <h2 id="people-title">Good advice starts<br />with <em>understanding.</em></h2>
    </div>
    <motion.figure className="partner-portrait" initial={reducedMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }}>
      <div className="partner-photo"><img src="/images/md_parul.png" alt="Parul Gupta, Managing Partner at Pravardha Advisors" width="800" height="800" loading="lazy" /></div>
      <figcaption><h3>{company.partner.name}</h3><p>{company.partner.title}</p></figcaption>
    </motion.figure>
    <motion.div className="people-intro" initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }}>
      <p>{company.partner.text}</p>
      <p className="people-note">{company.partner.note}</p>
      <a className="people-link" href="#contact">Speak with Parul</a>
    </motion.div>
  </section>;
}
