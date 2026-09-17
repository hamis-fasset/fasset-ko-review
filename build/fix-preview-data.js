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

// Exact visual corrections confirmed in the fifth browser-render QA pass.
// `draw` is deliberately separate from the source/erase box: moving Korean
// must never move the English glyph mask or consume a neighbouring icon.
const setDraw=(screenId,key,draw,predicate=()=>true)=>{
  const match=ocr[screenId]?.matches.find(item=>item.k===key&&predicate(item));
  if(match) match.draw={x:match.x,y:match.y,w:match.w,h:match.h,...draw};
};
setDraw('logout_03_logged_out','portfolio.identityCheck',{x:174});
for(const screenId of ['kyc_lb_02_money_questions','kyc_lb_03_money_questions_filled']){
  setDraw(screenId,'fassetCard.purposeOfAccountLabel',{align:'left'});
}
setDraw('account_full_06_update_dob','hc.122',{align:'left'});

for(const [screenId,key,predicate] of [
  ['buy_07_success','buyV4.orderCompleted',()=>true],
  ['sell_03_receive_method','buyV4.cashWallet',()=>true],
  ['history_02_list','hc.015',item=>item.y===582],
  ['account_full_08_change_password','account.security',()=>true]
]){
  const match=ocr[screenId]?.matches.find(item=>item.k===key&&predicate(item));
  if(match) match.weight=400;
}

// Keep the source bullets and draw only the translated list text after them.
for(const key of ['hc.027','hc.028','hc.029','hc.030','hc.031','hc.032','hc.033']){
  const match=ocr.kyc_ae_02_proof_of_address?.matches.find(item=>item.k===key);
  if(match){match.stripLeadingBullet=true;match.draw={x:match.x+24,y:match.y,w:Math.max(1,match.w-24),h:match.h,align:'left'};}
}

// The source extractor split the green "contact us" link at a line break.
// Treat it as one sentence so neither an English "us" nor an incomplete
// Korean fragment is presented to the reviewer.
for(const [key,en,ko] of [
  ['hc.121','You cannot change your legal name. If you need help, contact us','법적 이름은 변경할 수 없어요. 도움이 필요하면 고객센터로 문의해 주세요.'],
  ['hc.122','You cannot change your date of birth. If you need help, contact us','생년월일은 변경할 수 없어요. 도움이 필요하면 고객센터로 문의해 주세요.']
]){
  const row=copy.find(item=>item.k===key); if(row){row.en=en;row.ko=ko;}
  if(hardcoded?.[key]){hardcoded[key].en=en;hardcoded[key].ko=ko;}
}
const legalNameHelp=ocr.account_full_05_update_legal_name?.matches.find(item=>item.k==='hc.121');
if(legalNameHelp){legalNameHelp.ocrLine='You cannot change your legal name. If you need help, contact us';legalNameHelp.text=legalNameHelp.ocrLine;legalNameHelp.lines=2;legalNameHelp.h=76;legalNameHelp.lh=36;}
const dobHelp=ocr.account_full_06_update_dob?.matches.find(item=>item.k==='hc.122');
if(dobHelp){dobHelp.ocrLine='You cannot change your date of birth. If you need help, contact us';dobHelp.text=dobHelp.ocrLine;dobHelp.lines=2;dobHelp.h=76;dobHelp.lh=36;dobHelp.align='left';}

const limits=copy.find(item=>item.k==='hc.082');
if(limits) limits.ko='최소 투자 금액 60 USDT\n최대 투자 금액 100,000 USDT';
if(hardcoded?.['hc.082']) hardcoded['hc.082'].ko='최소 투자 금액 60 USDT\n최대 투자 금액 100,000 USDT';

const saverConsent=copy.find(item=>item.k==='hc.080');
if(saverConsent){saverConsent.en='I have read and agree to the Fasset User Agreement';saverConsent.ko='Fasset 이용약관을 읽고 동의합니다';}
if(hardcoded?.['hc.080']){hardcoded['hc.080'].en='I have read and agree to the Fasset User Agreement';hardcoded['hc.080'].ko='Fasset 이용약관을 읽고 동의합니다';}
for(const screenId of ['earn_full_04_flex_saver_detail','earn_full_05_stable_saver_detail']){
  const match=ocr[screenId]?.matches.find(item=>item.k==='hc.080');
  if(match){match.ocrLine='I have read and agree to Fasset User /';match.text=match.ocrLine;}
}
const dailyRate=ocr.earn_full_03_savings?.matches.find(item=>item.k==='portfolio.daily');
if(dailyRate) dailyRate.ocrLine='3.5%';

// Vision drops the D from USDT on this backend-generated notification. The
// geometry still maps the complete two-line message; keep it paintable so the
// Korean preview does not leave one English notification behind.
const notificationUsdt=ocr.notifications_full_01_list?.matches.find(item=>item.k==='hc.132');
if(notificationUsdt){
  notificationUsdt.visualSafe=true;
  notificationUsdt.ocrLine='Your sell order for Nvidia Corp worth of 8.245191 UST has been fulfilled';
}

// The Global USD activity title wraps around a circular plus icon. Treat the
// two text lines separately so the icon is never erased, then draw the shorter
// Korean title at normal activity-row size.
const globalUsdActivity=ocr.wallet_full_02_global_usd_account?.matches.find(item=>item.k==='hc.138');
if(globalUsdActivity){
  Object.assign(globalUsdActivity,{x:240,y:1520,w:439,h:77,lines:2,lh:36,fs:31,
    align:'left',visualSafe:true,ocrLine:'Money moved to Global USD',extraOcrLines:['Account'],
    originalBox:{x:240,y:1520,w:439,h:77},patchPad:{left:4,right:4,top:4,bottom:4}});
}

// OCR split the withdrawal-method description after "funds". Keep the source
// sentence whole so the second English line is erased before Korean is drawn.
const withdrawalDescription=ocr.withdraw_full_02_methods?.matches.find(item=>item.k==='hc.142');
if(withdrawalDescription){
  Object.assign(withdrawalDescription,{x:107,y:554,w:719,h:72,lines:2,lh:36,fs:28,
    align:'left',visualSafe:true,
    ocrLine:'Select from available options to withdraw your funds',extraOcrLines:['seamlessly.'],
    originalBox:{x:107,y:554,w:719,h:72},patchPad:{left:4,right:4,top:4,bottom:4}});
}
for(const store of [copy,hardcoded]){
  const row=Array.isArray(store)?store.find(item=>item.k==='hc.142'):store?.['hc.142'];
  if(row) row.en='Select from available options to withdraw your funds seamlessly.';
}

// Correct OCR-only consent text retained in the engineering export. The
// activation screenshot is excluded because its fixed CTA obscures the third
// row, but the recovered source still needs to be accurate for handoff.
for(const [key,en] of [
  ['hc.127','I accept the E-Sign Consent'],
  ['hc.128','I accept the Fasset Card Terms, Fasset Privacy Policy and Issuer Privacy Policy'],
  ['hc.129','I certify that the information I have provided is accurate and that I will abide by all the rules and requirements related to my Fasset Card']
]){
  const copyRow=copy.find(item=>item.k===key); if(copyRow) copyRow.en=en;
  if(hardcoded?.[key]){hardcoded[key].en=en;hardcoded[key].norm=en.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
}

// "Valid Thru" is baked into the promotional card artwork at an angle, not a
// live UI label. Translating it as horizontal HTML text damages the artwork.
const promoValidThru=ocr.card_full_01_entry?.matches.find(item=>item.k==='fassetCard.validThruLabel');
if(promoValidThru) promoValidThru.visualSafe=false;

// The deposit capture matcher collapsed a payment-method title and its grey
// timing/fee subtitle into one protected two-line row. Split the visual boxes
// while retaining one reviewer/edit key, so each line keeps its own size and
// colour and Vision can erase exactly the corresponding source tokens.
const bankLinkedGeometry={
  deposit_full_01_methods_approved:{title:{x:212,y:707,w:325,h:33},body:{x:212,y:759,w:429,h:36}},
  deposit_full_04_wire_bank_sheet:{title:{x:212,y:707,w:324,h:33},body:{x:215,y:760,w:426,h:33}},
  deposit_full_11_methods_unverified:{title:{x:212,y:707,w:325,h:33},body:{x:212,y:759,w:429,h:36}},
  deposit_full_12_card_kyc_gate:{title:{x:212,y:707,w:325,h:33},body:{x:216,y:760,w:426,h:33}}
};
for(const [screenId,geometry] of Object.entries(bankLinkedGeometry)){
  const matches=ocr[screenId]?.matches;
  if(!matches) continue;
  const found=matches.map((item,index)=>item.k==='hc.049'?index:-1).filter(index=>index>=0);
  if(!found.length) continue;
  const insertAt=found[0], base=matches[insertAt];
  const common={
    ...base,k:'hc.049',vals:{},weak:false,hc:true,lines:1,align:'left',
    alignWhy:'default',visualSafe:true,patchPad:{left:4,right:4,top:4,bottom:4},weight:400
  };
  const title={
    ...common,...geometry.title,lh:geometry.title.h,fs:35.3,
    text:'Bank Linked Transfer',ocrLine:'Bank Linked Transfer',segment:'bankLinkedTitle',
    originalBox:{...geometry.title}
  };
  const body={
    ...common,...geometry.body,lh:geometry.body.h,fs:29.7,
    text:'Up to 8 business hours • No fee',ocrLine:'Up to 8 business hours • No fee',segment:'bankLinkedBody',
    originalBox:{...geometry.body}
  };
  matches.splice(insertAt,found.length,title,body);
}

// Recommendation-card durations are runtime values. The source match is safe:
// localize the UI label and provide a Korean sample value for the preview,
// while the editable bundle retains the {{value1}} placeholder.
for(const match of ocr.earn_full_01_overview?.matches||[]){
  if(match.k!=='new.stakingTitle') continue;
  match.visualSafe=true;
  match.valsKo={value1:'1일'};
}

// Final browser-render QA found three source-box problems that the old
// colour-based cleaner had hidden. Keep the warning independent of the large
// balance above it, make the shared copy correct for both Saver products, and
// expose the two-line investment limits on the Flex screen.
const saverWarning=copy.find(item=>item.k==='earn.usdtNotEnough');
if(saverWarning) saverWarning.ko='지갑에 USDT가 부족해요. 이 상품을 이용하려면 USDT를 구매해 주세요.';
for(const screenId of ['earn_full_04_flex_saver_detail','earn_full_05_stable_saver_detail']){
  const match=ocr[screenId]?.matches.find(item=>item.k==='earn.usdtNotEnough');
  if(match) Object.assign(match,{
    x:167,y:721,w:778,h:75,lines:2,lh:38,fs:31,
    text:'Insufficient USDT in your wallet. Please purchase USDT to participate in the Stable Saver plan.',
    ocrLine:'Insufficient USDT in your wallet. Please purchase USDT to participate in the Stable Saver plan.',
    originalBox:{x:167,y:721,w:778,h:75},patchPad:{left:4,right:4,top:3,bottom:3},
    align:'left',visualSafe:true
  });
}
const flexLimits=copy.find(item=>item.k==='hc.079');
if(flexLimits) flexLimits.ko='최소 투자 금액 40 USDT\n최대 투자 금액 100,000 USDT';
if(hardcoded?.['hc.079']) hardcoded['hc.079'].ko='최소 투자 금액 40 USDT\n최대 투자 금액 100,000 USDT';
const flexLimitsMatch=ocr.earn_full_04_flex_saver_detail?.matches.find(item=>item.k==='hc.079');
if(flexLimitsMatch) flexLimitsMatch.visualSafe=true;

// Apple Vision's word rectangle is exact enough for placement, but this one
// heading has a faint anti-aliased cap just outside the two-pixel default mask.
const currentPhone=ocr.account_full_04_update_phone?.matches.find(item=>item.k==='myFasset.currentPhone');
if(currentPhone) currentPhone.visionPad=4;

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
