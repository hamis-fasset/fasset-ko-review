#!/usr/bin/env python3
"""Infer align/weight for app boxes on the given screens (or all screens lacking 'align'). usage: infer_align.py [screen ...]"""
import json,os,sys
from PIL import Image
from collections import Counter
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); ocr=json.load(open(f'{R}/site/data/ocr.json')); INF=10**6
def bg_of(px,W,H,m):
    x0=max(0,m['x']-6); y0=max(0,m['y']-4); x1=min(W,m['x']+m['w']+6); y1=min(H,m['y']+m['h']+4); ring=[]
    for x in range(x0,x1,3): ring+=[px[x,y0],px[x,y1-1]]
    for y in range(y0,y1,3): ring+=[px[x0,y],px[x1-1,y]]
    c=Counter((p[0]>>3,p[1]>>3,p[2]>>3) for p in ring).most_common(1)[0][0]; g=[p for p in ring if (p[0]>>3,p[1]>>3,p[2]>>3)==c]
    return tuple(sum(p[i] for p in g)//len(g) for i in range(3))
def diff(p,bg): return abs(p[0]-bg[0])+abs(p[1]-bg[1])+abs(p[2]-bg[2])
def dist_to_change(px,W,bg,y0,y1,x,step):
    d=0; ys=list(range(y0,y1,max(1,(y1-y0)//6)))
    while 0<=x<W:
        if any(diff(px[x,y],bg)>60 for y in ys): return d
        x+=step; d+=1
    return INF
def icon_above(px,W,H,bg,m):
    xs=range(max(0,m['x']-40),min(W,m['x']+m['w']+40)); ys=range(max(0,m['y']-70),max(0,m['y']-6))
    cols=[x for x in xs if any(diff(px[x,y],bg)>60 for y in ys)]
    if not cols or cols[-1]-cols[0]>m['w']+60: return None
    return (cols[0]+cols[-1])/2
def infer(px,W,H,m):
    bg=bg_of(px,W,H,m); cx=m['x']+m['w']/2
    if m.get('lines',1)>1:
        if m['w']>=0.8*W or abs(cx-W/2)>=25: return 'left'
        lh=m['lh']; yb0=int(m['y']+m['h']-lh); yb1=int(m['y']+m['h'])
        cols=[x for x in range(m['x'],min(W,m['x']+m['w'])) if any(diff(px[x,y],bg)>150 for y in range(max(0,yb0),min(H,yb1)))]
        if cols and abs((cols[0]+cols[-1])/2-cx)<0.05*W and abs(cols[0]-m['x'])>=0.05*W: return 'center'
        return 'left'
    if abs(cx-W/2)<40:
        # a long line that starts at the content margin is a paragraph line, not a centred title,
        # unless it also ends symmetrically at the right margin
        if m['w']>=0.6*W and m['x']<=0.07*W and abs(m['x']-(W-m['x']-m['w']))>12: return 'left'
        return 'center'
    ia=icon_above(px,W,H,bg,m)
    if ia is not None and abs(ia-cx)<8 and m['w']<300: return 'center'
    y0=m['y']+max(1,m['h']//4); y1=m['y']+m['h']-max(1,m['h']//4)
    dl=dist_to_change(px,W,bg,y0,y1,m['x']-4,-1); dr=dist_to_change(px,W,bg,y0,y1,m['x']+m['w']+4,1)
    if dl<INF and dr<INF and dl>6 and dr>6 and abs(dl-dr)<=max(10,0.08*(dl+dr)) and dl+dr<1.2*m['w']+40: return 'center'
    if m['x']>W*0.55 or (m['x']>W/2 and dr<24): return 'right'
    return 'left'
want=set(sys.argv[1:]); n=0
for sid,o in ocr.items():
    if want and sid not in want: continue
    if not want and all('align' in m for m in o['matches']): continue
    src=f'{R}/ocr/png_clean/{sid}.png'; src=src if os.path.exists(src) else f'{R}/ocr/png/{sid}.png'
    if not os.path.exists(src): continue
    im=Image.open(src).convert('RGB'); px=im.load(); W,H=im.size
    fss=[]
    hs=sorted(m['h'] for m in o['matches'] if m.get('lines',1)==1) or [30]; medh=hs[len(hs)//2]
    for m in o['matches']:
        t=m.get('ocrLine') or m.get('text') or 'xxxx'
        if m.get('lines',1)==1 and len(t)>30 and m['h']>1.6*medh: m['lines']=2; m['lh']=m['h']/2
        m['align']=infer(px,W,H,m); n+=1
        if m.get('lines',1)==1:
            hasD=any(c in 'gjpqy,;()[]{}Q@$' for c in t); hasA=any(c in 'bdfhklt0123456789!?/\\|"\'ABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in t)
            k=0.96 if hasD and hasA else 0.73 if hasA else 0.75 if hasD else 0.53
            m['fs']=round(max(10,0.92*m['h']/k),1); fss.append(m)
        else: m['fs']=round(m['lh']*0.82,1)
    # snap near-equal sizes on one screen to a shared value (row labels with and without descenders)
    fss.sort(key=lambda m:m['fs']); i=0
    while i<len(fss):
        j=i
        while j+1<len(fss) and fss[j+1]["fs"]<=fss[i]["fs"]*1.2: j+=1
        grp=fss[i:j+1]; med=sorted(x['fs'] for x in grp)[len(grp)//2]
        for x in grp: x['fs']=med
        i=j+1
    # boxes sharing a left edge (a list, a column of labels) share a size too
    from collections import defaultdict
    cols=defaultdict(list)
    for m in o['matches']:
        if m.get('lines',1)==1: cols[m['x']//8].append(m)
    for grp in cols.values():
        if len(grp)>=3:
            med=sorted(x['fs'] for x in grp)[len(grp)//2]
            for x in grp:
                if med/1.4<=x['fs']<=med*1.4: x['fs']=med
    allfs=sorted(m['fs'] for m in o['matches']) or [40]; medfs=allfs[len(allfs)//2]
    for m in o['matches']: m['weight']=600 if (m.get('lines',1)==1 and m['fs']>=1.25*medfs) else 400
json.dump(ocr,open(f'{R}/site/data/ocr.json','w'),ensure_ascii=False); print('inferred',n)
