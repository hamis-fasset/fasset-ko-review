// Render one side of the live review tool for QA, at native pixel size.
// usage: SIDE=ko|en node export-ko.js <base-url> <out-dir> [id ...]
const fs=require('fs'), path=require('path'); const {chromium}=require('playwright-core');
const SITE=process.env.SITE||path.join(process.env.HOME,'Downloads/fasset-ko-work/site');
const SIDE=process.env.SIDE==='en'?'en':'ko';
const CHROME=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [base,out,...ids]=process.argv.slice(2);
(async()=>{
  let list=ids;
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:CHROME});
  const ctx=await browser.newContext({viewport:{width:1300,height:1300},deviceScaleFactor:2});
  const page=await ctx.newPage(); const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  let n=0,loaded=false;
  await page.goto(`${base}?export=${SIDE}`,{waitUntil:'load'}); loaded=true;
  await page.waitForFunction(()=>Array.isArray(window.__ko?.visualIds),null,{timeout:30000});
  const manifest=await page.evaluate(()=>window.__ko.visualIds.slice());
  const allowed=new Set(manifest);
  if(!list.length) list=manifest;
  for(const id of list) if(!allowed.has(id)) throw new Error(`screen is not present in the reviewer UI: ${id}`);
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({side:SIDE,screen_ids:list},null,2));
  for(const id of list){
    const f=path.join(out,id.replace(':','-')+'.png');
    if(fs.existsSync(f)){n++;continue;}
    if(!loaded){ await page.goto(`${base}?screen=${encodeURIComponent(id)}&export=${SIDE}`,{waitUntil:'load'}); loaded=true; }
    else {
      const found=await page.evaluate(id=>window.__ko.goTo(id),id);
      if(!found) throw new Error(`screen is not present in the reviewer UI: ${id}`);
    }
    await page.waitForSelector('body[data-ready="1"]',{timeout:30000});
    const landed=await page.evaluate(()=>window.__ko.screen.id);
    if(landed!==id) throw new Error(`requested ${id}, reviewer landed on ${landed}`);
    await page.waitForTimeout(150);
    await page.locator(`#ph-${SIDE}`).screenshot({path:f,type:'png'});
    n++; if(n%20===0) console.log(n,'/',list.length);
  }
  await browser.close();
  if(n!==list.length) throw new Error(`exported ${n} of ${list.length} screens`);
  if(errs.length) throw new Error(`page errors:\n${[...new Set(errs)].slice(0,5).join('\n')}`);
  console.log('done',n,'of',list.length);
})().catch(e=>{console.error(e);process.exit(1)});
