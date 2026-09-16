#!/usr/bin/env node
/* Context and typography corrections that cannot be inferred from OCR alone. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '');
if (!root || !fs.existsSync(path.join(root, 'data'))) {
  console.error('usage: node fix-preview-data.js <review-tool-dir>');
  process.exit(2);
}

const copyPath = path.join(root, 'data/copy.json');
const ocrPath = path.join(root, 'data/ocr.json');
const hardcodedPath = path.join(root, 'data/hardcoded.json');
const copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));
const ocr = JSON.parse(fs.readFileSync(ocrPath, 'utf8'));
const hardcoded = fs.existsSync(hardcodedPath) ? JSON.parse(fs.readFileSync(hardcodedPath, 'utf8')) : null;

// These values are shared across income-source options and section headings.
// Use neutral Korean that remains correct in both contexts.
const replacements = {
  'fassetCard.incomeEmployment': '직업',
  'fassetCard.incomeInvestments': '투자',
  'updated.investments': '투자'
};
for (const row of copy) if (replacements[row.k]) row.ko = replacements[row.k];
const googleRow = copy.find(row => row.k === 'hc.002');
if (googleRow) googleRow.en = 'Log in with Google';
if (hardcoded?.['hc.002']) {
  hardcoded['hc.002'].en = 'Log in with Google';
  hardcoded['hc.002'].norm = 'log in with google';
}

const makeMatch = (key, item, extras={}) => ({
  k:key,x:item.x,y:item.y,w:item.w,h:item.h,lines:1,lh:item.h,text:item.text,vals:{},weak:false,
  visualSafe:true,originalBox:{x:item.x,y:item.y,w:item.w,h:item.h},ocrLine:item.text,
  patchPad:{left:12,right:12,top:4,bottom:4},align:item.x>594?'right':(Math.abs(item.x+item.w/2-540)<40?'center':'left'),...extras
});
const promoteUnmatched = (screenId, pattern, key, extrasFor=()=>({})) => {
  const model=ocr[screenId]; if(!model) return;
  const keep=[];
  for(const item of model.unmatched||[]){
    if(pattern.test(item.text)) model.matches.push(makeMatch(key(item),item,extrasFor(item)));
    else keep.push(item);
  }
  model.unmatched=keep;
};

// OCR had grouped these labels with an icon or clipped character. Remap only
// the exact copy span so the icon remains untouched.
for(const screenId of ['login_06_dashboard','dashboard_01_home','buy_01_trade_sheet','sell_01_trade_sheet']){
  const match=ocr[screenId]?.matches.find(item=>item.k==='fassetPay.activateCardBtn'&&item.y>800&&item.y<900);
  if(match){match.k='fassetCard.activateNow';match.x=923;match.y=858;match.w=154;match.h=25;match.lh=25;match.text='Activate no';match.ocrLine='Activate no';match.visualSafe=true;match.truncated=true;match.align='right';match.originalBox={x:923,y:858,w:154,h:25};match.patchPad={left:12,right:2,top:4,bottom:4};}
}
const balance=ocr.logout_03_logged_out?.matches.find(item=>item.k==='wallet.totalTitle');
if(balance){balance.k='updated.totalBalance';balance.x=38;balance.y=293;balance.w=190;balance.h=39;balance.lh=39;balance.text='Total Balance';balance.ocrLine='Total Balance';balance.vals={};balance.visualSafe=true;balance.align='left';balance.originalBox={x:38,y:293,w:190,h:39};balance.patchPad={left:12,right:2,top:4,bottom:4};}
const galaAvailable=ocr.sell_02_asset_list?.matches.find(item=>item.k==='fassetPay.topupAmountAvailable'&&item.y===902);
if(galaAvailable){galaAvailable.y=904;galaAvailable.h=35;galaAvailable.patchPad.top=0;}
const awaitingActivation=ocr.logout_03_logged_out?.matches.find(item=>item.k==='hc.017');
if(awaitingActivation) awaitingActivation.truncated=true;
const confirmAndProceed=ocr.kyc_ae_02_proof_of_address?.matches.find(item=>item.k==='new.confirmAndProceed');
if(confirmAndProceed) confirmAndProceed.truncated=true;

for(const screenId of ['history_01_recent','history_02_list']){
  promoteUnmatched(screenId,/^(Sold|Bought) [A-Z]{2,6}$/,
    item=>item.text.startsWith('Sold')?'hc.015':'hc.016',
    item=>({vals:{asset:item.text.split(/\s+/).pop()},align:'left'}));
}
promoteUnmatched('history_03_detail',/^To$/i,()=> 'buyV4.to');
promoteUnmatched('sell_07_success',/^sold$/i,()=> 'accountsV4.sold',()=>({align:'center'}));
if(!ocr.history_03_detail.matches.some(item=>item.k==='buyV4.to')){
  ocr.history_03_detail.matches.push(makeMatch('buyV4.to',{text:'To',x:104,y:1510,w:42,h:32},{align:'left'}));
}

// This capture contains a heading plus a smaller two-line explanation. They
// share one synthetic review row, but must retain two distinct visual styles.
const screen = ocr.kyc_ae_04_link_bank;
const index = screen.matches.findIndex(match => match.k === 'hc.037' && !match.segment);
if (index >= 0) {
  const original = screen.matches[index];
  const title = {
    ...original,
    x: 55, y: 600, w: 478, h: 36, lines: 1, lh: 36,
    text: '3-Month Bank Statement(PDF)',
    ocrLine: '3-Month Bank Statement(PDF)',
    segment: 'beforePdf',
    originalBox: {x:55,y:600,w:478,h:36},
    patchPad: {left:12,right:12,top:4,bottom:4}
  };
  const body = {
    ...original,
    x: 55, y: 658, w: 872, h: 75, lines: 2, lh: 29,
    text: 'Must cover the last three full months, show your name and be an official bank document, not a screenshot.',
    ocrLine: 'Must cover the last three full months, show your name and be an official bank document, not a screenshot.',
    segment: 'afterPdf',
    originalBox: {x:55,y:658,w:872,h:75},
    patchPad: {left:12,right:12,top:4,bottom:4}
  };
  screen.matches.splice(index, 1, title, body);
}

// The dashboard card uses a bold lead sentence and a regular two-line body.
// Keep those typographic roles separate instead of repainting one large block.
for (const screenId of ['login_06_dashboard','dashboard_01_home','history_01_recent']) {
  const model=ocr[screenId];
  const i=model?.matches.findIndex(match=>match.k==='hc.004'&&!match.segment) ?? -1;
  if(i<0) continue;
  const original=model.matches[i];
  const title={
    ...original,x:80,y:original.y,w:565,h:39,lines:1,lh:39,weight:700,
    text:'Pay friends. No bank details needed.',ocrLine:'Pay friends. No bank details needed.',
    segment:'cardTitle',originalBox:{x:80,y:original.y,w:565,h:39},
    patchPad:{left:12,right:12,top:4,bottom:4}
  };
  const body={
    ...original,x:80,y:original.y+55,w:571,h:86,lines:2,lh:39,weight:400,
    text:'Send and request money instantly to friends using your Fasset tag',
    ocrLine:'Send and request money instantly to friends using your Fasset tag',
    segment:'cardBody',originalBox:{x:80,y:original.y+55,w:571,h:86},
    patchPad:{left:12,right:12,top:2,bottom:2}
  };
  model.matches.splice(i,1,title,body);
}

// This address placeholder has an instruction line and a separate example;
// the third line in the capture is live example data and must remain untouched.
const addressScreen=ocr.kyc_lb_01_financial_profile;
const addressIndex=addressScreen?.matches.findIndex(match=>match.k==='hc.021'&&!match.segment) ?? -1;
if(addressIndex>=0){
  const original=addressScreen.matches[addressIndex];
  const instruction={
    ...original,x:101,y:993,w:265,h:22,lines:1,lh:22,weight:400,
    text:'Input complete address',ocrLine:'Input complete address',segment:'addressInstruction',
    originalBox:{x:101,y:993,w:265,h:22},patchPad:{left:8,right:8,top:2,bottom:2}
  };
  const example={
    ...original,x:101,y:1021,w:520,h:26,lines:1,lh:26,weight:400,
    text:'E.g., Crescentcreek 2 Building - Portsaeed 20 B',
    ocrLine:'E.g., Crescentcreek 2 Building - Portsaeed 20 B',segment:'addressExample',
    originalBox:{x:101,y:1021,w:520,h:26},patchPad:{left:8,right:8,top:2,bottom:2}
  };
  addressScreen.matches.splice(addressIndex,1,instruction,example);
}

// Never let erase padding touch a neighbouring label, icon-like OCR token, or
// runtime value. Split gaps between two editable matches; leave one pixel
// before immutable data.
const intersects=(a1,a2,b1,b2)=>Math.max(a1,b1)<Math.min(a2,b2);
for(const model of Object.values(ocr)){
  const matches=model.matches||[], fixed=model.unmatched||[];
  for(const match of matches){
    const pad=match.patchPad||(match.patchPad={left:4,right:4,top:4,bottom:4});
    for(const [other,isMatch] of [...matches.filter(item=>item!==match).map(item=>[item,true]),...fixed.map(item=>[item,false])]){
      if(intersects(match.y,match.y+match.h,other.y,other.y+other.h)){
        if(other.x+other.w<=match.x){const gap=match.x-(other.x+other.w);pad.left=Math.min(pad.left,Math.max(0,isMatch?Math.floor(gap/2):gap-1));}
        if(other.x>=match.x+match.w){const gap=other.x-(match.x+match.w);pad.right=Math.min(pad.right,Math.max(0,isMatch?Math.floor(gap/2):gap-1));}
      }
      if(intersects(match.x,match.x+match.w,other.x,other.x+other.w)){
        if(other.y+other.h<=match.y){const gap=match.y-(other.y+other.h);pad.top=Math.min(pad.top,Math.max(0,isMatch?Math.floor(gap/2):gap-1));}
        if(other.y>=match.y+match.h){const gap=other.y-(match.y+match.h);pad.bottom=Math.min(pad.bottom,Math.max(0,isMatch?Math.floor(gap/2):gap-1));}
      }
    }
  }
}

fs.writeFileSync(copyPath, JSON.stringify(copy));
fs.writeFileSync(ocrPath, JSON.stringify(ocr));
if(hardcoded) fs.writeFileSync(hardcodedPath, JSON.stringify(hardcoded,null,1));
console.log('Applied context and split-style preview corrections');
