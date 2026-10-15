'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import navigation from '../data/navigation.json';
import styles from './SiteHeader.module.css';
import { destinationUrl } from '../lib/destination.mjs';
import MobileNavigation from './MobileNavigation';

export default function SiteHeader({ path }) {
 const [open, setOpen] = useState(false);
 const header = useRef(null);
 const toggle = useRef(null);
 const whatsappDestination = destinationUrl(process.env.NEXT_PUBLIC_DESTINATION_URL);
 const closeMobile = useCallback(() => { setOpen(false); }, []);
 const closeMenus = useCallback(() => {
  setOpen(false);
  header.current?.querySelectorAll('details[open]').forEach(item => { item.open = false; });
 }, []);
 useEffect(() => { closeMenus(); }, [path, closeMenus]);
 useEffect(() => {
  const dismissOutside = event => {
   header.current?.querySelectorAll('details[open]').forEach(menu => {
    if (!menu.contains(event.target)) menu.open = false;
   });
  };
  document.addEventListener('pointerdown', dismissOutside, true);
  document.addEventListener('focusin', dismissOutside);
  return () => {
   document.removeEventListener('pointerdown', dismissOutside, true);
   document.removeEventListener('focusin', dismissOutside);
  };
 }, []);
 return <header ref={header} className={styles.header} onKeyDown={event => {
  if (event.key === 'Escape' && !open) {
   const summary = event.target.closest('details')?.querySelector('summary');
   closeMenus();
   (summary || header.current?.querySelector('button'))?.focus();
  }
 }}>
  <div className={styles.inner}>
   <Link prefetch={false} className={styles.brand} href="/" aria-label="Lotus365 home">
    <picture><source media="(max-width: 1279px)" srcSet="/assets/lotus365-wordmark-compact.svg"/><img src="/assets/lotus365-wordmark-transparent.svg" alt="Lotus365" width="1000" height="417"/></picture>
   </Link>
   <nav id="site-main-navigation" aria-label="Main navigation" className={styles.navigation}>
    <ul className={styles.links}>
     {navigation.map(item => <li key={item.href} className={styles.item}>
      {item.children.length ? <details name="main-navigation-dropdown" className={styles.dropdown}>
       <summary className={styles.navLink} data-active={path === item.href || item.children.some(child => child.href === path)}>{item.label}<span className={styles.chevron} aria-hidden="true" /></summary>
       <ul className={styles.submenu}>
        <li><Link prefetch={false} href={item.href} aria-current={path === item.href ? 'page' : undefined}>{item.label} overview</Link></li>
        {item.children.map(child => <li key={child.href}><Link prefetch={false} href={child.href} aria-current={path === child.href ? 'page' : undefined}>{child.label}</Link></li>)}
       </ul>
      </details> : <Link prefetch={false} className={styles.navLink} href={item.href} aria-current={path === item.href ? 'page' : undefined}>{item.label}</Link>}
     </li>)}
    </ul>
   </nav>
   <div className={styles.actions}>
    <Link prefetch={false} className={styles.login} href="/lotus365-login/" aria-current={path === '/lotus365-login/' ? 'page' : undefined}>Login</Link>
    <Link prefetch={false} className={styles.signup} href="/lotus365-signup/" aria-current={path === '/lotus365-signup/' ? 'page' : undefined}>Sign Up</Link>
    <a className={styles.whatsapp} href={whatsappDestination || '#'} aria-label="WhatsApp" title="WhatsApp" aria-disabled={!whatsappDestination || undefined} onClick={event => { if (!whatsappDestination) event.preventDefault(); }}>
     <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m8.4 7.2 1.2 2.5-1 1.1c.7 1.5 1.8 2.6 3.3 3.3l1.1-1 2.5 1.2c.3.2.3.5.2.8-.4 1.1-1.2 1.6-2.3 1.4-3.7-.6-6.6-3.5-7.2-7.2-.2-1.1.3-1.9 1.4-2.3.3-.1.6-.1.8.2Z" fill="currentColor" />
     </svg>
     <span className={styles.whatsappLabel}>WhatsApp</span>
    </a>
   </div>
   <button ref={toggle} className={styles.toggle} type="button" aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-navigation" aria-haspopup="dialog" onClick={() => setOpen(true)}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
   </button>
  </div>
  <MobileNavigation open={open} onClose={closeMobile} path={path} destination={whatsappDestination} returnFocus={toggle}/>
 </header>;
}
