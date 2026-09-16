#!/usr/bin/env python3
"""Paint the dev-build "Sentry test" pill out of every capture (ocr/png -> ocr/png_clean), then refresh site/img JPEGs."""
import json,os,glob,re,subprocess
from PIL import Image,ImageDraw
from collections import Counter
SCR=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ocr=json.load(open(f'{SCR}/ocr/ocr.json')); os.makedirs(f'{SCR}/ocr/png_clean',exist_ok=True)
n=0
for png in glob.glob(f'{SCR}/ocr/png/*.png'):
    name=os.path.basename(png); im=Image.open(png).convert('RGB'); px=im.load(); d=ImageDraw.Draw(im)
    for l in ocr.get(name,{}).get('lines',[]):
        if 'sentry test' not in l['text'].lower(): continue
        # pill extends ~70px left (icon) and ~28px around; sample the dominant colour on a ring just outside it
        x0=max(0,l['x']-92); y0=max(0,l['y']-46); x1=min(im.width,l['x']+l['w']+46); y1=min(im.height,l['y']+l['h']+46)
        ring=[px[x,y] for x in range(x0-14,x1+14,3) for y in (y0-14,y1+14) if 0<=x<im.width and 0<=y<im.height]+[px[x,y] for y in range(y0-14,y1+14,3) for x in (x0-14,x1+14) if 0<=x<im.width and 0<=y<im.height]
        c=Counter((p[0]>>3,p[1]>>3,p[2]>>3) for p in ring).most_common(1)[0][0]; grp=[p for p in ring if (p[0]>>3,p[1]>>3,p[2]>>3)==c]
        bg=tuple(sum(p[i] for p in grp)//len(grp) for i in range(3))
        d.rounded_rectangle([x0,y0,x1,y1],radius=30,fill=bg); n+=1
    im.save(f'{SCR}/ocr/png_clean/{name}')
    subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','82',f'{SCR}/ocr/png_clean/{name}','--out',f'{SCR}/site/img/{name[:-4]}.jpg'],check=True,capture_output=True)
print('pills removed',n)
