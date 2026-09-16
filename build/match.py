"""Match OCR lines on each capture to translation keys. v2.
- placeholder patterns tried before junk-stripping; captured values stored as `vals`
- literal part must be a meaningful share of the line (no "Send {{a}} {{b}}" eating sentences)
- leading/trailing icon junk ("Q", "G", "• D", "0%", "<") trimmed from the box proportionally
- `weak: true` when the matched key's namespace is not one the screen's code uses (same English, maybe different meaning)
- unmatched lines with letters kept, with a `kind` (truncated / data / text)
"""
import json,sys,re,collections
scr=sys.argv[1]
ocr=json.load(open(f'{scr}/ocr/ocr.json'))
copy=[r for r in json.load(open(f'{scr}/site/data/copy.json')) if r['ns']!='hardcoded']
screens=json.load(open(f'{scr}/site/data/screens.json'))['screens']
try: inv=json.load(open(f'{scr}/screen-inventory.json'))
except Exception: inv=[]
code_ns=collections.defaultdict(set)
for r in inv:
    for c in r.get('capture_ids') or []: code_ns[c].update(r.get('namespaces') or [])
GENERIC={'new','updated','tabBar','modals','tooltip'}
ASSETS=re.compile(r"^(?:tether( gold)?|bitcoin|ethereum|bnb|ripple|usd coin|solana|dogecoin|gala|immutable|zebec network|sonic|nvidia corp|apple|alphabet|the walt disney company|copper etf|spdr s&p 500 etf trust|wisdomtree floating rate tre\S*|pax gold|xaut|usdt|usdc|paxg|(?:bitcoin|stablecoin|gold|tech|growth) bundle|english|united states dollar|jruuoy|pkuser@mailinator\.com|fasset|fasset pay|fasset connect|edge access • virtual|visa)$",re.I)
def is_data(t):
    t=t.strip()
    if ASSETS.match(re.sub(r'\.\.\.$','',t).strip()): return True
    if re.match(r'^(the walt di|envida|the ch)',t.lower()): return True
    core=re.sub(r'\b(USD|USDT|BTC|ETH|AED|SOL|[A-Z]{2,6})\b','',t); core=re.sub(r'\bO\b','0',core)
    letters=len(re.findall(r'[A-Za-z]',core))
    if letters/max(len(core.strip()),1)<0.5: return True
    words=re.findall(r'[A-Za-z]{3,}',t)
    if words and any(not re.search(r'[aeiouyAEIOUY]',w) or re.search(r'[a-z][A-Z]',w) for w in words) and len(words)<=3: return True
    if re.fullmatch(r'[#•\s]*[A-Z]{3,}[•®]*',t): return True
    if re.fullmatch(r'[a-z]{2,4}',t) and t not in ('min','max','all','buy','sell','fee','to','from','of','or'): return True
    if re.fullmatch(r'[©]?\s*\d{4}\s+\w+|\d{1,2} \w{3} \d{4}',t): return True
    return False
def pattern_item(t):
    m=re.fullmatch(r'(Sold|Bought)\s+[A-Z]{2,6}',t.strip())
    if m: return f'{m.group(1)} {{{{asset}}}}',{'asset':t.split()[-1]}
    return None,None
def norm(s): return re.sub(r'[^a-z0-9{}]+',' ',s.lower()).strip()
def normcase(s): return re.sub(r'[^A-Za-z0-9{}]+',' ',s).strip()
def vals_case(m,text,en=None):
    if en:
        pat='^\\W*'+re.sub(r'\\\{\\\{(\w+)\\\}\\\}',lambda g:rf'(?P<{g.group(1)}>.+?)',re.sub(r'(\\\s)+',r'\\s*',re.escape(en)))+'\\W*$'
        try:
            r=re.match(pat,text.strip(),re.I)
            if r: return {k:v.strip() for k,v in r.groupdict().items()}
        except re.error: pass
    kc=normcase(text)
    if len(kc)!=len(m.string): return m.groupdict()
    return {k:kc[m.start(k):m.end(k)] for k in m.groupdict()}
KEPT_EN={norm(r['en']) for r in copy if r['keep']}
by_norm=collections.defaultdict(list)
for r in copy:
    if not r['keep']: by_norm[norm(r['en'])].append(r)
ph_rows=[]
for r in copy:
    if not r['ph'] or r['keep']: continue
    n=norm(r['en']); lit=re.sub(r'\{\{\w+\}\}','',n).strip()
    if len(lit)<3: continue
    names=re.findall(r'\{\{(\w+)\}\}',n)
    rx='^'+re.sub(r'\\\{\\\{(\w+)\\\}\\\}',lambda m:rf'(?P<{m.group(1)}>\S+(?: \S+){{0,3}}?)',re.escape(n))+'$'
    ph_rows.append((r,re.compile(rx),len(lit)))
JUNK=re.compile(r'^(?:[^a-z0-9]+|[a-z0-9]{1,2}|\d+%)$')
def strip_junk(tokens):
    a,b=0,len(tokens)
    while a<b and JUNK.match(tokens[a]): a+=1
    while b>a and JUNK.match(tokens[b-1]): b-=1
    return a,b
def pick(rows,ns):
    return sorted(rows,key=lambda r:(0 if r['ns'] in ns else 1, 0 if r['canon']==r['k'] else 1, r['k']))[0]
def lookup(text,ns,single):
    """returns (row, a, b, vals) where a,b are token bounds of the matched part in norm(text).split()"""
    n=norm(text); toks=n.split()
    if len(n)<2: return None
    if n in by_norm: return (pick(by_norm[n],ns),0,len(toks),{})
    if single:
        cands=[(r,m) for r,rx,litlen in ph_rows if (m:=rx.match(n)) and litlen/len(n)>=0.3]
        if cands:
            if any(norm(v) in KEPT_EN for r,m in cands for v in m.groupdict().values()): return ('fragment',0,len(toks),{})
            # prefer the key whose exact punctuation matches the raw line, then the screen's namespaces
            def score(c):
                r,m=c; v=vals_case(m,text,r['en']); clean=all(re.match(r'^[\w.,\-@/: ]+$',x) for x in v.values())
                return (0 if clean else 1, 0 if r['ns'] in ns else 1, len(r['en']))
            r,m=sorted(cands,key=score)[0]
            v={k:x.strip('()[]:;,. ') for k,x in vals_case(m,text,r['en']).items()}
            return (r,0,len(toks),v)
    a,b=strip_junk(toks)
    if (a,b)!=(0,len(toks)) and b>a:
        core=' '.join(toks[a:b])
        if core in by_norm: return (pick(by_norm[core],ns),a,b,{})
        if single:
            for r,rx,litlen in ph_rows:
                m=rx.match(core)
                if m and litlen/len(core)>=0.3:
                    if any(norm(v) in KEPT_EN for v in m.groupdict().values()): return ('fragment',a,b,{})
                    return (r,a,b,vals_case(m,' '.join(normcase(text).split()[a:b]),r['en']))
    return None
out={}; stats=collections.Counter()
for s in screens:
    sid=s['id']
    if f'{sid}.png' not in ocr: continue
    o=ocr[f'{sid}.png']; ns=set(s['ns'])|code_ns.get(sid,set())|code_ns.get(re.sub(r'_[a-z_]+$','',sid),set())
    lines=[l for l in o['lines'] if l['y']>90 and l['conf']>0.3 and 'sentry test' not in l['text'].lower()]
    # drop icon-only lines (a lone "G", "Q", "<", "• D") so they never merge into neighbouring text
    lines=[l for l in lines if not all(JUNK.match(t) for t in norm(l['text']).split()) or re.search(r'\d',l['text'])]
    lines.sort(key=lambda l:(l['y'],l['x']))
    asset_ids=set()
    for a in lines:
        if not re.fullmatch(r"[A-Z][A-Za-z0-9.&'()-]*( [A-Za-z0-9.&'()-]+){0,4}",a['text'].strip()): continue
        for b in lines:
            if b is a: continue
            if re.fullmatch(r'[A-Z0-9]{2,6}',b['text'].strip()) and 0<b['y']-a['y']<a['h']*2.2 and abs(b['x']-a['x'])<25: asset_ids.add(id(a)); asset_ids.add(id(b))
    data_lines=[l for l in lines if id(l) in asset_ids]; lines=[l for l in lines if id(l) not in asset_ids]
    used=set(); matches=[]; i=0; unmatched_frag=[]
    while i<len(lines):
        best=None
        for span in (4,3,2,1):
            if i+span>len(lines): continue
            grp=lines[i:i+span]
            if span>1 and not all(0<grp[j+1]['y']-grp[j]['y']<grp[j]['h']*2.2 for j in range(span-1)): continue
            res=lookup(' '.join(l['text'] for l in grp),ns,span==1)
            if res: best=(span,res); break
        if best and best[1][0]=='fragment':
            l=lines[i]; unmatched_frag.append({'x':l['x'],'y':l['y'],'w':l['w'],'h':l['h'],'text':l['text'],'kind':'fragment'}); used.add(id(l)); i+=1; continue
        if not best:
            raw=lines[i]['text'].rstrip(); trunc_marker=raw.endswith('‹') or (lines[i]['x']+lines[i]['w']>o['w']*0.9 and raw[-1:].isalpha())
            core=norm(raw.rstrip('‹'))
            if trunc_marker and len(core)>=7:
                pref=[r for n2,rs in by_norm.items() if n2.startswith(core+' ') or (n2.startswith(core) and len(n2)-len(core)<=3) for r in rs]
                if pref and len({r['canon'] for r in pref})==1:
                    best=(1,(pick(pref,ns),0,len(core.split()),{})); lines[i]['truncated']=True
        if best and best[0]==1 and len(norm(lines[i]['text']).split())<=1 and i>0:
            prev=lines[i-1]
            if id(prev) not in used and len(re.findall(r'[A-Za-z]{2,}',prev['text']))>=2 and 0<lines[i]['y']-prev['y']<prev['h']*2.0 and not prev['text'].rstrip().endswith(('.','!','?',':')) and abs(prev['x']-lines[i]['x'])<prev['w']:
                best=None
        if best:
            span,(r,a,b,vals)=best; grp=lines[i:i+span]
            x=min(l['x'] for l in grp); y=min(l['y'] for l in grp); x2=max(l['x']+l['w'] for l in grp); y2=max(l['y']+l['h'] for l in grp)
            text=' '.join(l['text'] for l in grp); toks=norm(text).split()
            if span==1 and (a,b)!=(0,len(toks)):
                # trim box proportionally to the characters dropped
                full=len(' '.join(toks)); pre=len(' '.join(toks[:a]))+(1 if a else 0); post=len(' '.join(toks[b:]))+(1 if b<len(toks) else 0)
                cw=(x2-x)/max(full,1); x+=int(pre*cw); x2-=int(post*cw); text=' '.join(toks[a:b])
            if span==1 and is_data(text) and not r['ph']:
                for l in grp: used.add(id(l))
                unmatched_frag.append({'x':x,'y':y,'w':x2-x,'h':y2-y,'text':text,'kind':'data'}); i+=span; continue
            weak= r['ns'] not in ns and r['ns'] not in GENERIC and bool(code_ns.get(sid))
            matches.append({'k':r['canon'] if not weak else r['k'],'x':x,'y':y,'w':x2-x,'h':y2-y,'lines':span,'lh':grp[0]['h'],'text':text,'vals':vals,'weak':weak,'truncated':bool(lines[i].get('truncated'))})
            for l in grp: used.add(id(l))
            stats['matched']+=1; stats['weak']+=weak; i+=span
        else: i+=1
    unmatched=list(unmatched_frag)+[{'x':l['x'],'y':l['y'],'w':l['w'],'h':l['h'],'text':l['text'],'kind':'data'} for l in data_lines]
    for l in lines:
        if id(l) in used or not re.search(r'[A-Za-z]{3}',l['text']): continue
        t=l['text']
        kind='data' if re.fullmatch(r'[\d.,\s~=+\-%]*([A-Z]{2,5}|USD|USDT)?[\d.,\s~=+\-%]*',t) or re.search(r'\d{1,2}, 20\d\d|@|\bv?\d+\.\d+\.\d+\b',t) else 'text'
        if l['x']+l['w']>o['w']*0.97 and not t.endswith(('.', '!', '?')) and t[-1].isalpha() and len(t.split()[-1])<=3: kind='truncated'
        unmatched.append({'x':l['x'],'y':l['y'],'w':l['w'],'h':l['h'],'text':t,'kind':kind})
    stats['unmatched_text']+=sum(1 for u in unmatched if u['kind']=='text')
    # paragraphs: adjacent text/fragment lines with a similar left edge (or both centred) become one editable item
    cand=[]
    for u in unmatched:
        if u['kind'] not in ('text','fragment','truncated'): continue
        if is_data(u['text']): u['kind']='data'; continue
        pt,pv=pattern_item(u['text'])
        if pt: u['pattern']=pt; u['vals']=pv
        cand.append(u)
    cand.sort(key=lambda u:(u['y'],u['x']))
    paras=[]
    for u in cand:
        if paras:
            p=paras[-1]; last=p['parts'][-1]
            same_left=abs(u['x']-last['x'])<18; centred=abs((u['x']+u['w']/2)-(last['x']+last['w']/2))<25
            if 0<u['y']-last['y']<last['h']*1.9 and (same_left or centred) and not last['text'].rstrip().endswith(('?','!')) and not re.match(r'^\d+\.\s|^•',u['text']) and not (u.get('pattern') or last.get('pattern')) and last['kind']!='truncated' and abs(u['h']-last['h'])/max(last['h'],1)<0.25:
                p['parts'].append(u); continue
        paras.append({'parts':[u]})
    hard=[]
    for p in paras:
        ps=p['parts']; text=' '.join(x['text'].strip() for x in ps); x=min(q['x'] for q in ps); y=min(q['y'] for q in ps); x2=max(q['x']+q['w'] for q in ps); y2=max(q['y']+q['h'] for q in ps)
        if len(ps)==1 and ps[0].get('pattern'): text=ps[0]['pattern']
        hard.append({'text':text,'x':x,'y':y,'w':x2-x,'h':y2-y,'lines':len(ps),'lh':ps[0]['h'],'vals':ps[0].get('vals') or {},'kind':'fragment' if any(q['kind']=='fragment' for q in ps) else ('truncated' if any(q['kind']=='truncated' for q in ps) else 'text')})
    out[sid]={'w':o['w'],'h':o['h'],'matches':matches,'unmatched':[u for u in unmatched if u['kind']=='data'],'hardcoded':hard}
# hardcoded items -> synthetic keys hc.<n>, shared across screens by normalised English; carried in copy.json as editable rows
try: prev=json.load(open(f'{scr}/site/data/hardcoded.json'))
except Exception: prev={}
by_norm_hc={v['norm']:k for k,v in prev.items()}
hc=dict(prev); nxt=max([int(k.split('.')[1]) for k in hc] or [0])+1
for sid,o in out.items():
    for h in o['hardcoded']:
        nk=norm(h['text'])
        if nk not in by_norm_hc:
            k=f'hc.{nxt:03d}'; nxt+=1; by_norm_hc[nk]=k; hc[k]={'en':h['text'],'norm':nk,'ko':None,'kind':h['kind'],'screens':[]}
        k=by_norm_hc[nk]
        if sid not in hc[k]['screens']: hc[k]['screens'].append(sid)
        if len(h['text'])>len(hc[k]['en']): hc[k]['en']=h['text']
        o['matches'].append({'k':k,'x':h['x'],'y':h['y'],'w':h['w'],'h':h['h'],'lines':h['lines'],'lh':h['lh'],'text':h['text'],'vals':h.get('vals') or {},'weak':False,'hc':True})
    del o['hardcoded']
seen={m['k'] for o in out.values() for m in o['matches'] if m.get('hc')}
hc={k:v for k,v in hc.items() if k in seen}
json.dump(hc,open(f'{scr}/site/data/hardcoded.json','w'),ensure_ascii=False,indent=1)
rows=[r for r in copy if r['ns']!='hardcoded']
for k,v in hc.items():
    rows.append({'k':k,'ns':'hardcoded','en':v['en'],'ko':v['ko'] or v['en'],'c':'body' if len(v['en'])>40 else 'label','canon':k,'dupes':[],'keep':False,'ph':[],'batch':0,'flag':None,'hc':True,'hc_kind':v['kind'],'screens':v['screens']})
json.dump(rows,open(f'{scr}/site/data/copy.json','w'),ensure_ascii=False,separators=(',',':'))
stats['hardcoded_items']=len(hc)
json.dump(out,open(f'{scr}/site/data/ocr.json','w'),ensure_ascii=False,separators=(',',':'))
print(stats)
for sid in sys.argv[2:]:
    print('##',sid,[m['text']+' -> '+m['k']+(' (weak)' if m['weak'] else '')+(' '+str(m['vals']) if m['vals'] else '') for m in out[sid]['matches']]); print('   unmatched:',[(u['text'],u['kind']) for u in out[sid]['unmatched'] if u['kind']!='data'])
