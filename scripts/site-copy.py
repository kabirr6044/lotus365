"""Publisher copy cleanup shared by capture regeneration and editorial overrides."""
import json
import re
from pathlib import Path
from lxml import html

RULES = json.loads((Path(__file__).resolve().parents[1] /
                   'data/site-copy-cleanup.json').read_text(encoding='utf-8'))
DOMAIN = re.compile(r'(?<![\w@.-])(?:https?://)?(?:www\.)?(?:' +
                    '|'.join(re.escape(domain) for domain in RULES['publisherDomains']) +
                    r')(?![\w-]|\.[a-z0-9])(?:/[a-z0-9/-]*)?', re.I)
EMAIL = re.compile(r'(?<![\w.+-])[\w.+-]+@(?:lotus365\.com|lottuss365\.co|'
                   r'lotus365\.win|lotus365b\.com)\b|lotus365official@gmail\.com', re.I)


def clean_text(text):
    if not text:
        return text
    text = EMAIL.sub('the Contact Us page', text)
    text = re.sub(r'\[web:\d+\]', '', text)
    for before, after in RULES['textReplacements'].items():
        text = text.replace(before, after)

    def destination(match):
        value = match.group(0)
        suffix = re.sub(r'^(?:https?://)?(?:www\.)?[^/]+', '', value)
        route = RULES['routes'].get(suffix.rstrip('/'), suffix)
        return ('https://' if value.lower().startswith('http') else '') + 'llotuss365.com' + route

    return DOMAIN.sub(destination, text)


def clean_editorial(value):
    if isinstance(value, str):
        return clean_text(value)
    if isinstance(value, list):
        return [clean_editorial(item) for item in value]
    if isinstance(value, dict):
        return {key: clean_editorial(item) for key, item in value.items()}
    return value


def clean_pages(records):
    for page in records.values():
        tree = html.fragment_fromstring(page['html'], create_parent='div')
        original = html.tostring(tree, encoding='unicode', method='html')
        # Fix visible copy throughout the page, including archive excerpts and
        # accessibility labels, while leaving assets, CSS, IDs and routes intact.
        for element in tree.iter():
            if element.tag in ('script', 'style'):
                continue
            for field in ('text', 'tail'):
                setattr(element, field, clean_text(getattr(element, field)))
            for attribute in ('alt', 'title', 'aria-label'):
                if attribute in element.attrib and not (
                        attribute == 'title' and 'data-external-reference' in element.attrib):
                    element.set(attribute, clean_text(element.get(attribute)))
        for element in tree.xpath('.//a'):
            if element.get('data-external-reference') in RULES.get('removedExternalReferences', []):
                parent = element.getparent()
                if parent is not None and parent.tag == 'li' and len(parent) == 1:
                    parent.drop_tree()
                else:
                    element.drop_tree()
                continue
            if 'the Contact Us page' in element.text_content():
                element.set('href', '/contact-us/')
                for attribute in ('data-external-reference', 'aria-disabled', 'title', 'target', 'rel'):
                    element.attrib.pop(attribute, None)
        primary = tree.get_element_by_id('primary', tree)
        for element in primary.xpath('.//p|.//li[not(.//li)]'):
            if 'the Contact Us page' in element.text_content():
                for node in element.iter():
                    for field in ('text', 'tail'):
                        value = getattr(node, field)
                        if value:
                            for before, after in (
                                ('Email address:', 'Support:'),
                                ('Email:', 'Support:'),
                                ('Email Support', 'Support'),
                                ('Send email to:', 'For support, visit:'),
                                ('Email support@', 'Contact support@'),
                                ('(example, verify from official site)', ''),
                            ):
                                value = value.replace(before, after)
                            setattr(node, field, value)
        for rule in RULES['blocks'].get(page['path'], []):
            for element in primary.xpath(rule['selector']):
                text = ' '.join(element.text_content().split())
                if rule['contains'] not in text:
                    continue
                for child in list(element):
                    element.remove(child)
                replacement = html.fragment_fromstring(rule['html'], create_parent='div')
                element.text = replacement.text
                for child in list(replacement):
                    element.append(child)
        # React supplies the shared responsive header. Parse the captured markup
        # before removing legacy headers: the source contains unbalanced wrappers.
        for legacy in tree.xpath('.//header[@id="masthead" or @id="ast-fixed-header"]'):
            if legacy.getparent() is not None:
                legacy.drop_tree()
        for floating_app in tree.xpath('.//a[contains(concat(" ", normalize-space(@class), " "), " lotus365-app-float ")]'):
            floating_app.drop_tree()
        if html.tostring(tree, encoding='unicode', method='html') != original:
            page['html'] = (tree.text or '') + ''.join(
                html.tostring(child, encoding='unicode', method='html') for child in tree)
        for field in ('title', 'description'):
            page[field] = clean_text(page[field])
