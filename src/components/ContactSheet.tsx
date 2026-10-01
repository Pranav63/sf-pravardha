import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { company } from '../content';
import './ContactSheet.css';

type Props = { open: boolean; reducedMotion: boolean; onDismiss: () => void; onClosed: () => void };

export default function ContactSheet({ open, reducedMotion, onDismiss, onClosed }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copy, setCopy] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (!open) return;
    setCopy('idle');
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  async function copyEmail() {
    setCopy('copying');
    try {
      await navigator.clipboard.writeText(company.email);
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
  }

  return <motion.dialog
    ref={dialog} id="contact-sheet" className="contact-sheet" aria-labelledby="sheet-title" aria-describedby="sheet-description"
    initial={false} animate={{ opacity: open ? 1 : 0, y: reducedMotion || open ? 0 : 32 }}
    transition={{ duration: reducedMotion ? 0 : .28, ease: [.22, 1, .36, 1] }}
    onAnimationComplete={() => { if (!open) dialog.current?.close(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onCancel={event => { event.preventDefault(); onDismiss(); }} onClose={onClosed}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onDismiss();
    }}
  >
    <div className="sheet-top"><p className="eyebrow">LET’S TALK</p><button type="button" className="sheet-close" aria-label="Close contact sheet" onClick={onDismiss} autoFocus><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></button></div>
    <h2 id="sheet-title">Your next move.<br /><em>Let’s talk it through.</em></h2>
    <p id="sheet-description">Share what you have in mind with Parul.</p>
    <div className="sheet-person"><img src="/images/md_parul.png" width="64" height="64" alt="" /><div><p>{company.partner.name}</p><span>{company.partner.title}</span></div></div>
    <p className="sheet-email">{company.email}</p>
    <div className="sheet-actions">
      <a className="button button-dark" href={`mailto:${company.email}?subject=${encodeURIComponent('An introduction — Pravardha Advisors')}`}>Email Parul</a>
      <button type="button" className="sheet-copy" disabled={copy === 'copying'} onClick={copyEmail} data-copied={copy === 'copied'}>{copy === 'copied' && <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}{copy === 'copied' ? 'Copied' : 'Copy email'}</button>
    </div>
    <p className="sheet-status" role="status">{copy === 'copied' ? 'Email address copied.' : copy === 'failed' ? 'Copy is unavailable. Select the email address above to copy it.' : ''}</p>
  </motion.dialog>;
}
