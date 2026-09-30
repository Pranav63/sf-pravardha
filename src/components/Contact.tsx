import { motion } from 'motion/react';
import { company } from '../content';
import './Contact.css';

export default function Contact({ reducedMotion }: { reducedMotion: boolean }) {
  const emailHref = `mailto:${company.email}?subject=${encodeURIComponent('An introduction — Pravardha Advisors')}`;
  return <section className="contact" id="contact" aria-labelledby="contact-title">
    <div className="contact-light" aria-hidden="true" />
    <motion.div className="contact-content" initial={reducedMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }}>
      <div className="contact-heading"><p className="eyebrow">LET’S TALK</p><h2 id="contact-title">A conversation.<br /><em>A clearer direction.</em></h2></div>
      <div className="contact-invitation">
        <p>{company.contact.description}</p>
        <p>{company.contact.invitation}</p>
        <motion.a href={emailHref} className="contact-button glass" whileHover={reducedMotion ? undefined : { scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: .975 }}>Email Parul</motion.a>
        <a className="contact-email" href={`mailto:${company.email}`}>{company.email}</a>
      </div>
    </motion.div>
  </section>;
}
