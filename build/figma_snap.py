#!/usr/bin/env python3
"""Snap Figma text boxes to the English ink in the exported frame and compute per-box paint regions.
Starts from the raw boxes (figma_merge/figma_apply_ko output, backed up as qa/figma-boxes.pre-paint.json) so it is idempotent.
- drops zero-width-space nodes; protects boxes with no ink (visualSafe:false)
- vertical: centres the layout box on the ink line nearest it (fixes drifted y)
- horizontal: paint covers the text's own ink clusters only (icons excluded), never another box's span, and the
  layout box widens by at most 0.6*fs
- paint inside a pill/button whose padding is thinner than the paint margin is tightened to the ink
usage: figma_snap.py  (reads qa/figma-boxes.pre-paint.json, writes site/data/figma/boxes.json)"""
import json,os
from PIL import Image
from collections import Counter
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=f'{R}/qa/figma-boxes.pre-paint.json'; OUT=f'{R}/site/data/figma/boxes.json'
PROTECT_FRAMES={'455:21789','97:49151'}   # layer positions drifted from the pictures; keep their strings text-only
PROTECT_TEXT={('62:96822','From Messages')}
boxes=json.load(open(SRC))
def bgcol(px,x0,y0,x1,y1):
    ring=[]
    for x in range(x0,x1,2): ring+=[px[x,y0],px[x,y1-1]]
    for y in range(y0,y1,2): ring+=[px[x0,y],px[x1-1,y]]
    c=Counter((p[0]>>3,p[1]>>3,p[2]>>3) for p in ring).most_common(1)[0][0]; g=[p for p in ring if (p[0]>>3,p[1]>>3,p[2]>>3)==c]
    return tuple(sum(p[i] for p in g)//len(g) for i in range(3))
def d(a,b): return abs(a[0]-b[0])+abs(a[1]-b[1])+abs(a[2]-b[2])
def textlike(px,c,bx0,bx1,bg):
    y=(c[0]+c[1])//2; xs=range(bx0,bx1,2); n=sum(1 for x in xs if d(px[x,y],bg)>90)
    return n < 0.9*max(1,len(list(xs)))
stats=Counter(); shifted=[]
for fid,o in boxes.items():
    p=f'{R}/site/img-figma/{fid.replace(":","-")}.jpg'
    if not os.path.exists(p): continue
    im=Image.open(p).convert('RGB'); px=im.load(); W,H=im.size
    keep=[m for m in o['matches'] if m['text'].strip('​ \n')!='']
    stats['dropped-zwsp']+=len(o['matches'])-len(keep)
    # frame-wide drift: if most single-line boxes find their text line at the same vertical offset, shift the whole frame first
    if fid not in PROTECT_FRAMES:
        dys=[]
        for m in keep:
            if m.get('lines',1)!=1: continue
            fs=m.get('fs',14); bx0,bx1=max(0,int(m['x'])),min(W,int(m['x']+m['w']))
            if bx1-bx0<6: continue
            ring=(bx0+3,max(0,int(m['y'])+3),bx1-3,min(H,int(m['y']+m['h'])-3)) if m['h']>8 else (bx0,int(m['y']),bx1,int(m['y']+m['h']))
            try: bgc=bgcol(px,*ring)
            except Exception: continue
            sy0,sy1=max(0,int(m['y']-3*fs)),min(H,int(m['y']+m['h']+3*fs))
            rows=[y for y in range(sy0,sy1) if any(d(px[x,y],bgc)>90 for x in range(bx0,bx1,2))]
            if not rows: continue
            cl=[[rows[0],rows[0]]]
            for y in rows[1:]:
                if y-cl[-1][1]>3: cl.append([y,y])
                else: cl[-1][1]=y
            cand=[c for c in cl if 0.5*fs<=c[1]-c[0]+1<=1.4*fs and textlike(px,c,bx0,bx1,bgc)]
            if not cand: continue
            cy=m['y']+m['h']/2; c=min(cand,key=lambda c:abs((c[0]+c[1])/2-cy)); dys.append((c[0]+c[1])/2-cy)
        if len(dys)>=3:
            dys.sort(); med=dys[len(dys)//2]
            if abs(med)>6 and sum(1 for v in dys if abs(v-med)<=4)>=max(3,0.6*len(dys)):
                for m in keep: m['y']=m['y']+med
                stats['frame-shifted']+=1; shifted.append((fid,round(med,1),len(dys)))
    for m in keep:
        if fid in PROTECT_FRAMES or any(fid==f and m['text'].startswith(t) for f,t in PROTECT_TEXT): m['visualSafe']=False; stats['protected']+=1; continue
        fs=m.get('fs',14); lines=m.get('lines',1)
        mcx=m['x']+m['w']/2
        # spans of other boxes on the same row band, except a box that contains this one (a row-wide node around a pill)
        others=[(int(k['x'])-2,int(k['x']+k['w'])+2) for k in keep if k is not m and not (k['y']+k['h']<m['y'] or k['y']>m['y']+m['h']) and not (k['x']<=mcx<=k['x']+k['w'] and k['w']>m['w'])]
        allowed=lambda x: not any(a<=x<=b for a,b in others)
        bx0,by0,bx1,by1=max(0,int(m['x'])-2),max(0,int(m['y'])-2),min(W,int(m['x']+m['w'])+2),min(H,int(m['y']+m['h'])+2)
        if bx1-bx0<3 or by1-by0<3: continue
        # background from a ring just inside the text box, so a chip or pill fill (not the screen behind it) is the background
        ix0,iy0,ix1,iy1=(bx0+3,by0+3,bx1-3,by1-3) if (bx1-bx0>10 and by1-by0>8) else (bx0,by0,bx1,by1)
        bg=bgcol(px,ix0,iy0,ix1,iy1); ink=lambda x,y: d(px[x,y],bg)>90
        sy0,sy1=max(0,int(m['y']-1.2*fs)),min(H,int(m['y']+m['h']+1.2*fs))
        rows=[y for y in range(sy0,sy1) if any(ink(x,y) for x in range(bx0,bx1,2))]
        if not rows: m['visualSafe']=False; stats['no-ink']+=1; continue
        cl=[[rows[0],rows[0]]]
        for y in rows[1:]:
            if y-cl[-1][1]>3: cl.append([y,y])
            else: cl[-1][1]=y
        if lines==1:
            cy=m['y']+m['h']/2; cand=[c for c in cl if 0.35*fs<=c[1]-c[0]+1<=1.6*fs and textlike(px,c,bx0,bx1,bg)]
            if not cand:   # no text-sized ink line nearby (a filled chip read as ink): paint only the ink inside the box itself
                icols=[x for x in range(bx0,bx1) if any(ink(x,y) for y in range(by0,by1)) and not all(ink(x,y) for y in range(by0,by1))]
                irows=[y for y in range(by0,by1) if any(ink(x,y) for x in range(bx0,bx1))]
                if icols and irows and irows[-1]-irows[0]<=1.6*fs: m['paint']={'x':icols[0]-2,'y':irows[0]-2,'w':icols[-1]-icols[0]+5,'h':irows[-1]-irows[0]+5}
                else: m['paint']={'x':int(m['x'])-1,'y':int(m['y'])-1,'w':int(m['w'])+2,'h':int(m['h'])+2}
                stats['kept-box']+=1; continue
            c=min(cand,key=lambda c:abs((c[0]+c[1])/2-cy)); ny0,ny1=c[0],c[1]+1
            lim=int(0.6*fs); sx0,sx1=max(0,int(m['x'])-lim),min(W,int(m['x']+m['w'])+lim)
            # a text column has ink in some rows of the line; a column outside a chip/pill is "ink" in every row (the screen
            # behind differs from the fill), so columns that are ink across the whole padded band are not text
            ey0,ey1=max(0,ny0-3),min(H,ny1+3)
            textcol=lambda x: any(ink(x,y) for y in range(ny0,ny1)) and not all(ink(x,y) for y in range(ey0,ey1))
            cols=[x for x in range(sx0,sx1) if allowed(x) and textcol(x)]
            if not cols: cols=[x for x in range(bx0,bx1) if any(ink(x,y) for y in range(ny0,ny1))]   # nested boxes: fall back to our own span
            if not cols: m['visualSafe']=False; stats['no-ink']+=1; continue
            cc=[[cols[0],cols[0]]]
            for x in cols[1:]:
                if x-cc[-1][1]>max(6,0.6*fs): cc.append([x,x])
                else: cc[-1][1]=x
            wid=[c2[1]-c2[0]+1 for c2 in cc]; main=max(range(len(cc)),key=lambda i:wid[i])
            sel=[i for i in range(len(cc)) if wid[i]>1.4*fs or i==main]; lo,hi=min(sel),max(sel)
            nx0,nx1=cc[lo][0],cc[hi][1]+1
            if abs((ny0+ny1)/2-cy)>1.5: stats['y-snapped']+=1
            m['y']=round((ny0+ny1)/2-m['h']/2,1)
            if nx0<m['x']-1 or nx1>m['x']+m['w']+1: stats['x-widened']+=1; nx=min(m['x'],nx0-1); m['w']=max(m['x']+m['w'],nx1+1)-nx; m['x']=nx
            P={'x':nx0-2,'y':ny0-2,'w':nx1-nx0+4,'h':ny1-ny0+4}
            # thin pill / button: tighten so the reconstruction boundary stays on the pill
            cyy=min(H-1,int((ny0+ny1)/2)); g=lambda x: px[min(max(0,x),W-1),cyy]
            # inside a chip or pill whose padding is thinner than our margin: paint exactly the ink, so the boundary stays on the fill
            if d(g(nx0-2),g(nx0-9))>60 or d(g(nx1+1),g(nx1+8))>60: P={'x':nx0,'y':ny0-1,'w':nx1-nx0,'h':ny1-ny0+2}; stats['pill-tight']+=1
            m['paint']=P
            if abs((nx0+nx1)/2-W/2)<4 and m.get('align')!='center': m['align']='center'; stats['centred']+=1
        else:
            ny0,ny1=cl[0][0],cl[-1][1]+1
            cols=[x for x in range(bx0,bx1) if allowed(x) and any(ink(x,y) for y in range(ny0,ny1,2))]
            if cols: m['paint']={'x':cols[0]-2,'y':ny0-2,'w':cols[-1]-cols[0]+5,'h':ny1-ny0+4}
    o['matches']=keep
json.dump(boxes,open(OUT,'w'),ensure_ascii=False); print(dict(stats)); print('shifted frames:',shifted)
