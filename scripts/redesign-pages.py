"""Build reviewed reading, feature, utility and archive layouts from local captures.

Captured pages remain untouched. The generated map is applied server-side to
one route at a time, so unrelated page bodies are never shipped to the client.
"""
import copy
import html as escape_html
import json
import re
from collections import Counter
from pathlib import Path
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
PAGES = json.loads((ROOT / 'data/pages.json').read_text(encoding='utf-8'))
COPY = json.loads((ROOT / 'data/redesign-copy.json').read_text(encoding='utf-8'))
ASSETS = json.loads((ROOT / 'data/redesign-assets.json').read_text(encoding='utf-8'))
SKIP = {'/', '/lotus365-app/', '/lotus365-login/', '/lotus365-signup/'}
POLICIES = {'/terms/', '/privacy/', '/cookies/', '/responsible-gaming-lotus365/'}
NAV = {'/lotus365-blue/', '/lotus365-blue-login/', '/lotus365-vip/', '/lotus365-vip-login/', '/lotus365-win/', '/lotus365-live/', '/www-lotus365/', '/lotus-365-online-id-apk-download/', '/lotus365-aviator-login/', '/lotus365-aviator/', '/aviator-game-apk/', '/aviator-2004/', '/cricket-id/', '/lotus365-ipl/', '/lotus365-win-login/'}


def text(node):
    return re.sub(r'\s+', ' ', node.text_content()).strip()


def asset_family(path):
    value = path.lower()
    if path in POLICIES: return 'policy'
    if any(word in value for word in ['contact', '/faq', 'support']): return 'support'
    if 'vip' in value: return 'vip'
    if 'aviator' in value or 'avaitor' in value: return 'aviator'
    if 'chicken' in value or 'crossy' in value: return 'chicken'
    if 'colour' in value or 'color-' in value: return 'colour'
    if 'blue' in value: return 'blue'
    if 'live' in value and not 'casino' in value: return 'live'
    if any(word in value for word in ['bonus', 'reward', 'welcome', 'christmas', 'new-year']): return 'rewards'
    if any(word in value for word in ['withdraw', 'payment', 'deposit']): return 'payments'
    if any(word in value for word in ['apk', 'app', 'download', 'installation']): return 'download'
    if any(word in value for word in ['login', 'signup', 'register', 'account', 'security', 'password', 'verification', 'scam', 'fake', 'id/']): return 'account'
    if any(word in value for word in ['cricket', 'ipl', 'wpl', 'india-vs', 'india-south', 'rajasthan', 'rcb', 'sports']): return 'cricket'
    if any(word in value for word in ['casino', 'poker', 'rummy', 'roulette', 'baccarat', 'andar-bahar', 'teen-patti', 'dragon-tiger', 'craps', 'slot']): return 'casino'
    if path == '/lotus365-win/': return 'rewards'
    return 'editorial'


def art(family, class_name='redesign-art', lazy=False):
    asset = ASSETS[family]
    return f'<img class="{class_name}" src="{asset["src"]}" width="{asset["width"]}" height="{asset["height"]}" alt="{escape_html.escape(asset["alt"], quote=True)}" {"loading=lazy" if lazy else "fetchpriority=high"}/>'


REPHRASES = [
    ('In order to ', 'To '), ('in order to ', 'to '),
    ('Despite the fact that ', 'Although '), ('despite the fact that ', 'although '),
    ('When it comes to ', 'For '), ('when it comes to ', 'for '),
    ('allows you to ', 'lets you '), ('allows users to ', 'lets players '),
    ('enables you to ', 'lets you '), ('is designed to ', 'is built to '),
    ('has been designed to ', 'was built to '), ('provides you with ', 'gives you '),
    ('make sure that ', 'check that '), ('Make sure that ', 'Check that '),
    ('It is important to note that ', ''), ('It’s important to note that ', ''),
    ('You need to ', 'You’ll need to '), ('you need to ', 'you’ll need to '),
    ('a wide variety of ', 'a broad range of '), ('a wide range of ', 'a broad choice of '),
    ('Whether you are ', 'Whether you’re '), ('whether you are ', 'whether you’re '),
    ('This means that ', 'This means '), ('this means that ', 'this means '),
    ('There are several ', 'There are a number of '),
    ('In this comprehensive guide, ', 'In this guide, '),
    ('In a nutshell, ', ''), ('At the end of the day, ', ''),
    ('It is also important to ', 'Also '), ('You have the ability to ', 'You can '),
    ('utilising', 'using'), ('Utilising', 'Using'), ('utilize', 'use'), ('utilise', 'use'),
    ('in the event that ', 'if '), ('due to the fact that ', 'because '),
    ('at this point in time', 'now'), ('in addition to', 'alongside'),
    ('get started with', 'begin using'), ('Get started with', 'Begin using'),
    ('you will be able to ', 'you can '), ('You will be able to ', 'You can '),
    ('for the purpose of ', 'for '), ('in the world of ', 'in '),
    ('It offers ', 'It provides '), ('it offers ', 'it provides '),
    ('You can easily ', 'You can '), ('you can easily ', 'you can '),
    ('Lotus 365Blue', 'Lotus365 Blue'), ('Lotus365Blue', 'Lotus365 Blue'),
    ('Lotus365 Bluelogin', 'Lotus365 Blue login'),
    ('llotuss365.com or llotuss365.com', 'llotuss365.com'),
    ('Hoto Log In', 'How to Log In'),
    ('The platform offers ', 'The platform includes '),
    ('The app offers ', 'The app includes '),
    ('You can access ', 'Access '), ('You can download ', 'Download '),
    ('You can use ', 'Use '), ('You can find ', 'Find '),
    ('You can choose ', 'Choose '), ('You can check ', 'Check '),
    ('You can select ', 'Select '), ('You can view ', 'View '),
    ('You can also ', 'You also have the option to '),
    ('After you have ', 'Once you have '), ('After completing ', 'Once you complete '),
    ('Once you have completed ', 'After completing '),
    ('Click on the ', 'Select the '), ('click on the ', 'select the '),
    ('Tap on the ', 'Tap the '), ('tap on the ', 'tap the '),
    ('such as ', 'including '), ('For example, ', 'For instance, '),
    ('for example, ', 'for instance, '),
    ('It is easy to ', 'It is straightforward to '),
    ('It’s easy to ', 'It’s straightforward to '),
    ('It is possible to ', 'You can '),
    ('You should always ', 'Always '), ('You should never ', 'Never '),
    ('Do not forget to ', 'Remember to '),
    ('This is because ', 'The reason is that '),
    ('There is no need to ', 'You do not need to '),
    ('you do not have to ', 'you do not need to '),
    ('will help you ', 'helps you '),
    ('is a great way to ', 'is a useful way to '),
    ('offers a variety of ', 'includes a range of '),
    ('a number of different ', 'several different '),
    ('at any time of the day or night', 'at any hour'),
    ('every step of the way', 'throughout the process'),
    ('simple and easy to use', 'straightforward to use'),
    ('quick and easy', 'quick and straightforward'),
    ('fast and easy', 'fast and straightforward'),
    ('quickly and easily', 'without a complicated process'),
    ('an easy-to-use interface', 'a straightforward interface'),
    ('a user-friendly interface', 'an interface built for easy navigation'),
    ('your favourite games', 'the games you enjoy'),
    ('your favorite games', 'the games you enjoy'),
    ('keep in mind that ', 'remember that '),
    ('Keep in mind that ', 'Remember that '),
    ('an additional layer of ', 'another layer of '),
    ('a seamless experience', 'a smooth experience'),
    ('seamless account access', 'smooth account access'),
    ('make informed decisions', 'base decisions on relevant information'),
    ('making informed decisions', 'basing decisions on relevant information'),
]


def polish(value):
    if not value: return value
    for before, after in REPHRASES:
        value = value.replace(before, after)
    return value


def clean_node(node, stats):
    node = copy.deepcopy(node)
    for dead in node.xpath('.//style|.//script|.//img|.//picture|.//source|.//svg|.//iframe'):
        dead.drop_tree()
    for item in node.iter():
        if not isinstance(item.tag, str): continue
        # Preserve controls and their contract verbatim; style through the scope.
        inside_form = item.tag == 'form' or bool(item.xpath('ancestor::form'))
        if not inside_form:
            if item.tag == 'a':
                href = item.get('href', '')
                if href == '/?s=blog':
                    item.set('href', '/blog/')
                elif href.startswith('/?utm_'):
                    item.set('href', '/')
            for attr in list(item.attrib):
                if attr in {'style', 'class', 'width', 'height', 'sizes', 'srcset', 'data-ast-blocks-layout'} or attr.startswith('on'):
                    del item.attrib[attr]
            for field in ['text', 'tail']:
                old = getattr(item, field)
                new = polish(old)
                if new != old: stats['editedTextNodes'] += 1
                setattr(item, field, new)
            if item.tag in ['h2', 'h3', 'h4']:
                original = text(item)
                original = re.sub(r'^(?:Question\s+\d+\s*:|Q\d+[.:])\s*', '', original, flags=re.I)
                replacement = COPY.get('headings', {}).get(original)
                if replacement:
                    for child in list(item): item.remove(child)
                    item.text = replacement
                    stats['rewrittenHeadings'] += 1
                elif original != text(item):
                    for child in list(item): item.remove(child)
                    item.text = original
                if re.match(r'^(?:How (?:do|does|can|should|is|are)\b|What (?:is|are|does|do)\b|Why\b|When\b|Where\b|Who\b|Can\b|Does\b|Do\b|Is\b|Are\b|Should\b|Will\b|Which\b)', text(item), re.I) and '?' not in text(item):
                    if not len(item): item.text = (item.text or '').rstrip('.: ') + '?'
    for empty_anchor in node.xpath('.//a'):
        if not text(empty_anchor): empty_anchor.drop_tree()
    # A relocated link must not bring along prose from its former parent.
    node.tail = None
    return node


BLOCKS = {'h1','h2','h3','h4','h5','h6','p','ul','ol','table','form','blockquote','a','button','details','dl','hr'}


def extract_blocks(entry, stats):
    blocks = []
    def walk(parent):
        if parent is not entry and parent.tag not in BLOCKS and parent.get('id'):
            marker = html.Element('span',id=parent.get('id')); marker.set('class','redesign-anchor'); blocks.append(marker)
        if parent.text and parent.text.strip() and parent.tag not in BLOCKS:
            p = html.Element('p'); p.text = parent.text; blocks.append(clean_node(p,stats))
        for child in parent:
            if not isinstance(child.tag, str): continue
            if child.tag in {'style','script','img','picture','source','svg','noscript'}: continue
            if child.tag in BLOCKS:
                if child.tag == 'h1': continue
                candidate = clean_node(child,stats)
                if text(candidate) or child.tag in {'form','hr'}:
                    blocks.append(candidate)
            else:
                walk(child)
            if child.tail and child.tail.strip():
                p = html.Element('p'); p.text = child.tail; blocks.append(clean_node(p,stats))
    walk(entry)
    # The old TOC is navigation scaffolding; section anchors are preserved below.
    cleaned = []
    for block in blocks:
        if text(block).lower() in {'table of contents','contents','on this page'}: continue
        if block.tag in {'ul','ol'}:
            links = block.xpath('.//a[@href]')
            if len(links) > 3 and all(a.get('href','').startswith('#') for a in links): continue
        cleaned.append(block)
    return cleaned


def serialize(nodes):
    return ''.join(html.tostring(n,encoding='unicode',method='html',with_tail=False) for n in nodes)


def reading_sections(blocks, path):
    sections = []; current = []
    for block in blocks:
        if block.tag == 'h2' and current:
            sections.append(current); current = []
        current.append(block)
    if current: sections.append(current)
    result = []
    for index, section in enumerate(sections):
        first = section[0]
        question = path == '/faq/' and first.tag in {'h2','h3'}
        if question and len(section)>1 and not section[1].tag.startswith('h'):
            summary = html.Element('summary')
            heading = html.Element('h2'); heading.text = text(first)
            summary.append(heading)
            if first.get('id'): summary.set('id',first.get('id'))
            details = html.Element('details'); details.set('class','redesign-answer')
            details.append(summary)
            for item in section[1:]: details.append(item)
            result.append(html.tostring(details,encoding='unicode',method='html'))
        else:
            result.append(f'<section class="redesign-section" data-section="{index}">{serialize(section)}</section>')
    return ''.join(result)


def archive(path):
    return bool(re.match(r'^/(?:tag|category|author)/',path) or path.startswith('/blog/'))


def archive_title(path,page):
    if path.startswith('/blog/'): return 'Lotus365 Blog & Guides'
    if path.startswith('/author/'): return 'Lotus365 Articles'
    pieces = path.strip('/').split('/')
    if 'page' in pieces: pieces = pieces[:pieces.index('page')]
    subject = pieces[-1].replace('-',' ')
    subject = re.sub(r'lotus\s*365', 'Lotus365', subject, flags=re.I)
    return subject[:1].upper()+subject[1:]+' Guides'


def archive_body(path,page,tree,family):
    title = archive_title(path,page)
    cards = []
    for article in tree.xpath('//*[@id="primary"]//article'):
        heading = article.xpath('.//h2[contains(@class,"entry-title")]//a[@href]')
        if not heading: continue
        href = heading[0].get('href'); label = text(heading[0]); target = PAGES.get(href)
        excerpt = COPY['intros'].get(href)
        if not excerpt:
            paras = article.xpath('.//p')
            excerpt = polish(text(paras[0])) if paras else (target or {}).get('description','')
        excerpt = excerpt or f'Read the {label} article and its detailed guidance.'
        cards.append(f'<article class="redesign-archive-item"><a class="redesign-thumbnail" href="{escape_html.escape(href,quote=True)}" tabindex="-1" aria-hidden="true">{art(asset_family(href),"redesign-thumbnail-image",True)}</a><div><h2><a href="{escape_html.escape(href,quote=True)}">{escape_html.escape(label)}</a></h2><p>{escape_html.escape(excerpt[:420])}</p><a class="redesign-read" href="{escape_html.escape(href,quote=True)}">Read article</a></div></article>')
    pagination = tree.xpath('//*[@id="primary"]//*[contains(concat(" ",normalize-space(@class)," ")," ast-pagination ") or contains(concat(" ",normalize-space(@class)," ")," navigation ")]')
    pagination_nodes = [copy.deepcopy(p) for p in pagination[:1]]
    for wrapper in pagination_nodes:
        for item in wrapper.iter(): item.attrib.pop('style',None)
    pagination_html = serialize(pagination_nodes)
    intro = f'Browse {title.lower().replace("lotus365","Lotus365")} for account help, practical explanations and related articles. Choose a story to read the full details.'
    if path.startswith('/blog/'):
        intro = 'Explore Lotus365 account guides, game explanations, cricket coverage and platform comparisons. Choose an article to read the full story.'
    if path.startswith('/author/'):
        intro = 'Read the Lotus365 editorial collection, including account guidance, sports coverage and game explanations.'
    return f'<div class="redesign redesign-layout-archive"><header class="redesign-mast"><div><h1>{escape_html.escape(title)}</h1><p class="redesign-lede">{escape_html.escape(intro)}</p></div>{art(family)}</header><div class="redesign-archive-list">{"".join(cards)}</div><nav class="redesign-pagination" aria-label="Article pagination">{pagination_html}</nav></div>'


def content_body(path,page,tree,family,stats):
    entry = tree.xpath('//*[@id="primary"]//*[contains(concat(" ",normalize-space(@class)," ")," entry-content ")]')[0]
    heads = tree.xpath('//*[@id="primary"]//h1')
    title = text(heads[0]) if heads else page['title'].split('|')[0].strip()
    title_id = f' id="{escape_html.escape(heads[0].get("id"),quote=True)}"' if heads and heads[0].get('id') else ''
    if path == '/faq/': title = 'Lotus365 FAQs: Account, App & Player Help'
    intro = COPY['intros'].get(path)
    if not intro: raise ValueError(f'Missing reviewed introduction: {path}')
    blocks = extract_blocks(entry,stats)
    sections = reading_sections(blocks,path)
    layout = 'reading'
    if path in POLICIES: layout = 'policy'
    elif path == '/faq/': layout = 'faq'
    elif path == '/contact-us/': layout = 'support'
    elif path == '/about-lotus365/': layout = 'story'
    elif path in NAV:
        layout = 'membership' if 'vip' in path else 'sports' if path in {'/lotus365-live/','/lotus365-ipl/','/cricket-id/'} else 'flight' if 'aviator' in path else 'access' if 'login' in path else 'feature'
    related = '<aside class="redesign-reading-aside"><h2>Useful Links</h2><a href="/lotus365-login/">Lotus365 Login</a><a href="/lotus365-signup/">Create a Lotus365 ID</a><a href="/lotus365-app/">Lotus365 App</a><a href="/contact-us/">Contact Us</a></aside>'
    return f'<div class="redesign redesign-layout-{layout}" data-topic="{family}"><header class="redesign-mast"><div><h1{title_id}>{escape_html.escape(title)}</h1><p class="redesign-lede">{escape_html.escape(intro)}</p></div>{art(family)}</header><div class="redesign-reading-layout"><div class="redesign-sections">{sections}</div>{related}</div></div>',layout


def main():
    records = {}; reports = []
    for path,page in PAGES.items():
        if path in SKIP: continue
        tree = html.fragment_fromstring(page['html'],create_parent='div')
        primary = tree.xpath('//*[@id="primary"]')[0]
        stats = Counter(); family = asset_family(path)
        if archive(path):
            body = archive_body(path,page,tree,family); layout = 'archive'
        else:
            body,layout = content_body(path,page,tree,family,stats)
        replacement = html.fragment_fromstring(body)
        # Keep the existing comment/contact controls and related navigation.
        original_forms = primary.xpath('.//form')
        forms = replacement.xpath('.//form')
        signatures = Counter(f.get('data-redirect-form','') for f in forms)
        for source_form in original_forms:
            kind = source_form.get('data-redirect-form','')
            if signatures[kind]: signatures[kind] -= 1; continue
            form_section = html.Element('section',attrib={'class':'redesign-form-section'})
            # Comment links still point to #respond after the old wrapper is removed.
            if kind == 'comment' and source_form.xpath('ancestor::*[@id="respond"]'):
                form_section.set('id', 'respond')
            title_el = html.Element('h2'); title_el.text = 'Leave a Comment' if kind == 'comment' else 'Contact Form'
            form_section.append(title_el); form_section.append(clean_node(source_form,stats)); replacement.append(form_section)
        used = {(a.get('href'),a.get('data-external-reference')) for a in replacement.xpath('.//a[@href]')}
        extras = []; seen = set()
        for a in primary.xpath('.//a[@href]'):
            key = (a.get('href'),a.get('data-external-reference'))
            if key in used or key in seen or not text(a) or a.get('href','').startswith('#') and not key[1]: continue
            seen.add(key); extras.append(clean_node(a,stats))
        if extras:
            resources = html.Element('nav',attrib={'class':'redesign-resources','aria-label':'Related page resources'})
            title_el = html.Element('h2'); title_el.text = 'Related Pages'; resources.append(title_el)
            for a in extras: resources.append(a)
            replacement.append(resources)
        # Preserve all source IDs, including bookmarked headings and form labels.
        kept = set(replacement.xpath('.//*[@id]/@id'))
        omitted_ids = set(primary.xpath('.//*[@id]/@id')) - kept
        for id_value in sorted(omitted_ids):
            if id_value == 'main' or id_value.startswith(('post-','comment','respond','reply','wp','ez-toc')): continue
            marker = html.Element('span',id=id_value); marker.set('class','redesign-anchor')
            replacement.append(marker)
        primary.clear(keep_tail=True); primary.set('id','primary'); primary.set('class','content-area primary')
        main_el = html.Element('main',id='main',attrib={'class':'site-main'});main_el.append(replacement);primary.append(main_el)
        for sidebar in tree.xpath('//*[@id="secondary"]'): sidebar.drop_tree()
        for old_archive_header in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," ast-archive-description ")]'):
            old_archive_header.drop_tree()
        for old_banner in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," ast-archive-entry-banner ") or contains(concat(" ",normalize-space(@class)," ")," ast-single-entry-banner ")]'):
            old_banner.drop_tree()
        for old_heading in tree.xpath('//h1[not(ancestor::*[@id="primary"])]'):
            old_heading.drop_tree()
        rendered = (tree.text or '')+''.join(html.tostring(n,encoding='unicode',method='html') for n in tree)
        records[path] = {'html':rendered,'layout':layout,'topic':family}
        reports.append({'path':path,'layout':layout,'topic':family,**dict(stats)})
    (ROOT/'data/redesigned-pages.json').write_text(json.dumps(records,ensure_ascii=False),encoding='utf-8')
    (ROOT/'data/redesign-audit.json').write_text(json.dumps({'routes':len(records),'layouts':dict(Counter(r['layout'] for r in reports)),'pages':reports},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Redesigned {len(records)} routes. Layouts: {dict(Counter(r["layout"] for r in reports))}')


if __name__ == '__main__': main()
