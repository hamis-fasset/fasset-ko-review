#!/usr/bin/env python3
"""Ingest a downloaded Maestro snapshot artifact into the review site.
usage: ingest.py <artifact_dir> [--theme light]
Finds every manifest.json under the artifact, takes the newest run per journey,
adds unseen screen ids to site/data/screens.json (plain names derived from the id),
converts PNGs to site/img/<id>.jpg, copies PNGs to ocr/png, runs OCR on new ones,
then re-runs match.py."""
import json,sys,os,glob,re,subprocess,shutil
SCR=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
art=sys.argv[1]; theme='light'
if '--theme' in sys.argv: theme=sys.argv[sys.argv.index('--theme')+1]
site=f'{SCR}/site'; sj=json.load(open(f'{site}/data/screens.json'))
JN={'login':'Logging in','dashboard':'Home','market':'Market','buy':'Buying','sell':'Selling','history':'History','settings':'Settings','logout':'Logging out','kyc_ae':'Identity check (UAE)','kyc_lb':'Identity check (Lebanon)',
    'signup':'Signing up','deposit':'Deposit','deposit_full':'Deposit','earn':'Earn','earn_full':'Earn','rewards':'Rewards','security':'Security','account':'Account','account_full':'Account','history_full':'History','kyc_id':'Identity check (ID document)','market_full':'Market','forgot_password':'Forgot password'}
NS={'signup':['signUp','signup_new','newSignup','nonSocial','onBoarding','onBoardingScreen','globalOnboard','ff_onboarding_3_copy_refresh','new_ob','pin','verifyDevice','restrict_ob'],
    'deposit':['depositV4','depositCKO','depositeScreen','indoDepositPayList','cryptoWithDraw','lean','youDontHaveBankAccount','new'],'deposit_full':None,
    'earn':['earn','staking'],'earn_full':None,'rewards':['rewardsV4','refer','referralProgram','referralProgress','voucher','vouchers'],
    'security':['new','myFasset','verifyDevice','pin'],'account':['account','preferences','myFasset','modals','accountsV4'],'account_full':None,
    'history_full':['accountsV4','buyV4','sellFlow','p2pTabs','voucher'],'kyc_id':['kyc','kycValidate','manualKYC','poa','newKYCQuestion'],
    'market_full':['market_v4','market','bundles','bundle','stock','stockMarketClosed','tradeV4'],'forgot_password':['logIn','signUp','new']}
for k,v in list(NS.items()):
    if v is None: NS[k]=NS[k.replace('_full','')]
known={s['id'] for s in sj['screens']}
manifests=glob.glob(f'{art}/**/manifest.json',recursive=True)
if theme: manifests=[m for m in manifests if f'/{theme}/' in m or ('/light/' not in m and '/dark/' not in m)]
latest={}
for m in manifests:
    d=json.load(open(m)); j=d['run']['journey']; rid=d['run']['run_id']
    if j not in latest or rid>latest[j][0]: latest[j]=(rid,m,d)
added=[]; pngs=[]
for j,(rid,m,d) in sorted(latest.items()):
    folder=os.path.dirname(m)
    shots=d.get('captured') or d.get('screens') or d.get('screenshots') or []
    if not shots: shots=[{'screen_id':os.path.basename(p)[:-4]} for p in sorted(glob.glob(f'{folder}/*.png'))]
    seq=0
    for sh in shots:
        sid=sh.get('screen_id') or sh.get('id'); png=f'{folder}/{sid}.png'
        if not sid or not os.path.exists(png): continue
        seq+=1
        shutil.copy(png,f'{SCR}/ocr/png/{sid}.png'); pngs.append(f'{SCR}/ocr/png/{sid}.png')
        subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','82',png,'--out',f'{site}/img/{sid}.jpg'],check=True,capture_output=True)
        if sid in known: continue
        m2=re.match(rf'^{re.escape(j)}_(\d+)_(.+)$',sid); n=int(m2.group(1)) if m2 else seq; name=(m2.group(2) if m2 else sid).replace('_',' ')
        name=name[0].upper()+name[1:]
        sj['screens'].append({'id':sid,'journey':j,'journeyName':JN.get(j,j.replace('_',' ').title()),'name':name,'seq':n,'img':f'img/{sid}.jpg','ns':NS.get(j,[])})
        known.add(sid); added.append(sid)
order=list(dict.fromkeys([s['journey'] for s in sj['screens']]))
sj['screens'].sort(key=lambda s:(order.index(s['journey']),s['seq'],s['id']))
sj['journeys']=[{'id':j,'name':JN.get(j,j)} for j in order]
json.dump(sj,open(f'{site}/data/screens.json','w'),ensure_ascii=False,indent=0)
print('added',len(added),'screens; journeys:',len(order))
# OCR new pngs (all, cheap) and rematch
ocr_json=f'{SCR}/ocr/ocr.json'; old=json.load(open(ocr_json)) if os.path.exists(ocr_json) else {}
todo=[p for p in pngs if os.path.basename(p) not in old]
if todo:
    tmp=f'{SCR}/ocr/ocr_new.json'; subprocess.run([f'{SCR}/ocr/ocr',tmp]+todo,check=True)
    old.update(json.load(open(tmp))); json.dump(old,open(ocr_json,'w'))
    print('ocr',len(todo),'new images')
subprocess.run(['python3',f'{SCR}/ocr/match.py',SCR],check=True)
for a in added: print(' +',a)
