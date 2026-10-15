"""Convert observed public DOM snapshots into inert, local Next.js page content."""
import json,re,hashlib,shutil,html
from pathlib import Path
from urllib.parse import urlparse,urljoin,unquote
from lxml import html as dom,etree
ROOT=Path(__file__).resolve().parents[1]
def dump(path,data):
 path.parent.mkdir(parents=True,exist_ok=True)
 temporary=path.with_suffix(path.suffix+'.tmp')
 temporary.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
 temporary.replace(path)
assets=json.loads((ROOT/'data/asset-ledger.json').read_text(encoding='utf-8'))
by_url={a['url']:a for a in assets}
for f in (ROOT/'data/source').glob('*.json'):
 p=json.loads(f.read_text(encoding='utf-8'))
 for a in p.get('assets',[]):by_url[a['url']]=a
assets=list(by_url.values())
dump(ROOT/'data/asset-ledger.json',assets)
assetmap={}; stylesheet=[]
for a in assets:
 source=Path(a['path'])
 suffix=source.suffix or ('.css' if a['kind']=='stylesheet' else '.bin')
 target=ROOT/'public/assets'/(a['id']+suffix);target.parent.mkdir(parents=True,exist_ok=True)
 if not source.exists():source=target
 if not source.exists():continue
 if source.resolve()!=target.resolve():shutil.copyfile(source,target)
 assetmap[a['url']]='/assets/'+target.name
 if a['kind']=='stylesheet' and assetmap[a['url']] not in stylesheet:stylesheet.append(assetmap[a['url']])
def local_asset(url):return assetmap.get(url,url)
for url,target in assetmap.items():
 if target.endswith('.css'):
  p=ROOT/'public'/target.lstrip('/');text=p.read_text(encoding='utf-8')
  for original,local in assetmap.items():text=text.replace(original,local)
  p.write_text(text,encoding='utf-8')
aliases={}
for f in (ROOT/'data/source').glob('*.json'):
 p=json.loads(f.read_text(encoding='utf-8'))
 if p.get('requestedPath') and p['requestedPath']!=p['path']:aliases[unquote(p['requestedPath'])]=unquote(p['path'])
dump(ROOT/'data/aliases.json',aliases)
records={}; external={}; missing_assets=set(); source_links=set(); incomplete=[]
stylesheet_cache={}
for file in (ROOT/'data/source').glob('*.json'):
 p=json.loads(file.read_text(encoding='utf-8'));path=unquote(p.get('path','/'))
 if path.startswith('/_assets/'):continue
 source=''.join(p.get('htmlParts',[])) or p.get('html','')
 # Verified against the live Hindi article during the case-sensitive text audit.
 if path=='/cricket-id-ind-vs-nz-2nd-odi/':source=source.replace('\ufffd\ufffdी','भी')
 if '[Truncated]' in source or not source.endswith('</html>'):incomplete.append(path);continue
 tree=dom.fromstring(source);bodies=tree.xpath('//body')
 if not bodies:incomplete.append(path);continue
 body=bodies[0];classes=body.get('class','')
 style_parts=[s.text or '' for s in tree.xpath('//head/style')]
 # Preserve the actual cascade, including the page's particular Astra addon.
 # Loading every captured stylesheet globally changes archive spacing and weights.
 ordered_styles=[]
 for node in tree.xpath('//head/style|//head/link[@rel="stylesheet"]'):
  if node.tag=='style':part=node.text or ''
  else:
   url=urljoin('https://lottuss365.co'+path,node.get('href',''))
   local=assetmap.get(url)
   if not local:raise ValueError('Unmapped page stylesheet: '+url)
   if local not in stylesheet_cache:stylesheet_cache[local]=(ROOT/'public'/local.lstrip('/')).read_text(encoding='utf-8')
   part=stylesheet_cache[local]
  for original,local in assetmap.items():part=part.replace(original,local)
  ordered_styles.append(part)
 ordered_css='\n'.join(ordered_styles)
 page_stylesheet='/assets/page-'+hashlib.sha256(ordered_css.encode()).hexdigest()[:20]+'.css'
 (ROOT/'public'/page_stylesheet.lstrip('/')).write_text(ordered_css,encoding='utf-8')
 for node in body.xpath('.//script|.//noscript|.//iframe|.//object|.//embed|.//*[@data-codex-agent-overlay-root]|.//*[@id="wpadminbar"]'):
  if node.tag=='iframe' and 'youtube.com/embed/06KT3Wmx7yU' in (node.get('data-src') or node.get('src') or ''):
   # The live reference displays an unavailable-video state. Preserve its
   # observed pixels and dimensions locally, with the shared destination link.
   url=node.get('data-src') or node.get('src');label=node.get('title','YouTube video')
   rid='ext-'+hashlib.sha256(url.encode()).hexdigest()[:12]
   external[rid]={'id':rid,'url':url,'labels':[label],'pages':[path]}
   for child in list(node):node.remove(child)
   node.tag='a';node.attrib.clear();node.text=None
   for key,value in {'href':'#','data-external-reference':rid,'aria-disabled':'true','aria-label':label,'title':'External destination pending configuration','style':'position:absolute;inset:0;display:block'}.items():node.set(key,value)
   image=etree.SubElement(node,'img',{'src':'/assets/reference-video-unavailable.png','alt':label,'style':'display:block;width:100%;height:100%;object-fit:fill'})
  elif node.tag in ('script','noscript'):
   # These invisible source nodes still affect :last-child and sibling CSS.
   # Keep their position without retaining executable code or fallback assets.
   for child in list(node):node.remove(child)
   node.tag='span';node.attrib.clear();node.text=None
   node.set('hidden','');node.set('data-reference-placeholder','')
   node.set('style','display:none!important')
  else:node.drop_tree()
 for el in body.iter():
  if not isinstance(el.tag,str):continue
  for key in list(el.attrib):
   if key.lower().startswith('on') or key in ('srcdoc','ping'):el.attrib.pop(key,None)
  if el.tag=='a':
   href=el.get('href','')
   if not href:continue
   absolute=urljoin('https://lottuss365.co'+path,href);u=urlparse(absolute)
   if href.startswith('#'):continue
   if u.hostname=='lottuss365.co' and u.scheme in ('http','https'):
    dest=unquote(u.path);dest=dest if dest=='/' or '.' in dest.rsplit('/',1)[-1] else dest.rstrip('/')+'/'
    if dest=='/sitemap_index.xml':dest='/sitemap.xml'
    dest=aliases.get(dest,dest)
    if dest.startswith('/wp-content/'):
     dest=local_asset(absolute)
     if absolute not in assetmap:missing_assets.add(absolute)
    if u.query and ('replytocom=' in u.query):el.set('href','#respond')
    else:el.set('href',dest+('?' + u.query if u.query else '')+('#'+u.fragment if u.fragment else ''));source_links.add(dest) if dest!='#' else None
   else:
    rid='ext-'+hashlib.sha256(absolute.encode()).hexdigest()[:12]
    if rid not in external:external[rid]={'id':rid,'url':absolute,'labels':[],'pages':[]}
    e=external[rid];label=' '.join(el.text_content().split()) or el.get('aria-label') or el.get('title') or 'Image/icon link'
    if label not in e['labels']:e['labels'].append(label)
    if path not in e['pages']:e['pages'].append(path)
    el.set('data-external-reference',rid);el.set('href','#');el.set('aria-disabled','true');el.set('title','External destination pending configuration');el.attrib.pop('target',None)
  if el.tag in ('img','source'):
   src=el.get('data-src') or el.get('src')
   if src:
    if src.startswith('/assets/') and (ROOT/'public'/src.lstrip('/')).exists():el.set('src',src)
    else:
     src=urljoin('https://lottuss365.co'+path,src);el.set('src',local_asset(src))
     if src not in assetmap and not src.startswith('data:'):missing_assets.add(src)
   srcset=el.get('data-srcset') or el.get('srcset')
   if srcset:
    # Prefer the observed original image over unsaved responsive derivatives.
    el.attrib.pop('srcset',None)
   for key in ('data-src','data-srcset','data-sizes','data-lazy-src','data-lazy-srcset'):el.attrib.pop(key,None)
   # Load local images immediately so intrinsic dimensions match the reference
   # placeholders before the user scrolls to below-the-fold content.
   el.set('loading','eager');el.set('decoding','async')
   el.set('class',' '.join(c for c in el.get('class','').split() if c not in ('lazyload','lazyloading')))
  if el.tag=='style' and el.text:
   for original,local in assetmap.items():el.text=el.text.replace(original,local)
 for f in body.xpath('.//form'):
  kind='comment' if 'comment-form' in f.get('class','') or f.get('id') in ('commentform','ast-commentform') else 'search' if 'search-form' in f.get('class','') else 'signup' if f.get('id')=='lotus365-style-form' else 'login' if 'lotus365-login-form' in f.get('class','') else 'contact'
  f.set('data-redirect-form',kind);f.set('action','#');f.set('method','dialog');f.set('autocomplete','off')
  for hidden in f.xpath('.//input[@type="hidden"]'):hidden.drop_tree()
  for field in f.xpath('.//input|.//textarea'):
   typ=field.get('type','');name=field.get('name','')
   if typ=='password':
    field.attrib.pop('name',None);field.set('autocomplete','off');field.set('required','')
   if name=='username':
    field.set('name','identifier');field.set('required','')
   if name=='mobile_number':
    field.set('name','phone');field.set('type','tel');field.set('required','');field.set('pattern',r'\+?[0-9\s\-\(\)]{7,30}');field.set('inputmode','tel')
   if name=='referral_code':field.set('name','referral')
   if name=='author':field.set('name','name')
   if name=='comment':field.set('name','message')
   if name=='url':field.set('name','website')
   if name=='s':field.set('name','query');field.set('required','')
   if field.get('type') not in ('checkbox','submit','password'):field.set('maxlength','5000' if field.tag=='textarea' else '200')
  for button in f.xpath('.//button[@type="submit"]|.//input[@type="submit"]'):button.set('data-submit-control','')
  if kind=='login':
   for a in f.xpath('.//a[contains(@class,"login-button")]'):
    a.tag='button';a.set('type','submit');a.set('data-submit-control','')
    for key in ('href','target','rel','aria-disabled','data-external-reference','title'):a.attrib.pop(key,None)
  if kind=='signup':
   for button in f.xpath('.//button[@type="submit"]'):
    # Keep the reference copy and yellow label, but remove the nested outbound
    # anchor so it cannot bypass the enclosing form's required-field validation.
    for link in button.xpath('.//a'):
     link.tag='span';link.attrib.clear()
     link.set('style','color:#ffd000')
  status=etree.Element('p',{'class':'form-status','role':'status','aria-live':'polite'});f.append(status)
 # Replace source sitemaps and remove any source platform endpoints from forms.
 text=dom.tostring(body,encoding='unicode',method='html')
 text=text[text.find('>')+1:text.rfind('</body>')]
 css='\n'.join(style_parts)
 for original,local in assetmap.items():css=css.replace(original,local)
 style_links=[]
 for css_part in style_parts:
  for original,local in assetmap.items():css_part=css_part.replace(original,local)
  if not css_part.strip():continue
  css_id=hashlib.sha256(css_part.encode()).hexdigest()[:16]
  css_path='/assets/inline-'+css_id+'.css'
  (ROOT/'public'/css_path.lstrip('/')).write_text(css_part,encoding='utf-8')
  style_links.append(css_path)
 description=tree.xpath('//meta[@name="description"]/@content')
 records[path]={'path':path,'title':p['title'],'lang':p.get('lang','en-US'),'bodyClass':classes,'html':text,'styleLinks':style_links,'stylesheet':page_stylesheet,'description':description[0] if description else ''}
from runpy import run_path
run_path(str(ROOT/'scripts/apply-editorial.py'))['apply_overrides'](records)
removed_references=json.loads((ROOT/'data/site-copy-cleanup.json').read_text(encoding='utf-8')).get('removedExternalReferences',[])
external={key:value for key,value in external.items() if key not in removed_references}
dump(ROOT/'data/pages.json',records);dump(ROOT/'data/stylesheets.json',stylesheet);dump(ROOT/'data/external-links.json',list(external.values()));dump(ROOT/'data/assets.json',assetmap)
dump(ROOT/'data/content-audit.json',{'pageCount':len(records),'incomplete':incomplete,'externalDestinationCount':len(external),'remoteAssets':sorted(missing_assets),'unresolvedInternalLinks':sorted(x for x in source_links-set(records)-{'/sitemap.xml','/feed/','/comments/feed/'} if not x.startswith('/assets/'))})
rows=['# External link references','', 'Original destinations are retained for reference. All external links and validated forms use the single NEXT_PUBLIC_DESTINATION_URL environment variable. They stay inactive until that URL is configured. Internal navigation remains local.','','| Reference | Original destination | Labels | Source pages |','|---|---|---|---|']
for e in external.values():rows.append('| '+e['id']+' | '+e['url'].replace('|','%7C')+' | '+', '.join(e['labels']).replace('|','/')+' | '+', '.join(e['pages'])+' |')
(ROOT/'EXTERNAL_LINKS.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(records),'incomplete':len(incomplete),'assets':len(assetmap),'externalDestinations':len(external),'remoteAssets':len(missing_assets)},indent=2))
