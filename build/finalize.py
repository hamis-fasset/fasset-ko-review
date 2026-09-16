#!/usr/bin/env python3
"""Bake the reviewer's export into the prototype and the developer files, then publish.
usage: venv/bin/python ocr/finalize.py <fasset-korean-review-....json> [--no-push]
- site/data/copy.json: reviewed Korean becomes the shown text; a 'reviewed' stamp is written to site/data/review-meta.json
- site/img-ko: Korean screens re-rendered with the reviewed text
- dev pack: apply-review.py run -> translation.reviewed.json, hardcoded-strings.reviewed.json; reference/korean-preview refreshed
- git commit + push of the site (GitHub Pages) unless --no-push"""
import json,sys,os,subprocess,shutil,datetime
SCR=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); site=f'{SCR}/site'
DP=os.environ.get('DEVPACK','/Users/hamismahmood-personal/Downloads/Fasset/Operating System/pm-os/products/cashapp/work/localization/ko/out/dev-pack')
export=sys.argv[1]; d=json.load(open(export))
rows=json.load(open(f'{site}/data/copy.json')); by={r['k']:r for r in rows}; n=0
for e in d.get('edits',[]):
    for k in [e['key']]+list(e.get('also_used_as') or []):
        if k in by and by[k]['ko']!=e['new_korean']: by[k]['ko']=e['new_korean']; n+=1
for h in d.get('hardcoded',[]):
    if h['id'] in by and by[h['id']]['ko']!=h['korean']: by[h['id']]['ko']=h['korean']; n+=1
json.dump(rows,open(f'{site}/data/copy.json','w'),ensure_ascii=False,separators=(',',':'))
hc=json.load(open(f'{site}/data/hardcoded.json'))
for h in d.get('hardcoded',[]):
    if h['id'] in hc: hc[h['id']]['ko']=h['korean']
json.dump(hc,open(f'{site}/data/hardcoded.json','w'),ensure_ascii=False,indent=1)
json.dump({'reviewed_at':d.get('exported'),'applied_at':datetime.datetime.utcnow().isoformat()+'Z','changes':n,'approved':len(d.get('approved_unchanged',[]))+sum(1 for e in d.get('edits',[]) if e.get('approved'))},open(f'{site}/data/review-meta.json','w'))
subprocess.run([sys.executable,f'{SCR}/ocr/compose.py','--clean'],check=True)
shutil.copy(export,f'{DP}/reviewer-export.json')
subprocess.run(['python3',f'{DP}/apply-review.py',export],check=True)
for f in os.listdir(f'{site}/img-ko'): shutil.copy(f'{site}/img-ko/{f}',f'{DP}/reference/korean-preview/{f}')
print(f'{n} strings updated in the prototype')
if '--no-push' not in sys.argv:
    subprocess.run(['git','-C',site,'add','-A'],check=True)
    subprocess.run(['git','-C',site,'-c','user.name=Hamis Mahmood','-c','user.email=hamis.mahmood@fasset.com','commit','-q','-m',f'Apply reviewer export {os.path.basename(export)}'],check=False)
    subprocess.run(['git','-C',site,'-c','credential.helper=','-c','credential.helper=!gh auth git-credential','push','-q','origin','main'],check=True); print('published')
