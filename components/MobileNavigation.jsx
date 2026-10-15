'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import navigation from '../data/navigation.json';
import styles from './SiteHeader.module.css';

export default function MobileNavigation({ open, onClose, path, destination, returnFocus }) {
 const panel = useRef(null);
 const activeGroup = navigation.find(item => item.children.some(child => child.href === path))?.href || null;
 const [expanded, setExpanded] = useState(activeGroup);
 useEffect(() => { setExpanded(activeGroup); }, [activeGroup]);
 const close = () => {
  panel.current?.close();
  onClose();
  returnFocus.current?.focus({ preventScroll: true });
 };
 useEffect(() => {
  const desktop = window.matchMedia('(min-width: 1280px)');
  const update = () => { if (desktop.matches) onClose(); };
  desktop.addEventListener('change', update);
  return () => desktop.removeEventListener('change', update);
 }, [onClose]);
 useEffect(() => {
  if (!open) return;
  const dialog = panel.current;
  const oldOverflow = document.documentElement.style.overflow;
  const { scrollX, scrollY } = window;
  dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
  window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
  return () => {
   if (dialog.open) dialog.close();
   document.documentElement.style.overflow = oldOverflow;
   window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
  };
 }, [open]);
 return <dialog ref={panel} id="mobile-navigation" className={styles.mobilePanel} aria-labelledby="mobile-menu-title" onCancel={event => { event.preventDefault(); close(); }} onClose={() => { if (!panel.current?.open) onClose(); }} onClick={event => {
  if (event.target !== event.currentTarget) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
 }}>
  <div className={styles.panelTop}>
   <Link prefetch={false} href="/" aria-label="Lotus365 home" onClick={close}><img src="/assets/lotus365-wordmark-compact.svg" alt="Lotus365" width="920" height="245"/></Link>
   <button type="button" className={styles.close} aria-label="Close navigation" autoFocus onClick={close}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button>
  </div>
  <h2 id="mobile-menu-title" className={styles.panelTitle}>Explore Lotus365</h2>
  <nav className={styles.mobileNavigation} aria-label="Mobile navigation">
   <ul className={styles.mobileLinks}>
    {navigation.map((item,index) => <li key={item.href} className={styles.mobileItem}>
     <div className={styles.mobileRow} data-active={path === item.href || item.children.some(child => child.href === path)}>
      <Link prefetch={false} href={item.href} aria-current={path === item.href ? 'page' : undefined} onClick={close}>{item.label}</Link>
      {item.children.length > 0 && <button type="button" aria-label={`${expanded === item.href ? 'Collapse' : 'Expand'} ${item.label} pages`} aria-expanded={expanded === item.href} aria-controls={`mobile-submenu-${index}`} onClick={() => setExpanded(expanded === item.href ? null : item.href)}><span className={styles.chevron} aria-hidden="true"/></button>}
     </div>
     {item.children.length > 0 && <div className={styles.mobileSubmenuPanel} data-expanded={expanded === item.href} aria-hidden={expanded !== item.href} inert={expanded !== item.href}><div><ul id={`mobile-submenu-${index}`} className={styles.mobileSubmenu}>
      {item.children.map(child => <li key={child.href}><Link prefetch={false} href={child.href} aria-current={path === child.href ? 'page' : undefined} onClick={close}>{child.label}</Link></li>)}
     </ul></div></div>}
    </li>)}
   </ul>
  </nav>
  <div className={styles.panelSupport}>
   <a className={styles.supportButton} href={destination || '#'} aria-disabled={!destination || undefined} onClick={event => { if (!destination) event.preventDefault(); else close(); }}><svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m8.4 7.2 1.2 2.5-1 1.1c.7 1.5 1.8 2.6 3.3 3.3l1.1-1 2.5 1.2c.3.2.3.5.2.8-.4 1.1-1.2 1.6-2.3 1.4-3.7-.6-6.6-3.5-7.2-7.2-.2-1.1.3-1.9 1.4-2.3.3-.1.6-.1.8.2Z" fill="currentColor"/></svg><span>WhatsApp Support</span></a>
   <Link prefetch={false} className={styles.contactLink} href="/contact-us/" onClick={close}>Contact Us</Link>
  </div>
 </dialog>;
}
