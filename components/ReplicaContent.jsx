import ReplicaPage from './ReplicaPage';
import { pageLanguage } from '../lib/seo.mjs';
import { responsiveImages } from '../lib/responsive-images.mjs';
import { homeHeroMarkup } from '../lib/home-hero.mjs';
import heroStyles from './HomeHero.module.css';
import homepageCopy from '../data/homepage-copy.json';
import { footerMarkup } from '../lib/footer.mjs';
import footerStyles from './SiteFooter.module.css';
import { appPageMarkup } from '../lib/app-page.mjs';
import appStyles from './AppPage.module.css';
import appCopy from '../data/app-page-copy.json';
import { loginPageMarkup } from '../lib/login-page.mjs';
import loginStyles from './LoginPage.module.css';
import loginCopy from '../data/login-page-copy.json';
import { signupPageMarkup } from '../lib/signup-page.mjs';
import signupStyles from './SignupPage.module.css';
import signupCopy from '../data/signup-page-copy.json';
import redesignedStyles from './RedesignedPages.module.css';

// Assemble static content on the server; the browser only handles interaction.
export default function ReplicaContent({ page }) {
 const home = page.path === '/';
 const app = page.path === '/lotus365-app/';
 const login = page.path === '/lotus365-login/';
 const signup = page.path === '/lotus365-signup/';
 const pageContent = home ? homeHeroMarkup(page.html, heroStyles, homepageCopy) : app ? appPageMarkup(page.html, heroStyles, appStyles, appCopy) : login ? loginPageMarkup(page.html, loginStyles, loginCopy) : signup ? signupPageMarkup(page.html, signupStyles, signupCopy) : page.redesign?.html || page.html;
 const content = footerMarkup(pageContent, footerStyles);
 const className = `replica-document ${footerStyles.scope}${home || app ? ` ${heroStyles.page}` : ''}${app ? ` ${appStyles.page}` : ''}${login ? ` ${loginStyles.page}` : ''}${signup ? ` ${signupStyles.page}` : ''}${page.redesign ? ` ${redesignedStyles.page}` : ''}`;
 return <ReplicaPage page={{path:page.path, bodyClass:page.bodyClass, lang:pageLanguage(page), stylesheet:page.stylesheet}} className={className} content={responsiveImages(content)}/>;
}
