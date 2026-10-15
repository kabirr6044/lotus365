import { replaceEntryContent } from './page-content.mjs';

const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function loginPageMarkup(markup, styles, copy) {
 // Retain the existing validation and redirect-only form contract verbatim.
 const form = markup.match(/<form\b[^>]*data-redirect-form="login"[^>]*>[\s\S]*?<\/form>/)?.[0];
 if (!form) throw new Error('Login redirect form was not found');
 const heading = (id,text) => `<h2 id="${id}" class="${styles.sectionTitle}"><img src="/assets/heading-dice.svg" width="40" height="38" alt="" aria-hidden="true"/><span>${escape(text)}</span></h2>`;
 const paragraph = text => `<p>${escape(text)}</p>`;
 const body = `<div class="${styles.content}">
  <section class="${styles.account}" aria-labelledby="lotus365-login">
   <div class="${styles.welcome}"><h1 id="lotus365-login">${escape(copy.heading)}</h1>${paragraph(copy.introduction)}<img class="${styles.accessImage}" src="/assets/lotus365-login-access.webp" width="1000" height="937" fetchpriority="high" alt="Emerald account-access panel beside a golden key and open padlock"/></div>
   <div class="${styles.formPanel}"><h2>${escape(copy.form.heading)}</h2>${paragraph(copy.form.description)}${form}<div class="${styles.createAccount}">${escape(copy.form.signup)} <a href="/lotus365-signup/">${escape(copy.form.signupLink)}</a></div><a class="${styles.helpLink}" href="/contact-us/">Need help signing in?</a></div>
  </section>
  <section class="${styles.access}" aria-labelledby="login-devices">${heading('login-devices',copy.access.heading)}<div class="${styles.accessCopy}">${copy.access.paragraphs.map(paragraph).join('')}</div><nav class="${styles.related}" aria-label="Related Lotus365 pages">${copy.access.links.map(([label,href])=>`<a href="${href}">${escape(label)}</a>`).join('')}</nav></section>
  <div class="${styles.guideLayout}">
   <section class="${styles.guide}" aria-labelledby="login-steps">${heading('login-steps',copy.guide.heading)}${paragraph(copy.guide.description)}<ol class="${styles.steps}">${copy.guide.steps.map(item=>`<li><h3>${escape(item.title)}</h3>${paragraph(item.text)}</li>`).join('')}</ol><aside class="${styles.security}"><h3>${escape(copy.guide.noteTitle)}</h3>${paragraph(copy.guide.note)}</aside></section>
   <aside class="${styles.registration}" aria-labelledby="login-register"><h2 id="login-register">${escape(copy.signup.heading)}</h2>${paragraph(copy.signup.description)}<ol>${copy.signup.steps.map(item=>`<li><h3>${escape(item.title)}</h3>${paragraph(item.text)}</li>`).join('')}</ol><p class="${styles.bonus}">${escape(copy.signup.bonus)}</p><a class="${styles.button}" href="/lotus365-signup/">${escape(copy.signup.button)}</a></aside>
  </div>
  <section class="${styles.games}" aria-labelledby="login-games">${heading('login-games',copy.games.heading)}${paragraph(copy.games.description)}<dl>${copy.games.groups.map(item=>`<div><dt>${escape(item.title)}</dt><dd>${escape(item.text)}</dd></div>`).join('')}</dl><a class="${styles.textLink}" href="#" data-external-reference="ext-1edec07c39d7" aria-disabled="true">${escape(copy.games.button)}</a></section>
  <section class="${styles.faqLayout}" aria-labelledby="login-faq"><div>${heading('login-faq',copy.faq.heading)}${paragraph(copy.faq.description)}</div><div class="${styles.faq}">${copy.faq.items.map(item=>`<details><summary>${escape(item.question)}</summary>${paragraph(item.answer)}</details>`).join('')}</div></section>
  <section class="${styles.help}" aria-labelledby="login-help"><div><h2 id="login-help">${escape(copy.help.heading)}</h2>${paragraph(copy.help.description)}</div><div class="${styles.helpActions}"><a class="${styles.button}" href="/contact-us/">Contact Us</a><a href="#" data-external-reference="ext-6b7e00a12d51" aria-disabled="true">Forgot Password?</a></div></section>
 </div>`;
 return replaceEntryContent(markup,body);
}
