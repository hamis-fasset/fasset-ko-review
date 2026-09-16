import json,re,collections,sys,os
SCR=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ocr=json.load(open(f'{SCR}/site/data/ocr.json')); screens={s['id']:s for s in json.load(open(f'{SCR}/site/data/screens.json'))['screens']}
copy=json.load(open(f'{SCR}/site/data/copy.json')); kept=[r['en'].lower() for r in copy if r['keep'] and len(r['en'])>=12]
ASSET=re.compile(r'^(Tether( Gold)?|Bitcoin|Ethereum|BNB|Ripple|USD Coin|Solana|Nvidia Corp|Apple|Alphabet|The Walt Di.*|Copper ETF|SPDR.*|WisdomTree.*|Zebec Network|Gala|Immutable|Dogecoin|Sonic|EnVIDA.*|The Ch.*Compa.*|English|United States Dollar|jruuoy|FASSET.*|Fasset|VISA|VICA|cni|nAnOI|EAVIDIA|• NVIDI)$',re.I)
def is_data(t):
    letters=len(re.findall(r'[A-Za-z]',t)); return letters/max(len(t),1)<0.5 or bool(re.fullmatch(r'[•\s]*[A-Z]{2,5}(, [A-Z]{2,5})*',t))
rows=collections.OrderedDict(); frag=[]; trunc=[]; data=set()
for sid,o in ocr.items():
    for u in o['unmatched']:
        t=u['text'].strip()
        if u['kind']=='data' or ASSET.match(t) or is_data(t): data.add(t); continue
        if u['kind']=='fragment' or any(t.lower() in k for k in kept): frag.append((sid,t)); continue
        if u['kind']=='truncated': trunc.append((sid,t))
        rows.setdefault(t,[]).append(sid)
L=['# Visible English with no translation key','',f'{len(rows)} distinct strings seen on the {len(ocr)} captures that match no key in either copy drop. They are still hardcoded in screen components. Grouped by the screen area where first seen.','']
byj=collections.defaultdict(list)
for t,sids in rows.items(): byj[screens[sids[0]]['journeyName']].append((t,sids))
for j,items in byj.items(): L.append(f'## {j}'); L+=[f'- "{t}"  (seen on {", ".join(sorted(set(s)))})' for t,s in items]; L.append('')
L.append('## Sentences assembled from fragments (kept in English by decision, need merging in code)'); L+=sorted({f'- "{t}"  ({s})' for s,t in frag}); L.append('')
L.append('## English already cut off on the device (layout bug in the English app, will be worse in Korean)'); L+=sorted({f'- "{t}"  ({s})' for s,t in trunc}); L.append('')
L.append('## Ignored as data: asset names, amounts, user details'); L.append(', '.join(sorted(data)))
open(f'{SCR}/site/STILL-HARDCODED.md','w').write('\n'.join(L)); print(len(rows),'hardcoded;',len(set(frag)),'fragment lines;',len(set(trunc)),'truncated')
