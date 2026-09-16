#!/usr/bin/env python3
"""Render Korean preview screens as images (same logic as the web tool) and contact sheets.
usage: compose.py [--edits review.json] [--sheets]
outputs: site/img-ko/<id>.jpg and, with --sheets, scratchpad/sheets/sheet-NN.jpg (EN | KO pairs, 3 per sheet)"""
import json,sys,os,re
from PIL import Image,ImageDraw,ImageFont
SCR=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
site=f'{SCR}/site'
copy={r['k']:r for r in json.load(open(f'{site}/data/copy.json'))}
ocr=json.load(open(f'{site}/data/ocr.json')); screens=json.load(open(f'{site}/data/screens.json'))['screens']
edits={}
if '--edits' in sys.argv:
    d=json.load(open(sys.argv[sys.argv.index('--edits')+1]))
    for e in d.get('edits',[]): edits[e['key']]=e['new_korean']
    for h in d.get('hardcoded',[]): edits[h['id']]=h['korean']
SAMPLE={'amount':'1,250.00','currency':'USD','name':'지민','count':'3','coin':'BTC','percent':'1.00','time':'30','days':'7','balance':'6,800.60','limit':'2,500','code':'AB12CD','value':'jimin@email.com','otpType':'SMS','spend':'BTC','receive':'USDT','from':'BTC','to':'USDT','min':'10','max':'5,000','type':'USDT','symbol':'BTC','timer':'10','suffix':'···4821','channelName':'GoPay','current':'2','total':'5','deviceName':'iPhone 15','transactionType':'P2P'}
FONT=f'{SCR}/NotoSansKR.ttf'
def font(px,bold=False):
    f=ImageFont.truetype(FONT,max(8,int(px)))
    try: f.set_variation_by_name('Medium' if not bold else 'Bold')
    except Exception: pass
    return f
def ko_text(k,vals):
    t=edits.get(k,copy[k]['ko'])
    def rep(m):
        n=m.group(1); v=vals.get(n)
        if v: return v.upper() if v.isalpha() and len(v)<=5 else v
        return SAMPLE.get(n,n)
    return re.sub(r'\{\{\s*(\w+)\s*\}\}',rep,t)
def sample_colors(im,m):
    x0=max(0,m['x']-6); y0=max(0,m['y']-4); x1=min(im.width,m['x']+m['w']+6); y1=min(im.height,m['y']+m['h']+4)
    px=im.load(); border=[]
    for x in range(x0,x1,4): border+= [px[x,y0],px[x,y1-1]]
    for y in range(y0,y1,4): border+= [px[x0,y],px[x1-1,y]]
    from collections import Counter
    q=Counter((p[0]>>3,p[1]>>3,p[2]>>3) for p in border); key=q.most_common(1)[0][0]
    grp=[p for p in border if (p[0]>>3,p[1]>>3,p[2]>>3)==key]
    bg=tuple(sum(p[c] for p in grp)//len(grp) for c in range(3)); best=0; fg=(20,20,20)
    for y in range(y0,y1,3):
        for x in range(x0,x1,3):
            p=px[x,y]; d=abs(p[0]-bg[0])+abs(p[1]-bg[1])+abs(p[2]-bg[2])
            if d>best: best=d; fg=p[:3]
    if best<60: fg=(20,20,20)
    return bg,fg
def render(s):
    src=f'{SCR}/ocr/png_clean/{s["id"]}.png'
    if not os.path.exists(src): src=f'{SCR}/ocr/png/{s["id"]}.png'
    im=Image.open(src).convert('RGB'); draw=ImageDraw.Draw(im); W=im.width
    for m in ocr.get(s['id'],{}).get('matches',[]):
        if m['k'] not in copy: continue
        bg,fg=sample_colors(im,m); txt=ko_text(m['k'],m.get('vals') or {})
        pad=6; draw.rectangle([m['x']-pad,m['y']-3,m['x']+m['w']+pad,m['y']+m['h']+3],fill=bg)
        fs=min(m['lh']*0.9, 2.1*m['w']/max(len(m.get('text') or 'xxxx'),4)) if m.get('lines',1)==1 else m['lh']*0.9
        f=font(fs); cx=m['x']+m['w']/2
        align='center' if abs(cx-W/2)<40 else ('right' if m['x']>W*0.55 else 'left')
        lines=[txt]
        if m.get('lines',1)>1:  # wrap to box width
            words=txt.split(' '); lines=[]; cur=''
            for w in words:
                t=(cur+' '+w).strip()
                if draw.textlength(t,font=f)<=m['w'] or not cur: cur=t
                else: lines.append(cur); cur=w
            lines.append(cur)
        y=m['y']+(m['h']-len(lines)*m['lh']*1.15)/2 if len(lines)==1 else m['y']
        for ln in lines:
            tw=draw.textlength(ln,font=f)
            x=m['x'] if align=='left' else (m['x']+m['w']-tw if align=='right' else cx-tw/2)
            draw.text((x,y),ln,font=f,fill=fg); y+=m['lh']*1.15
        over=draw.textlength(lines[0],font=f)/max(m['w'],1) if len(lines)==1 else 0
        if over>1: draw.line([m['x'],m['y']+m['h']+4,m['x']+m['w'],m['y']+m['h']+4],fill=(200,120,20) if over<=1.15 else (190,50,50),width=3)
        if m.get('weak') and '--clean' not in sys.argv: draw.rectangle([m['x']-pad,m['y']-3,m['x']+m['w']+pad,m['y']+m['h']+3],outline=(120,120,220),width=2)
    return im
os.makedirs(f'{site}/img-ko',exist_ok=True); rendered=[]
for s in screens:
    if not s.get('img') or not os.path.exists(f'{SCR}/ocr/png/{s["id"]}.png'): continue
    im=render(s); im.save(f'{site}/img-ko/{s["id"]}.jpg',quality=85); rendered.append((s,im))
print('rendered',len(rendered))
if '--sheets' in sys.argv:
    os.makedirs(f'{SCR}/sheets',exist_ok=True); per=3; sc=0.28
    for i in range(0,len(rendered),per):
        grp=rendered[i:i+per]; w=int(1080*sc); h=int(2400*sc); gap=16
        sheet=Image.new('RGB',(per*(2*w+gap)+gap*per,h+40),(245,245,245)); d=ImageDraw.Draw(sheet); lf=ImageFont.truetype(FONT,20)
        x=gap
        for s,ko in grp:
            src=f'{SCR}/ocr/png_clean/{s["id"]}.png'
            if not os.path.exists(src): src=f'{SCR}/ocr/png/{s["id"]}.png'
            en=Image.open(src).convert('RGB').resize((w,h)); k2=ko.resize((w,h))
            sheet.paste(en,(x,36)); sheet.paste(k2,(x+w+gap,36)); d.text((x,8),s['id'],font=lf,fill=(30,30,30)); x+=2*w+2*gap
        sheet.save(f'{SCR}/sheets/sheet-{i//per+1:02d}.jpg',quality=80)
    print('sheets',(len(rendered)+per-1)//per)
