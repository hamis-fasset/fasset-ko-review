#!/usr/bin/env python3
"""Fold hardcoded.ko.json (id -> Korean) into hardcoded.json and the site's copy.json, and write the dev-pack hardcoded-strings.json."""
import json,os,sys
SCR=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); site=f'{SCR}/site'
hc=json.load(open(f'{site}/data/hardcoded.json')); ko=json.load(open(f'{site}/data/hardcoded.ko.json'))
missing=[k for k in hc if k not in ko]
for k,v in hc.items():
    if k in ko: v['ko']=ko[k]
json.dump(hc,open(f'{site}/data/hardcoded.json','w'),ensure_ascii=False,indent=1)
rows=json.load(open(f'{site}/data/copy.json'))
for r in rows:
    if r.get('hc') and r['k'] in ko: r['ko']=ko[r['k']]
json.dump(rows,open(f'{site}/data/copy.json','w'),ensure_ascii=False,separators=(',',':'))
dp=sys.argv[1] if len(sys.argv)>1 else None
if dp:
    json.dump({k:{'en':v['en'],'ko':v['ko'],'kind':v['kind'],'screens':v['screens']} for k,v in hc.items()},open(f'{dp}/hardcoded-strings.json','w'),ensure_ascii=False,indent=2)
print('merged',len(ko),'missing',missing)
