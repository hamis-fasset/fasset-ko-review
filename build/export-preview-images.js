#!/usr/bin/env node
/* Export the exact live Korean renderer as 1080x2400 reference images. */
const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright-core');

const base=process.argv[2];
const root=path.resolve(process.argv[3]||path.join(__dirname,'..'));
if(!base||!fs.existsSync(path.join(root,'data','screens.json'))){
  console.error('usage: node export-preview-images.js <site-url> [review-tool-dir]');
  process.exit(2);
}

(async()=>{
  const screens=JSON.parse(fs.readFileSync(path.join(root,'data','screens.json'),'utf8')).screens;
  const out=path.join(root,'img-ko');
  fs.mkdirSync(out,{recursive:true});
  const executablePath=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser=await chromium.launch({headless:true,executablePath});
  const page=await browser.newPage({viewport:{width:2800,height:2488},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.removeItem('fasset-ko-review-v2');localStorage.removeItem('fasset-ko-review-v2:screen')});
  await page.reload({waitUntil:'networkidle'});
  if(await page.locator('#b-gotit').isVisible()) await page.locator('#b-gotit').click();
  for(let i=0;i<screens.length;i++){
    await page.waitForFunction(()=>!document.querySelector('#ph-ko')?.classList.contains('loading'));
    await page.evaluate(()=>document.fonts.ready);
    const box=await page.locator('#ph-ko').boundingBox();
    if(!box||Math.round(box.width)!==1080||Math.round(box.height)!==2400){
      throw new Error(`${screens[i].id}: expected a 1080x2400 phone, got ${box?.width}x${box?.height}`);
    }
    await page.locator('#ph-ko').screenshot({path:path.join(out,`${screens[i].id}.jpg`),type:'jpeg',quality:95});
    if(i<screens.length-1) await page.locator('#b-next').click();
  }
  await browser.close();
  if(errors.length) throw new Error(`browser errors:\n${errors.join('\n')}`);
  console.log(`Exported ${screens.length} Korean previews to ${out}`);
})().catch(error=>{console.error(error);process.exit(1)});
