const escape = value => String(value).replace(/[&<>"']/g, character => ({
 '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function homeHeroMarkup(markup, styles, copy) {
 const section = (name, content, extra = '') => `<section class="${styles.section} ${extra}" aria-labelledby="home-${name}">${content}</section>`;
 const heading = (name, text) => `<h2 id="home-${name}" class="${styles.sectionTitle}"><img class="${styles.headingDice}" src="/assets/heading-dice.svg" width="48" height="44" alt="" aria-hidden="true" /><span>${escape(text)}</span></h2>`;
 const description = text => `<p class="${styles.sectionIntro}">${escape(text)}</p>`;
 const replaceSection = (name, content) => {
  markup = markup.replace(new RegExp(`<section class="${name}">[\\s\\S]*?<\\/section>`), content);
 };
 const hero = `<section class="${styles.hero}" aria-label="Welcome to Lotus365">
  <div class="${styles.copy}"><h1 class="${styles.title}">${escape(copy.hero.heading)}</h1><p class="${styles.description}">${escape(copy.hero.description)}</p>
   <div class="${styles.actions}"><a class="${styles.signup}" href="/lotus365-signup/">Sign Up</a><a class="${styles.login}" href="/lotus365-login/">Login</a></div>
  </div>
  <div class="${styles.art}"><img class="${styles.mascot}" src="/assets/lotus365-female-mascot-hero.webp" width="1254" height="1254" fetchpriority="high" alt="Female gaming host beside a roulette wheel, playing cards, chips and cricket and football props" /></div>
 </section>`;
 // Overview paragraphs are reviewed HTML from local content, never user input.
 const overview = section('overview', `${heading('overview', copy.overview.heading)}
  <div class="${styles.overviewGrid}"><div class="${styles.overviewCopy}">${copy.overview.paragraphs.map(text => `<p>${text}</p>`).join('')}</div>
   <ul class="${styles.highlights}">${copy.overview.highlights.map(item => `<li><strong>${escape(item.title)}</strong><span>${escape(item.text)}</span></li>`).join('')}</ul></div>`, styles.overview);
 replaceSection('welcome-section', hero + overview);
 replaceSection('best-option-section', section('benefits', `${heading('benefits', copy.benefits.heading)}${description(copy.benefits.description)}
  <ul class="${styles.benefits}">${copy.benefits.items.map(item => `<li><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></li>`).join('')}</ul>`));
 replaceSection('cta-section-bold', section('explore', `${heading('explore', copy.explore.heading)}${description(copy.explore.description)}
  <div class="${styles.exploreLinks}">${copy.explore.links.map(item => `<a href="${escape(item.href)}">${escape(item.label)}</a>`).join('')}</div>`, styles.explore));
 replaceSection('quick-guide-section', section('login', `${heading('login', copy.login.heading)}${description(copy.login.description)}
  <ol class="${styles.steps}">${copy.login.steps.map(item => `<li><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></li>`).join('')}</ol>
  <aside class="${styles.vipNote}"><h3>${escape(copy.login.vipTitle)}</h3><p>${escape(copy.login.vipText)}</p><a href="/lotus365-vip-login/">Explore Lotus365 VIP Login</a></aside>
  <a class="${styles.guideButton}" href="/lotus365-login/">${escape(copy.login.button)}</a>`));
 replaceSection('lotus365-faq-section', section('faq', `${heading('faq', copy.faq.heading)}${description(copy.faq.description)}
  <div class="${styles.faq}">${copy.faq.items.map(item => `<details><summary>${escape(item.question)}</summary><p>${escape(item.answer)}</p></details>`).join('')}</div>`));
 // Remove the homepage article feed; its articles remain available in the blog.
 markup = markup.replace(/<h2 class="wp-block-heading has-text-align-center">[\s\S]*?<\/h2>/, '');
 markup = markup.replace(/<ul\b[^>]*class="[^"]*wp-block-latest-posts__list[^"]*"[^>]*>[\s\S]*?<\/ul>/, '');
 return markup;
}
