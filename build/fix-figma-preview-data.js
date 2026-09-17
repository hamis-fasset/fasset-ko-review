#!/usr/bin/env node
/* Targeted Figma-preview corrections verified against the exported frames. */
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const boxesPath=path.join(root,'data/figma/boxes.json');
const copyPath=path.join(root,'data/figma/copy.json');
const boxes=JSON.parse(fs.readFileSync(boxesPath,'utf8'));
const copy=JSON.parse(fs.readFileSync(copyPath,'utf8'));
const rowByKey=()=>Object.fromEntries(copy.map(row=>[row.k,row]));

const matches=(screen,key)=>(boxes[screen]?.matches||[]).filter(m=>m.k===key);
const first=(screen,key)=>matches(screen,key)[0];
const draw=(screen,key,values)=>{const m=first(screen,key);if(m)m.draw={x:m.x,y:m.y,w:m.w,h:m.h,...values};};
const protect=(screen,key)=>matches(screen,key).forEach(m=>m.visualSafe=false);
const enable=(screen,key)=>matches(screen,key).forEach(m=>m.visualSafe=true);
const fg=(screen,key,value)=>matches(screen,key).forEach(m=>m.fg=value);
const cloneMatches=(from,to,keys,overrides={})=>{
  if(!boxes[from]||!boxes[to]) return;
  for(const key of keys){
    if(matches(to,key).length) continue;
    const source=first(from,key); if(source) boxes[to].matches.push({...source,...(overrides[key]||{})});
  }
};
const keyFor=en=>'fx.'+crypto.createHash('sha1').update(en.toLowerCase()).digest('hex').slice(0,10);
const ensureRow=(en,ko,component='label',namespace='Preview recovery')=>{
  const key=keyFor(en); let row=copy.find(item=>item.k===key);
  if(!row){
    row={k:key,ns:namespace,en,ko,c:component,canon:key,dupes:[],keep:false,ph:[],batch:0,flag:null,figma:[],template:null};
    copy.push(row);
  } else if(ko) row.ko=ko;
  return key;
};
const inferredLines=item=>Math.max(1,Math.round(item.h/20));
const inferredFont=(item,lines=inferredLines(item))=>{const lh=item.h/lines;return lh<=13?11:lh<=16?12:lh<=21?14:lh<=26?20:22;};
const fromItem=(key,item,extras={})=>{
  const lines=extras.lines||inferredLines(item), lh=extras.lh||item.h/lines;
  return {k:key,x:item.x,y:item.y,w:item.w,h:item.h,lines,lh,text:item.text,vals:{},weak:false,fs:extras.fs||inferredFont(item,lines),weight:extras.weight||400,...extras};
};
const addMatch=(screen,key,item,extras={})=>{
  const model=boxes[screen]; if(!model)return null;
  const exists=(model.matches||[]).find(m=>m.k===key&&Math.abs(m.x-item.x)<1&&Math.abs(m.y-item.y)<1);
  if(exists){Object.assign(exists,extras);return exists;}
  const match=fromItem(key,item,extras);model.matches.push(match);return match;
};
const promoteExact=(screen,text,key,extras={},predicate=()=>true)=>{
  const model=boxes[screen]; if(!model)return [];
  const promoted=[],keep=[];
  for(const item of model.unmatched||[]){
    if(item.text===text&&predicate(item)){promoted.push(addMatch(screen,key,item,{ocrLine:text,...extras}));}
    else keep.push(item);
  }
  model.unmatched=keep;return promoted;
};
const pseudo=(screen,en,ko,item,extras={})=>addMatch(screen,ensureRow(en,ko,extras.component||'body',extras.namespace||'Preview recovery'),{...item,text:en},{ocrLine:en,...extras});

// The extracted Figma nodes can contain an icon, an illustration, or a stale
// auto-layout box. Draw geometry is the actual text position; erase geometry
// continues to come from Vision word boxes in plates.py.
draw('103:58535','fx.cac15f72e2',{x:35,y:584,w:219,h:26,align:'left'});
draw('56:91316','fx.4e0f87575b',{x:145,y:718,w:132,h:18.2,align:'center'});
draw('304:12424','fx.43896309a4',{x:305,y:214.5,w:76,h:20,align:'left'});
for(const screen of ['444:20632','444:20706']) draw(screen,'fx.db99845855',{x:306,y:569.5,w:46,h:12,align:'left'});

const landingTitle=first('62:92717','fx.8814853d29');
if(landingTitle){landingTitle.lines=2;landingTitle.h=96;landingTitle.lh=46.8;}
draw('62:92717','fx.027459c902',{y:580});

const pinTitle=first('62:94274','fx.32fa1c97c9');
if(pinTitle){pinTitle.lines=1;pinTitle.h=40;pinTitle.lh=40;}

// Native system sheets and long titles need the real visible line geometry,
// not the much taller Figma component frame that contains title and body.
for(const [screen,titleKey,titleBox,bodyKey,bodyBox] of [
  ['50:86783','fx.435f60262b',{x:24,y:538,w:345,h:30,lines:1,lh:30},'fx.ac4455895e',{x:24,y:572,w:345,h:88,lines:4,lh:22}],
  ['62:95382','fx.1bf2f7d310',{x:24,y:582,w:345,h:31,lines:1,lh:31},'fx.7d6fa071f9',{x:24,y:620,w:345,h:68,lines:3,lh:22}]
]){
  const title=first(screen,titleKey),body=first(screen,bodyKey);
  if(title){title.draw={...titleBox,align:'left'};title.fs=22;}
  if(body){body.draw={...bodyBox,align:'left'};body.fs=17;}
}
draw('94:43094','fx.9da17407c6',{x:16,y:582,w:361,h:54,align:'left'});
const unavailableBody=first('94:43094','fx.5c16756821');
if(unavailableBody){unavailableBody.draw={x:16,y:642,w:361,h:63,align:'left'};unavailableBody.lines=3;unavailableBody.lh=20.8;unavailableBody.fs=16;}

fg('84:129132','fx.52ea20b92c','#9f9f9f');
fg('455:21960','fx.c8ca03b637','#121311');

// A few exported frames clip the beginning/end of a source line. Vision must
// erase what is actually visible; the Korean still uses the full semantic box.
for(const [screen,key,ocrLine] of [
  ['378:13532','fx.c558e48150','ent is claimed'],
  ['378:13532','fx.1174c0a7bc','AVAILABLE TO THL'],
  ['363:13505','fx.f11a3b8867','AVAILABLE TO'],
  ['363:13505','fx.17a5959b7c','k account in Pakistan']
]){
  const m=first(screen,key); if(m)m.ocrLine=ocrLine;
}
const faceWithdraw=first('363:13505','fx.17a5959b7c');
if(faceWithdraw)faceWithdraw.extraOcrLines=['Withdraw te'];

// These frames show the active Saving state; the inactive button label is a
// hidden sibling node and must neither be erased nor drawn.
protect('97:52546','fx.eee0bbba4f');
protect('103:53815','fx.9c2a4dd4e5');

// Missing extracted layers that are visibly present in these sibling frames.
cloneMatches('103:54967','103:59314',['fx.eee0bbba4f','fx.0a270eae8c']);
cloneMatches('103:54967','103:59345',['fx.eee0bbba4f','fx.0a270eae8c']);
cloneMatches('103:59406','103:55539',['fx.eee0bbba4f','fx.4f2bc7a25d']);
cloneMatches('465:22280','465:22206',['fx.8829bac8cf'],{
  'fx.8829bac8cf':{y:759,paint:{x:160,y:761,w:74,h:14}}
});
cloneMatches('103:54967','103:55209',['fx.eee0bbba4f','fx.0a270eae8c']);

// The disabled tag CTA is visible above the keyboard. Its component node was
// either missing or positioned at the off-screen layout slot; bind the match
// to the visible centred label so it can be erased without touching the pill.
for(const [screen,y] of [['103:52741',493.9],['103:53007',493.9],['103:53285',493.9],['103:53550',493.9]]){
  let m=first(screen,'fx.9c2a4dd4e5');
  if(!m)m=addMatch(screen,'fx.9c2a4dd4e5',{x:154.78,y,w:83.44,h:18.2,text:'Save tag'},{fs:14,align:'center',ocrLine:'Save tag'});
  Object.assign(m,{x:154.78,y,w:83.44,h:18.2,lines:1,lh:18.2,fs:14,align:'center',color:'#9f9f9f',ocrLine:'Save tag',text:'Save tag',visualSafe:true,draw:{x:154.78,y,w:83.44,h:18.2,align:'center'}});
}
for(const screen of ['103:52741','103:53285','103:53550']){
  const m=first(screen,'fx.52ea20b92c');
  if(m)Object.assign(m,{lines:2,lh:18.2,fs:14,fg:'#9f9f9f',draw:{x:16,y:154,w:361,h:36.4,align:'left'}});
}
const tagTaken=first('103:53007','fx.e7c9534900');
if(tagTaken){tagTaken.draw={x:58,y:289,w:270,h:31.2,align:'left'};tagTaken.lines=2;tagTaken.lh=15.6;tagTaken.fs=12;}

// Figma classified these visible form labels as data. They are copy and must
// be editable just like every other label on the screen.
for(const screen of ['103:57962','103:59687']){
  promoteExact(screen,'Occupation',ensureRow('Occupation','직업','label','KYC'));
  promoteExact(screen,'Employer',ensureRow('Employer','고용주','label','KYC'));
  promoteExact(screen,'e.g. Microsoft',ensureRow('e.g. Microsoft','예: Microsoft','label','KYC'),{fg:'#9f9f9f'});
}
for(const screen of ['84:128334','94:42912','94:43222','94:43343']){
  const key=ensureRow('Search countries','국가 검색','label','BASIC INFO');
  promoteExact(screen,'Search countries',key,{fg:'#9f9f9f',fs:14,lines:1,lh:16});
  matches(screen,key).forEach(m=>Object.assign(m,{fg:'#9f9f9f',fs:14,lines:1,lh:16}));
}
for(const screen of ['97:50886','97:52059','97:52168','97:52457']){
  const key=ensureRow('Email (optional)','이메일(선택)','label','BASIC INFO');
  promoteExact(screen,'Email (optional)',key,{fs:14,lines:1,lh:16});
  matches(screen,key).forEach(m=>Object.assign(m,{fs:14,lines:1,lh:16}));
}
for(const screen of ['97:51130','97:51684','97:51775','97:52546']){
  const key=ensureRow('Email','이메일','label','BASIC INFO');
  promoteExact(screen,'Email',key,{fs:14,lines:1,lh:16});
  matches(screen,key).forEach(m=>Object.assign(m,{fs:14,lines:1,lh:16}));
}

// Active Forgot-PIN sheet: the extractor treated the foreground title/body as
// a background duplicate and left them in English.
promoteExact('62:94501','Forgot your PIN?','fx.05555321bc',{x:48,y:620,w:297,h:24,lines:1,lh:24,fs:18,weight:500,align:'center'},item=>Math.abs(item.x-48)<1&&Math.abs(item.y-620)<1);
matches('62:94501','fx.05555321bc').filter(m=>Math.abs(m.x-48)<1&&Math.abs(m.y-620)<1).forEach(m=>Object.assign(m,{lines:1,lh:24,fs:18,weight:500,align:'center'}));
const forgotBody=ensureRow('Log out, then log in again to reset your PIN.','PIN을 재설정하려면 로그아웃한 뒤 다시 로그인해 주세요.','body','LOG IN');
promoteExact('62:94501','Log out, then log in again to reset your PIN.',forgotBody,{x:16.5,y:658,w:360,h:38,lines:2,lh:19,fs:14,align:'center'});
enable('62:96822','fx.36e2510d28');

// Exact visible background rows in modal states. Only rows whose Vision word
// boxes were verified are promoted; occluded siblings remain protected so no
// HTML text can float above a foreground sheet.
const promoteKnown=(screen,texts)=>{
  for(const text of texts){const row=copy.find(item=>item.en===text);if(row)promoteExact(screen,text,row.k);}
};
for(const [screen,texts] of [
  ['103:57375',['Verify your identity','Have your Emirates ID ready. You can explore the app, but you\'ll need verification to move money.',"What you'll do",'Scan your Emirates ID','Scan the front and back of your ID.','Confirm your address','A bill or statement dated within the last 3 months.','Start verification','Do it later']],
  ['103:58783',['Verify your identity',"What you'll do",'Scan your ID',"Use your passport, national ID, or driver's license.",'Do it later']],
  ['103:59007',['Verify your identity',"What you'll do",'Scan your ID',"Use your passport, national ID, or driver's license.",'A bill or statement dated within the last 3 months.','Start verification','Do it later']],
  ['322:12822',['Who are you sending to?','Enter their Fasset tag, phone number, or email, or choose a contact.','Fasset tag, phone, or email','Your recent recipients will appear here.','Do it later']],
  ['322:12863',['Who are you sending to?','Enter their Fasset tag, phone number, or email, or choose a contact.','Fasset tag, phone, or email','Your recent recipients will appear here.','Do it later']],
  ['340:13148',['Send money','Send to a Fasset account or share a payment link. Review the rate and fees before you confirm.','No transfer fee','Share a link','You send','Do it later']],
  ['444:20351',['You send','They receive','Exchange rate','Fee','No fee','Estimated arrival','Gift a card','Do it later']],
  ['444:20454',['You send','Do it later']],
  ['455:21863',['Delivery address','Confirm your delivery address',"We'll deliver your card here.",'Search for your address','Continue','Delivery address','Search for your address']],
  ['472:22714',['Gift details','Amount held until claimed','Pending','Gift details','Date','Today, 9:41 AM','Transaction ID','Expires','In 47 hours','To','Card','Edge Aura · physical','Card price','Cancel gift']],
  ['472:22783',['Edge Aura · physical card','Upgrade card','What you get','Do it later']]
]) promoteKnown(screen,texts);

// Release QA: promote the app copy that remains visibly exposed around modal
// sheets. These exact source boxes were classified as background/data by the
// extractor, but they are still readable in the captured state and therefore
// must be rebuilt in Korean from the shared clean plate.
const exposedUnderlays={
  '472:22869':['Invite friends','Available balance','One balance for all your cards','Cards'],
  '50:86783':['Use Face ID','Unlock the app and confirm transfers with Face ID. You can still use your PIN.'],
  '50:89139':['Use Face ID','Unlock the app and confirm transfers with Face ID. You can still use your PIN.','Enable Face ID','Not now'],
  '502:47964':['What you can do','Available','Send money','Send to other people on Fasset.','Hold money','Add money locally to your USD balance.','Not available yet','Get paid','Not available in your country yet.','Invest'],
  '56:89769':['Enter your phone number',"You'll use this number to log in. No password needed."],
  '56:89940':['Enter your phone number',"You'll use this number to log in. No password needed."],
  '56:91316':['Enter your code','Resend in 0:59'],
  '62:94501':['Enter your PIN','Use your 6-digit login PIN.','Incorrect PIN. Try again.'],
  '62:95060':['Welcome back','Enter the phone number linked to your account.'],
  '62:95382':['Welcome back','Continue with your saved number.'],
  '62:96875':['Enter your code','Resend in 0:59'],
  '84:100478':['Enter your code','Resend in 0:59'],
  '84:125908':['Enter your phone number',"You'll use this number to log in. No password needed."],
  '94:43094':['Log out','Where do you live?',"We'll show the products and currencies available where you live.",'Search countries','Unavailable'],
  '94:5372':['Log out','Where do you live?',"We'll show the products and currencies available where you live.",'Search countries','Suggested'],
  '97:49535':['What you can do','Available','Send money','Send to supported bank accounts, Fasset accounts, or crypto addresses. View destinations','Hold money','Add money to your AED balance.'],
  '97:49775':['What you can do','Available','Send money','Send to supported bank accounts, Fasset accounts, or crypto addresses. View destinations','Hold money','Add money to your AED balance.'],
  '97:49924':['What you can do','Available','Send money','Send to supported bank accounts, Fasset accounts, or crypto addresses. View destinations','Hold money','Add money to your AED balance.'],
  '97:50079':['What you can do','Available','Send money','Send to supported bank accounts, Fasset accounts, or crypto addresses. View destinations','Hold money','Add money to your AED balance.'],
  '97:50228':['What you can do','Available','Get paid','Receive USD using your account details. View account details','Send money','Send to supported bank accounts, Fasset accounts, or crypto addresses. View destinations']
};
for(const [screen,texts] of Object.entries(exposedUnderlays)) promoteKnown(screen,texts);

// The capability sheet in this frame occludes later repeated availability
// rows. `promoteKnown` intentionally binds every exact occurrence, so keep only
// the two instances that remain above the sheet edge in the captured state.
for(const m of matches('502:47964','fx.27a0abd771')) if(m.y>520)m.visualSafe=false;

// Runtime-template underlays need their existing semantic keys and values.
promoteExact('472:22714','Card gift for Ayesha','fx.3fce72dd21',{vals:{name:'Ayesha'}});
promoteExact('472:22783','Basit gifted you an Edge Aura card. Verify your identity, then confirm your delivery address. Estimated delivery: up to 20 working days.','fx.cf8e4c6cb3',{vals:{name:'Basit'},lines:3,lh:20,fs:14});
for(const screen of ['56:91316','62:96875','84:100478']){
  promoteExact(screen,'Enter the code sent to +971 50 123 4567 on WhatsApp.','fx.4a08d211d5',{vals:{phone:'+971 50 123 4567'},lines:2,lh:18.2,fs:14});
}

// These fixed labels had no extracted copy row, so recover them once and bind
// every occurrence to the same stable generated key.
promoteExact('472:22869','Get a new card',ensureRow('Get a new card','새 카드 받기','label','CARDS'));
promoteExact('62:95272','Phone number',ensureRow('Phone number','휴대폰 번호','label','LOG IN'),{fg:'#9f9f9f',fs:14,lines:1,lh:16});
promoteExact('84:128735','Email','fx.a88b7dcd1a',{fs:14,lines:1,lh:16});

// The underlying destructive action is genuinely present in the source frame
// and must be erased from the plate, but it is occluded by the active sheet.
// Rebuild it only on the English reference, not as a second Korean CTA.
for(const m of matches('472:22714','fx.d887960b04')) if(m.y<820){m.hideKo=true;m.hideEn=true;}

// Keep the phone glyph and Korean call label as one centred group without the
// glyph crossing the first Hangul character.
const callMe=first('84:100478','fx.6e68c80d13');
if(callMe) callMe.draw={x:180,y:749.9,w:90,h:18.2,align:'left'};

// Modal underlays are real app copy too. Promote the lines that remain
// visible around the foreground sheet/dialog instead of leaving English on
// the Korean side. Runtime examples stay bound to their template rows.
for(const screen of ['103:58783','103:59007']){
  promoteExact(screen,"Have your passport, national ID, or driver's license ready. You can deposit up to USD 1,000 before verification.",'fx.14a74fd46a',{
    vals:{amount:'USD 1,000'},lines:3,lh:16,fs:14
  });
}
promoteExact('444:20351','Gift a virtual card or choose a physical card from AED 99.','fx.984988275c',{
  vals:{amount:'AED 99'},lines:2,lh:18,fs:13,draw:{x:37,y:476,w:209,h:36,align:'left'}
});
promoteExact('463:21830','Basit gifted you an Edge Aura card. Verify your identity, then confirm your delivery address. Estimated delivery: up to 20 working days.','fx.cf8e4c6cb3',{
  vals:{name:'Basit'},lines:3,lh:20,fs:14
});
promoteExact('463:21830','Edge Aura · physical card','fx.1e1c1f5be5',{lines:1,lh:20,fs:14});
promoteExact('463:21830','Change card','fx.216e7c1a94',{lines:1,lh:12,fs:11,align:'center'});

// Only tiny tails of these background strings are exposed beside native
// overlays. Remove those exact Vision tokens without drawing Korean above the
// OS/HUD surface; rebuild the source fragments on the English comparison.
for(const [key,text,x,y,w,h,fs] of [
  ['fx.7e31bd44ae','you.',347,386,28,12,12],
  ['fx.e8f703f3c8','ney',347,455,28,15,14]
]) addMatch('103:59007',key,{x,y,w,h,text},{ocrLine:text,sourceText:text,hideKo:true,visualSafe:true,lines:1,lh:h,fs});
for(const [key,text,x,y,w,h,fs] of [
  ['fx.871f3761bd','GIF',99,437,22,12,10],
  ['fx.d322e201b7','Edg',97,461,30,16,14],
  ['fx.d322e201b7','card',99,481,32,12,11]
]) addMatch('444:20706',key,{x,y,w,h,text},{ocrLine:text,sourceText:text,hideKo:true,visualSafe:true,lines:1,lh:h,fs});

// The empty-address state arrived as one merged title/body node. Preserve the
// source OCR binding but expose the intended two typographic roles.
const addressMerged='Find your address Search for your card delivery address.';
const addressTitle=first('455:21789','fx.3ca1270b03');
const addressTitleRow=copy.find(row=>row.k==='fx.3ca1270b03');
if(addressTitleRow){addressTitleRow.en='Find your address';addressTitleRow.ko='주소 찾기';addressTitleRow.c='title';}
if(addressTitle)Object.assign(addressTitle,{x:29,y:559,w:335,h:20,lines:1,lh:20,fs:16,weight:600,align:'center',ocrLine:addressMerged,draw:{x:29,y:559,w:335,h:20,align:'center'}});
pseudo('455:21789','Search for your card delivery address.','카드 배송 주소를 검색해 주세요.',{x:29,y:583,w:335,h:18},{lines:1,lh:18,fs:14,align:'center',fg:'#c3c3c3',ocrLine:addressMerged});

// These are stale duplicate layers in the confirmation-sheet state. Keep the
// English comparison truthful, but omit them from the Korean target after the
// shared plate has removed their source pixels.
for(const m of matches('455:21863','fx.6108ed4f68')) if(Math.abs(m.y-295)<1){m.hideKo=true;m.hideEn=true;}
for(const m of matches('455:21863','fx.eee0bbba4f')) if(Math.abs(m.y-764)<1){m.hideKo=true;m.hideEn=true;}
// These CTAs sit behind a native permission sheet. Their sampled source ink
// is too dim to infer reliably, so use the verified button geometry and ink.
for(const screen of ['103:57375','103:59007']){
  const m=first(screen,'fx.5ca3f8fb75');
  if(m)Object.assign(m,{lines:1,lh:18.2,fs:14,fg:'#143a2c',draw:{x:124.4,y:783.4,w:144.2,h:18.2,align:'center'}});
}
for(const m of matches('444:20351','fx.9ba0a08a1e')) if(m.y>500)m.visualSafe=false;

// Runtime names in the captured state map to the template rows already in the
// reviewer data; keep the template editable while previewing Basit's example.
for(const screen of ['463:21830','463:21915','472:22783']){
  promoteExact(screen,'A card from Basit','fx.8817baa5c5',{vals:{name:'Basit'},ocrLine:'A card from Basit'});
}

// OS permission text is part of the screenshot rather than a Figma text node.
// Model it explicitly so the Korean side is a real localized state.
const permissionRows={
  cameraTitle:['"Fasset" Would Like to Access the Camera','"Fasset"이(가) 카메라에 접근하려고 합니다'],
  cameraBody:['Fasset uses the camera to scan your ID and take your selfie.','Fasset에서 신분증을 스캔하고 셀피를 촬영하기 위해 카메라를 사용합니다.'],
  contactsTitle:['"Fasset" Would Like to Access Your Contacts','"Fasset"이(가) 연락처에 접근하려고 합니다'],
  contactsBody:['Find contacts on Fasset and choose who to send money to.','Fasset에서 연락처를 찾아 송금할 사람을 선택하세요.'],
  deny:["Don't Allow",'허용 안 함'],allow:['Allow','허용']
};
for(const screen of ['103:57375','103:59007']){
  pseudo(screen,...permissionRows.cameraTitle,{x:65,y:347,w:260,h:40},{lines:2,lh:20,fs:18,weight:600,align:'left'});
  pseudo(screen,...permissionRows.cameraBody,{x:65,y:401,w:270,h:44},{lines:2,lh:22,fs:15,align:'left'});
  pseudo(screen,...permissionRows.deny,{x:83,y:483,w:86,h:18},{lines:1,lh:18,fs:15,align:'center'});
  pseudo(screen,...permissionRows.allow,{x:243,y:483,w:46,h:18},{lines:1,lh:18,fs:15,align:'center'});
}
pseudo('322:12863',...permissionRows.contactsTitle,{x:65,y:345,w:270,h:42},{lines:2,lh:21,fs:18,weight:600,align:'left'});
pseudo('322:12863',...permissionRows.contactsBody,{x:65,y:400,w:270,h:46},{lines:2,lh:23,fs:15,align:'left'});
pseudo('322:12863',...permissionRows.deny,{x:83,y:483,w:86,h:18},{lines:1,lh:18,fs:15,align:'center'});
pseudo('322:12863',...permissionRows.allow,{x:243,y:483,w:46,h:18},{lines:1,lh:18,fs:15,align:'center'});

// Instructional copy is baked into the supplied illustration. Exact Vision
// word boxes let us localize the words without touching the nearby status
// icons or identity-card art.
for(const [screen,firstEn,firstKo] of [
  ['103:61759','Place your original card inside the frame.','원본 카드를 프레임 안에 넣어 주세요.'],
  ['103:61851','Place your original document inside the frame.','원본 문서를 프레임 안에 넣어 주세요.']
]){
  pseudo(screen,firstEn,firstKo,{x:155,y:245,w:205,h:34},{lines:2,lh:17,fs:12,align:'left'});
  for(const [en,ko,y] of [
    ["Don't use a photo of your ID.",'신분증 사진을 사용하지 마세요.',312],
    ['Hold your phone steady.','휴대폰을 움직이지 마세요.',375],
    ["Don't use a photocopy.",'복사본을 사용하지 마세요.',437],
    ['Keep all four corners visible.','네 모서리가 모두 보이게 해 주세요.',497]
  ]) pseudo(screen,en,ko,{x:155,y,w:205,h:18},{lines:1,lh:18,fs:12,align:'left'});
}

// Preview runtime template values as human-readable sample data. The exported
// reviewer JSON still retains the original placeholders.
for(const model of Object.values(boxes)) for(const m of model.matches||[]){
  if(m.k==='fx.9ede2489df'){m.forcePreview=true;m.valsEn={arrival_time:'2–5 min'};m.valsKo={arrival_time:'2~5분'};}
  if(m.k==='fx.96d946447a'){m.valsEn={approved_rate:'1%',reward_asset:'USD',approved_benefits:'airport lounge access'};m.valsKo={approved_rate:'1%',reward_asset:'USD',approved_benefits:'공항 라운지 이용'};}
}

// These rows were protected only because their old component boxes included
// neighbours. Bind them to the visible Vision text positions instead.
const aura=first('455:21960','fx.2914c6e1fb');
if(aura)Object.assign(aura,{x:42,y:507,w:111,h:16,lines:1,lh:12,fs:10,ocrLine:'Edge Aura • physical',text:'Edge Aura · physical',visualSafe:true,draw:{x:42,y:507,w:111,h:16,align:'center'}});
// The delivery-address frame contains inactive off-canvas form nodes as well
// as the six visible rows. Enable only the exact visible instances.
for(const m of boxes['455:21789']?.matches||[]){
  const visible=
    (m.k==='fx.2b8ebf6e0d'&&(m.y<100||m.y>200&&m.y<260))||
    m.k==='fx.8bf878dbc9'||m.k==='fx.ce86ee5c01'||
    (m.k==='fx.6108ed4f68'&&m.y>260&&m.y<290)||m.k==='fx.3ca1270b03';
  if(visible)m.visualSafe=true;
}
for(const screen of ['463:22025','463:22295']){
  const fee=first(screen,'fx.7e9c7270cc'),estimate=first(screen,'fx.1dfd42d04f'),time=first(screen,'fx.a736f5a242');
  if(fee)Object.assign(fee,{x:36,y:585.5,w:122.64,h:14,lines:1,lh:14,fs:12,ocrLine:'Delivery fee',visualSafe:true,draw:{x:36,y:585.5,w:122.64,h:14,align:'left'}});
  if(estimate)Object.assign(estimate,{x:36,y:617.5,w:137.52,h:14,lines:1,lh:14,fs:12,ocrLine:'Estimated delivery',visualSafe:true,draw:{x:36,y:617.5,w:137.52,h:14,align:'left'}});
  if(time)Object.assign(time,{x:164,y:617.5,w:193,h:14,lines:1,lh:14,fs:12,ocrLine:'Up to 20 working days',visualSafe:true,draw:{x:164,y:617.5,w:193,h:14,align:'right'}});
}
for(const row of copy){
  if(row.k==='fx.1dfd42d04f')row.ko='예상 배송';
  if(row.k==='fx.a736f5a242')row.ko='최대 20영업일';
}
for(const screen of ['321:12641','378:13532'])draw(screen,'fx.9c15cdadc0',{x:16,y:368,w:44,h:20,align:'left'});
const linkSent=first('321:12726','fx.6611c68470');
if(linkSent){linkSent.visionPad=4;linkSent.lines=1;linkSent.lh=32;linkSent.draw={x:16,y:354,w:361,h:32,align:'center'};}

// Stale/off-screen design layers have no corresponding English pixels in the
// exported frame. Keep them editable in the panel, but do not fabricate them
// on the visual preview or let a fallback mask damage the screen.
for(const [screen,key] of [
  ['97:48956','fx.93d3a4938a'],
  ['103:52741','fx.3a333c06f0'],
  ['103:53007','fx.7a0bfc9d70'],
  ['103:53285','fx.3a333c06f0'],
  ['103:53550','fx.3a333c06f0'],
  ['103:61759','fx.212bda3907'],
  ['103:61851','fx.212bda3907'],
  ['444:20706','fx.871f3761bd'],
  ['444:20706','fx.d322e201b7'],
  ['463:21781','fx.5d36621498'],
  ['463:21781','fx.657a715402'],
]) protect(screen,key);
// The full gift-card nodes above remain protected, but their exact OCR tails
// are safe to erase from the Korean plate without painting over Face ID.
for(const m of boxes['444:20706']?.matches||[]) if(m.hideKo)m.visualSafe=true;

// The small gift-banner CTA shares a key with the banner heading. Its source
// node baseline is below the pill, so draw the label at the pill's visual
// centre while retaining the precise source-ink erase box.
enable('363:13505','fx.17a5959b7c');
enable('378:13532','fx.c558e48150');
for(const m of matches('444:20302','fx.9ba0a08a1e')) if(m.y>500){
  Object.assign(m,{lines:1,lh:20,fs:12,draw:{x:41,y:556,w:96,h:20,align:'left'}});
}

// Short labels leave the source icon's reserved gap intact.
for(const row of copy){
  if(row.k==='fx.7661be4aa8') row.ko='무료';
  if(row.k==='fx.5a68b0500a') row.ko='발급 무료';
  if(row.k==='fx.dbbae5432f') row.ko='체크·신용카드';
  if(row.k==='fx.984988275c') row.ko='가상 카드를 선물하거나 {{amount}}부터 실물 카드를 골라 보세요.';
  if(row.k==='fx.bcb00709d9') row.ko='Visa 가맹점에서 USD로 결제';
  if(row.k==='fx.c0502012be') row.ko='가맹점 결제·ATM 출금';
}

// Synthetic recovery rows must still identify every design frame they occur
// in so the reviewer export is traceable back to the supplied Figma state.
const figmaScreensPath=path.join(root,'data/figma/screens.json');
if(fs.existsSync(figmaScreensPath)){
  const screenData=JSON.parse(fs.readFileSync(figmaScreensPath,'utf8'));
  const meta=new Map((screenData.all_screens||screenData.screens||[]).map(s=>[s.id,s]));
  const occurrences={};
  for(const [screen,model] of Object.entries(boxes)) for(const m of model.matches||[]){
    const s=meta.get(screen)||{};
    const list=occurrences[m.k]||(occurrences[m.k]=[]);
    if(!list.some(x=>x.frame===screen)) list.push({frame:screen,frame_name:s.name||screen,node:null,section:s.journeyName||'Preview recovery'});
  }
  for(const row of copy) if((!row.figma||!row.figma.length)&&occurrences[row.k]) row.figma=occurrences[row.k];
}

const compactLines=value=>JSON.stringify(value,null,1).replace(/^ +/gm,'')+'\n';
fs.writeFileSync(boxesPath,JSON.stringify(boxes));
fs.writeFileSync(copyPath,compactLines(copy));
console.log('Applied Figma preview corrections');
