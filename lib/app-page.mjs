const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function appPageMarkup(markup, styles, appStyles, copy) {
 const heading = (id, text) => `<h2 id="${id}" class="${styles.sectionTitle}"><img class="${styles.headingDice}" src="/assets/heading-dice.svg" width="48" height="44" alt="" aria-hidden="true"/><span>${escape(text)}</span></h2>`;
 const section = (id, title, body, extra = '') => `<section class="${styles.section} ${extra}" aria-labelledby="${id}">${heading(id,title)}${body}</section>`;
 const paragraph = text => `<p>${escape(text)}</p>`;
 const intro = text => `<p class="${styles.sectionIntro}">${escape(text)}</p>`;
 const steps = items => `<ol class="${styles.steps}">${items.map(item=>`<li><h3>${escape(item.title)}</h3>${paragraph(item.text)}</li>`).join('')}</ol>`;
 const benefits = items => `<ul class="${styles.benefits}">${items.map(item=>`<li><h3>${escape(item.title)}</h3>${paragraph(item.text)}</li>`).join('')}</ul>`;
 const downloads = `<div class="${styles.exploreLinks} ${appStyles.downloads}"><a href="#" data-external-reference="ext-92297a4ac3f7" aria-disabled="true">Lotus365 Book APK</a><a href="#" data-external-reference="ext-5bdd1b75d525" aria-disabled="true">Lotus Blue 365 APK</a></div>`;
 const body = `<div class="${appStyles.content}">
  <section class="${styles.hero} ${appStyles.hero}" aria-labelledby="lotus-365-app"><div class="${styles.copy}"><h1 id="lotus-365-app" class="${styles.title}">${escape(copy.hero.heading)}</h1><p class="${styles.description}">${escape(copy.hero.description)}</p><div class="${styles.actions}"><a class="${styles.signup}" href="#how-to-download-the-lotus365-app-apk">Download App</a><a class="${styles.login}" href="/lotus365-login/">Login</a></div></div><div class="${appStyles.heroArt}"><img class="${appStyles.heroImage}" src="/assets/lotus365-app-phone.webp" width="800" height="1200" fetchpriority="high" alt="Phone displaying a green and yellow Lotus365 app concept with cricket, casino, login and signup navigation"/></div></section>
  ${section('app-overview',copy.overview.heading,`<div class="${styles.overviewGrid}"><div class="${styles.overviewCopy}">${copy.overview.paragraphs.map(paragraph).join('')}<a href="#" data-external-reference="ext-f257a97ac4e0" aria-disabled="true">Access the Lotus365 app</a></div><ul class="${styles.highlights}">${copy.overview.highlights.map(item=>`<li><strong>${escape(item.title)}</strong><span>${escape(item.text)}</span></li>`).join('')}</ul></div>`,styles.overview)}
  ${section('how-to-log-in-to-the-lotus365-app',copy.login.heading,`${intro(copy.login.description)}${steps(copy.login.steps)}<aside class="${styles.vipNote}"><h3>Need Help With Lotus365 App Login?</h3>${paragraph(copy.login.troubleshooting)}<a href="/contact-us/">Contact support</a></aside><a class="${styles.guideButton}" href="/lotus365-login/">Log In to the Lotus365 App</a>`)}
  ${section('how-to-download-the-lotus365-app-apk',copy.download.heading,`${intro(copy.download.description)}<span id="get-the-lotus365-apk-quick-guide"></span>${steps(copy.download.steps)}${downloads}`)}
  ${section('android-settings-for-installing-the-lotus365-apk',copy.installation.heading,`${intro(copy.installation.description)}<span id="instructions-for-downloading-the-office-365-app"></span>${steps(copy.installation.steps)}<div class="${appStyles.installationMedia}"><img class="${appStyles.installationImage}" src="/assets/lotus365-app-installation.webp" width="1000" height="667" loading="lazy" alt="Green and gold phone with a download symbol beside a security shield, dice and chips"/><aside class="${styles.vipNote}"><h3>Before You Install</h3>${paragraph(copy.installation.tips)}</aside></div>`)}
  ${section('why-lotus365-is-not-available-on-play-store-and-ap',copy.stores.heading,copy.stores.paragraphs.map(paragraph).join(''))}
  ${section('what-is-the-lotus-365-app',copy.benefits.heading,`<span id="the-advantages-of-utilising-the-lotus-365-phone-app"></span>${intro(copy.benefits.description)}${benefits(copy.benefits.items)}`)}
  ${section('is-the-lotus365-apk-file-secure-and-ready-to-use',copy.security.heading,`<span id="you-can-have-confidence-in-safety-and-security"></span>${intro(copy.security.description)}${benefits(copy.security.items)}<aside id="some-suggestions-as-to-how-to-make-the-most-of-the-lotus-365-app" class="${styles.vipNote} ${appStyles.securityNote}"><h3>Make the Most of Your Lotus365 App</h3>${paragraph(copy.security.tips)}</aside>`)}
  ${section('lotus365-blue-premium-experience-for-serious-playe',copy.blue.heading,`${intro(copy.blue.description)}${benefits(copy.blue.items)}${paragraph(copy.blue.access)}<a class="${styles.guideButton}" href="/lotus365-blue/">Explore Lotus365 Blue</a>`,styles.explore)}
  ${section('fa-qs-lotus-365-app',copy.faq.heading,`<div class="${styles.faq}">${copy.faq.items.map(item=>`<details><summary>${escape(item.question)}</summary>${paragraph(item.answer)}</details>`).join('')}</div>`)}
  ${section('reasons-why-you-should-download-the-lotus-365-app',copy.final.heading,`${intro(copy.final.description)}${downloads}<div class="${appStyles.accountLinks}"><a href="/lotus365-signup/">Create a Lotus365 ID</a><a href="/lotus365-login/">Lotus365 Login</a><a href="/">Visit the Lotus365 Website</a></div>`,styles.explore)}
 </div>`;
 // Replace only the captured entry content, balancing nested divs so the
 // surrounding article, footer and external-link handlers stay intact.
 const opening = /<div\b[^>]*class="[^"]*\bentry-content\b[^"]*"[^>]*>/g.exec(markup);
 if (!opening) throw new Error('App page entry content was not found');
 const start = opening.index + opening[0].length;
 const tags = /<\/?div\b[^>]*>/g;
 tags.lastIndex = start;
 let depth = 1;
 for (let tag; (tag = tags.exec(markup));) {
  depth += tag[0].startsWith('</') ? -1 : 1;
  if (depth === 0) return markup.slice(0,start) + body + markup.slice(tag.index);
 }
 throw new Error('App page entry content is not balanced');
}
