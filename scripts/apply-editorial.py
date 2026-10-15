"""Apply reviewed page copy while preserving navigation, forms and inline markup.

Run with the same Python/lxml environment as prepare-content.py. Overrides are
also applied by that generator, so refreshing captures retains editorial copy.
"""
import copy
import json
import re
from collections import Counter
from pathlib import Path
from lxml import html

ROOT = Path(__file__).resolve().parents[1]


def normalized(element):
    return ' '.join(element.text_content().split())


def replace_text(element, text):
    """Retain the existing emphasis wrappers and their styling."""
    slots = []
    for node in element.iter():
        if node.text and node.text.strip():
            slots.append((node, 'text'))
        if node is not element and node.tail and node.tail.strip():
            slots.append((node, 'tail'))
    if not slots:
        raise ValueError('Cannot rewrite an empty element')
    for node, field in slots:
        setattr(node, field, '')
    setattr(*slots[0], text)


def replace_paragraph(element, rule):
    children = list(element)
    tokens = [int(token) for token in re.findall(r'\{(\d+)\}', rule['template'])]
    if sorted(tokens) != list(range(len(children))):
        raise ValueError('Every existing inline child must appear exactly once')
    for index, text in rule.get('childText', {}).items():
        replace_text(children[int(index)], text)
    for edit in rule.get('textEdits', []):
        matches = [(node, field) for node in element.iter()
                   for field in ('text', 'tail')
                   if getattr(node, field) == edit['before']]
        if len(matches) != 1:
            raise ValueError('Inline text correction must match exactly one text node')
        setattr(*matches[0], edit['after'])
    # Escape authored prose; only the original child elements supply markup.
    parts = re.split(r'(\{\d+\})', rule['template'])
    for child in children:
        element.remove(child)
        child.tail = None
    element.text = ''
    last = None
    for part in parts:
        match = re.fullmatch(r'\{(\d+)\}', part)
        if match:
            last = children[int(match.group(1))]
            element.append(last)
        elif last is None:
            element.text += part
        else:
            last.tail = (last.tail or '') + part


def clean_policy_references(records):
    """Remove unprovided publisher details from policy captures on every refresh."""
    def rewrite(element, markup):
        for child in list(element):
            element.remove(child)
        fragment = html.fragment_fromstring(markup, create_parent='div')
        element.text = fragment.text
        for child in list(fragment):
            element.append(child)

    for path in ('/cookies/', '/privacy/'):
        page = records[path]
        tree = html.fragment_fromstring(page['html'], create_parent='div')
        primary = tree.get_element_by_id('primary')
        for element in primary.iter():
            for field in ('text', 'tail'):
                text = getattr(element, field)
                if text:
                    setattr(element, field, re.sub(
                        r'(?<![\w@])(?:lottuss365|lotus365)\.com\b',
                        'llotuss365.com', text))
        for element in primary.xpath('.//p|.//li'):
            text = normalized(element)
            if 'Who We Are (Controller):' in text:
                rewrite(element, '<strong>Website:</strong> llotuss365.com')
            elif '[Manage Cookie Preferences]' in text:
                rewrite(element, '<strong>Browser Cookie Settings:</strong> '
                        'Use your browser settings to review, block or delete cookies.')
            elif text.startswith('For questions or to exercise privacy rights, contact:'):
                rewrite(element, 'For questions or to exercise privacy rights, '
                        'visit our <a href="/contact-us/">Contact Us page</a>.')
            elif 'privacy@365login.com' in text:
                for node in element.iter():
                    for field in ('text', 'tail'):
                        value = getattr(node, field)
                        if value:
                            setattr(node, field, value.replace(
                                'personal data, contact ', 'personal data, visit '))
                for wrapper in list(element.xpath('.//strong[contains(., "privacy@365login.com")]')):
                    if wrapper.getparent() is not None and wrapper in element.iterdescendants():
                        rewrite(wrapper, '<a href="/contact-us/">our Contact Us page</a>')
            elif 'privacy@365lotus.com' in text:
                rewrite(element, 'For privacy inquiries, visit the '
                        '<a href="/contact-us/">llotuss365.com Contact Us page</a>.')
        page['html'] = (tree.text or '') + ''.join(
            html.tostring(child, encoding='unicode', method='html') for child in tree)


def apply_overrides(records):
    clean_policy_references(records)
    overrides = json.loads((ROOT / 'data/editorial-overrides.json').read_text(encoding='utf-8'))
    for path, editorial in overrides.items():
        page = records[path]
        original = html.fragment_fromstring(page['html'], create_parent='div')
        tree = copy.deepcopy(original)
        primary = tree.get_element_by_id('primary')
        heading_changes = {}
        for rule in editorial['headings']:
            candidates = [el for el in primary.xpath('.//h1|.//h2|.//h3')
                          if normalized(el) == rule['before'] and
                          (not rule.get('tag') or el.tag == rule['tag'])]
            if not candidates:
                if any(normalized(el) == rule['after'] for el in primary.xpath('.//h1|.//h2|.//h3')):
                    continue
                raise ValueError(f"Missing heading in {path}: {rule['before']}")
            for element in candidates:
                identifier = element.get('id')
                if identifier:
                    heading_changes['#' + identifier] = rule['after']
                replace_text(element, rule['after'])
        for rule in editorial['paragraphs']:
            candidates = [el for el in primary.xpath('.//p[not(ancestor::form)]')
                          if normalized(el) == rule['before']]
            if not candidates:
                if any(normalized(el) == rule['after'] for el in primary.xpath('.//p[not(ancestor::form)]')):
                    continue
                raise ValueError(f"Missing paragraph in {path}: {rule['before'][:90]}")
            if len(candidates) != 1:
                raise ValueError(f'Ambiguous paragraph in {path}')
            replace_paragraph(candidates[0], rule)
            if normalized(candidates[0]) != rule['after']:
                raise ValueError(f'Unexpected paragraph result in {path}')
            # Keep amounts, percentages, timings and other numerical assertions.
            # "Lotus 365" may be normalised to the joined brand spelling.
            numbers = lambda text: Counter(token for token in re.findall(
                r'(?<!\w)\d+(?:[.,]\d+)*(?:%|\+|x)?', text) if token != '365')
            if numbers(rule['before']) - numbers(rule['after']):
                raise ValueError(f'Editorial copy removed numerical assertions: {path}')
        for anchor in primary.xpath('.//a[@href]'):
            if anchor.get('href') in heading_changes:
                replace_text(anchor, heading_changes[anchor.get('href')])
        # Editing copy must never change attributes, element order, controls,
        # URLs, image sources, IDs, or CSS hooks anywhere in the page.
        signature = lambda root: [(el.tag, sorted(el.attrib.items())) for el in root.iter()]
        if signature(tree) != signature(original):
            raise ValueError(f'Editorial copy changed page structure: {path}')
        page['html'] = (tree.text or '') + ''.join(
            html.tostring(child, encoding='unicode', method='html') for child in tree)
        page['title'] = editorial['title']
        page['description'] = editorial['description']
    return len(overrides)


if __name__ == '__main__':
    destination = ROOT / 'data/pages.json'
    records = json.loads(destination.read_text(encoding='utf-8'))
    count = apply_overrides(records)
    temporary = destination.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(records, ensure_ascii=False), encoding='utf-8')
    temporary.replace(destination)
    print(f'Applied editorial copy to {count} main pages.')
