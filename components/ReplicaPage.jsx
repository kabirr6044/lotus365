'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { destinationUrl } from '../lib/destination.mjs';
import { pageLanguage } from '../lib/seo.mjs';
import SiteHeader from './SiteHeader';
export default function ReplicaPage({ page, content, className }) {
 const router = useRouter();
 const ref = useRef(null);
 useEffect(() => {
  const root = ref.current; const media = window.matchMedia('(max-width: 921.99px)');
  const destination = destinationUrl(process.env.NEXT_PUBLIC_DESTINATION_URL);
  root.querySelectorAll('[data-external-reference]').forEach(link => {
   link.setAttribute('href', destination || '#');
   if (destination) { link.removeAttribute('aria-disabled'); link.removeAttribute('title'); }
  });
  document.documentElement.lang = pageLanguage(page);
  const update = () => {
   const mobile = media.matches;
   root.querySelectorAll('.main-header-menu-toggle').forEach(button => {button.classList.remove('toggled');button.setAttribute('aria-expanded','false');});
   root.querySelectorAll('header.replica-menu-open').forEach(header => header.classList.remove('replica-menu-open'));
   document.body.className = page.bodyClass.replace(/\b(ast-desktop|ast-mobile|ast-header-break-point)\b/g, '').trim() + (mobile ? ' ast-mobile ast-header-break-point' : ' ast-desktop');
   root.dataset.pageReady = page.path;
  };
  update(); media.addEventListener('change', update);
  const fixedHeader = root.querySelector('#ast-fixed-header');
  const masthead = root.querySelector('#masthead');
  const sticky = () => {
   if (!fixedHeader || !masthead) return;
   const active = document.body.classList.contains('ast-primary-sticky-enabled') && window.scrollY > masthead.offsetHeight;
   ['ast-header-slide','ast-sticky-active','ast-header-sticked'].forEach(name => fixedHeader.classList.toggle(name, active));
   fixedHeader.style.visibility = active ? 'visible' : 'hidden';
   fixedHeader.style.transform = active ? 'translateY(0px)' : 'translateY(-100%)';
   fixedHeader.style.top = '0px';
   fixedHeader.style.width = window.innerWidth + 'px';
   document.documentElement.style.scrollPaddingTop = document.body.classList.contains('ast-primary-sticky-enabled') ? fixedHeader.offsetHeight + 'px' : '0px';
  };
  sticky(); window.addEventListener('scroll', sticky, { passive: true });
  window.addEventListener('resize', sticky); window.addEventListener('load', sticky);
  const click = event => {
   const toggle = event.target.closest('.main-header-menu-toggle');
   if (toggle) {
    const header = toggle.closest('header');
    if (header?.id === 'ast-fixed-header') {
     const panel = header.querySelector('.ast-mobile-header-content');
     if (panel) { panel.style.top = fixedHeader.offsetHeight + 'px'; panel.style.width = window.innerWidth + 'px'; }
    }
    event.preventDefault(); const open = document.body.classList.toggle('replica-menu-open');
    root.querySelectorAll('header').forEach(item => item.classList.toggle('replica-menu-open', open && item === header));
    toggle.classList.toggle('toggled', open); toggle.setAttribute('aria-expanded', String(open)); return;
   }
   const submenu = event.target.closest('.ast-menu-toggle');
   if (submenu) {
    event.preventDefault(); const item = submenu.closest('li');
    const open = item.classList.toggle('replica-submenu-open'); submenu.setAttribute('aria-expanded', String(open)); return;
   }
   const external = event.target.closest('[data-external-reference]');
   if (external) { if (!destination) event.preventDefault(); return; }
   // Wordpress reply links are local demo comment actions.
   const reply = event.target.closest('.comment-reply-link');
   if (reply) { event.preventDefault(); root.querySelector('#respond')?.scrollIntoView({ behavior: 'smooth' }); return; }
   const link = event.target.closest('a[href]');
   if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
   const url = new URL(link.href, window.location.href);
   // Keep fragments, files and external destinations under native browser control.
   if (url.origin !== window.location.origin || !url.pathname.endsWith('/') || url.pathname === window.location.pathname) return;
   event.preventDefault(); router.push(url.pathname + url.search + url.hash);
  };
  const submit = event => {
   const form = event.target.closest('form[data-redirect-form]'); if (!form) return;
   event.preventDefault(); if (!form.reportValidity()) return;
   if (!destination) {
    form.querySelector('.form-status').textContent = 'The destination link will be available soon.';
    return;
   }
   // No form values are read, stored, posted, or appended to the destination.
   window.location.assign(destination);
  };
  const escape = event => { if(event.key !== 'Escape' || !document.body.classList.contains('replica-menu-open')) return; const button=root.querySelector('.main-header-menu-toggle.toggled'); document.body.classList.remove('replica-menu-open'); root.querySelectorAll('header.replica-menu-open').forEach(header=>header.classList.remove('replica-menu-open')); button?.classList.remove('toggled'); button?.setAttribute('aria-expanded','false'); button?.focus(); };
  root.addEventListener('keydown', escape); root.addEventListener('click', click); root.addEventListener('submit', submit);
  return () => { media.removeEventListener('change', update); window.removeEventListener('scroll', sticky); window.removeEventListener('resize',sticky); window.removeEventListener('load',sticky); document.documentElement.style.scrollPaddingTop=''; root.removeEventListener('keydown',escape); root.removeEventListener('click', click); root.removeEventListener('submit', submit); };
 }, [page, router]);
 // A normal link belongs to this page and is removed on unmount. React's
 // precedence links persist across routes and would mix different page themes.
 return <><link key={page.stylesheet} rel="stylesheet" href={page.stylesheet}/><SiteHeader path={page.path}/><div ref={ref} className={className} lang={pageLanguage(page)} dangerouslySetInnerHTML={{ __html: content }}/></>;
}
