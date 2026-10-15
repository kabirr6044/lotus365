export const footerGroups = [
 { title: 'Explore', links: [
  ['Sign Up', '/lotus365-signup/'], ['Login', '/lotus365-login/'],
  ['Download App', '/lotus365-app/'], ['Lotus365 Blue', '/lotus365-blue/'],
  ['Bonuses', '/lotus365-registration-claim-bonus-guide/'], ['Blog', '/blog/'], ['FAQs', '/faq/'],
 ] },
 { title: 'Support', links: [
  ['Contact Us', '/contact-us/'], ['WhatsApp Support', 'ext-ddc432be01ef'],
  ['Help Center', 'ext-ddc432be01ef'], ['System Status', '/about-lotus365/'],
  ['Responsible Gaming', '/responsible-gaming-lotus365/'],
 ] },
 { title: 'Policies', links: [
  ['Terms & Conditions', '/terms/'], ['Privacy Policy', '/privacy/'], ['Cookie Policy', '/cookies/'],
 ] },
];
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const link = (label, destination, className = '') => `<a${className ? ` class="${className}"` : ''} ${destination.startsWith('ext-')
 ? `href="#" data-external-reference="${destination}" aria-disabled="true"`
 : `href="${destination}"`}>${escape(label)}</a>`;

export function footerMarkup(markup, styles) {
 const footer = `<div class="${styles.footer}" aria-label="Lotus365 footer">
  <div class="${styles.inner}">
   <div class="${styles.grid}">
    <div class="${styles.brand}">
     <a href="/" aria-label="Lotus365 home"><img src="/assets/lotus365-wordmark-transparent.svg" alt="Lotus365" width="1000" height="417" loading="lazy" /></a>
     <p>Lotus365 is India’s trusted sports betting and online casino platform, built for speed and security.</p>
     <p>One-time KYC, instant UPI/Paytm deposits, fast withdrawals and 24/7 support.</p>
     <div class="${styles.badges}" aria-label="Security badges"><span>SSL</span><span>PCI</span><span>KYC</span></div>
     <nav class="${styles.social}" aria-label="Social links">${['Facebook', 'Twitter', 'Instagram', 'WhatsApp'].map(label => link(label, 'ext-6b7e00a12d51')).join('')}</nav>
    </div>
    ${footerGroups.map(group => `<nav class="${styles.group}" aria-label="Footer ${group.title.toLowerCase()}"><h2>${group.title}</h2><ul>${group.links.map(([label, href]) => `<li>${link(label, href)}</li>`).join('')}</ul></nav>`).join('')}
   </div>
   <div class="${styles.notice}"><h2>Disclaimer</h2><p>Our website serves an educational and informational purpose only. We do not support or promote gambling or any casino games involving money. The material provided is solely for awareness, and we are not liable for how it is used.</p></div>
   <div class="${styles.bottom}"><p>© 2026 Lotus365. All rights reserved.</p><nav aria-label="Additional footer links">${link('Sitemap', '/sitemap.xml')}</nav></div>
  </div>
 </div>`;
 return markup.replace(/<footer\b[^>]*class="lotus365-footer"[^>]*>[\s\S]*?<\/footer>/, footer);
}
