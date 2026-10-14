// Run through the connected Chrome CUA runtime, never a separate browser driver.
import fs from 'node:fs/promises';
const root = 'E:/XYZ/Lotus365';
export function readStyles() {
 const props = ['fontFamily','fontSize','fontWeight','lineHeight','marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft','maxWidth','color'];
 const selectors = '#masthead,#content,#content>.ast-container,#primary,article,.entry-content,.entry-header,h1,h2,h3,h4,h5,h6,h1 strong,h2 strong,h3 strong,h4 strong,.entry-content p,.entry-content ul,.entry-content ol,.entry-content figure,.entry-content table';
 return {url:location.href,width:innerWidth,bodyClass:document.body.className,items:[...document.querySelectorAll(selectors)].map((e,i)=>{
  const s=getComputedStyle(e),r=e.getBoundingClientRect();
  return {i,tag:e.tagName,cls:e.className,text:(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,100),rect:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100),style:Object.fromEntries(props.map(p=>[p,s[p]]))};
 })};
}
export function compare(path,r,l) {
 const differences=[],seen=new Map();let matched=0;
 for(const a of r.items){
  const key=a.tag+'|'+a.cls+'|'+a.text,n=seen.get(key)||0;seen.set(key,n+1);
  const b=l.items.filter(b=>b.tag===a.tag&&b.text===a.text&&b.cls===a.cls)[n];if(!b)continue;matched++;
  const css=Object.fromEntries(Object.keys(a.style).filter(k=>a.style[k]!==b.style[k]).map(k=>[k,[a.style[k],b.style[k]]]));
  const box=a.rect.map((v,i)=>Math.round((b.rect[i]-v)*100)/100);
  if(Object.keys(css).length||box.some(v=>Math.abs(v)>1))differences.push({tag:a.tag,cls:a.cls,text:a.text,occurrence:n,css,box});
 }
 return {path,referenceUrl:r.url,localUrl:l.url,referenceElements:r.items.length,localElements:l.items.length,matched,differences};
}
export async function createAudit(reference,local) {
 const pages=JSON.parse(await fs.readFile(root+'/data/pages.json','utf8'));
 const paths=Object.keys(pages);
 const results=JSON.parse(await fs.readFile(root+'/data/visual-audit-after.json','utf8').catch(()=> '[]'));
 return {paths,results,async batch(count=20){
  const started=Date.now(),recent=[];
  for(const path of paths.filter(p=>!results.some(r=>r.path===p)).slice(0,count)){
   let result;
   try{
    await reference.goto('https://lottuss365.co'+encodeURI(path));
    await local.goto('http://localhost:3000'+encodeURI(path));
    await local.playwright.locator('.replica-document[data-page-ready]').waitFor({state:'attached',timeoutMs:10000});
    await reference.playwright.waitForLoadState({state:'load',timeoutMs:10000});
    await local.playwright.waitForLoadState({state:'load',timeoutMs:10000});
    const r=await reference.playwright.evaluate(readStyles),l=await local.playwright.evaluate(readStyles);
    if(!r.items.length||!l.items.length)throw new Error('Page did not render site content');
    result=compare(path,r,l);
   }catch(e){result={path,error:String(e)};}
   results.push(result);recent.push(result);
   await fs.writeFile(root+'/data/visual-audit-after.json',JSON.stringify(results,null,2));
   if(Date.now()-started>40000)break;
  }
  return {checked:results.length,total:paths.length,errors:recent.filter(r=>r.error),cssDifferences:recent.flatMap(r=>r.differences?.filter(d=>Object.keys(d.css).length).map(d=>({path:r.path,tag:d.tag,text:d.text,css:d.css}))||[])};
 }};
}
