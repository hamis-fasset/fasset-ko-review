// Render the live review tool's Korean phone for a list of screen ids, at native pixel size.
// usage: node export-ko.js <base-url> <out-dir> [id ...]   (no ids = every app + figma screen)
const fs=require('fs'), path=require('path'); const {chromium}=require('playwright-core');
const SITE=process.env.SITE||path.join(process.env.HOME,'Downloads/fasset-ko-work/site');
const [base,out,...ids]=process.argv.slice(2);
(async()=>{
  let list=ids;
  if(!list.length){
    list=JSON.parse(fs.readFileSync(path.join(SITE,'data/screens.json'),'utf8')).screens.map(s=>s.id)
      .concat(JSON.parse(fs.readFileSync(path.join(SITE,'data/figma/screens.json'),'utf8')).screens.map(s=>s.id));
  }
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const ctx=await browser.newContext({viewport:{width:1300,height:1300},deviceScaleFactor:2});
  const page=await ctx.newPage(); const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  let n=0;
  for(const id of list){
    const f=path.join(out,id.replace(':','-')+'.png');
    if(fs.existsSync(f)){n++;continue;}
    await page.goto(`${base}?screen=${encodeURIComponent(id)}&export=ko`,{waitUntil:'load'});
    try{ await page.waitForSelector('body[data-ready="1"]',{timeout:30000}); }catch(e){ console.error('timeout',id); continue; }
    await page.waitForTimeout(150);
    await page.locator('#ph-ko').screenshot({path:f,type:'png'});
    n++; if(n%20===0) console.log(n,'/',list.length);
  }
  await browser.close();
  console.log('done',n,'of',list.length); if(errs.length) console.error('page errors:',[...new Set(errs)].slice(0,5).join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
