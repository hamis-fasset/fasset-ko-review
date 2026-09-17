#!/usr/bin/env python3
"""Build English|Korean pair images from the real-tool renders in qa/ko. usage: pairs.py [id ...]"""
import json,os,sys
from PIL import Image,ImageDraw,ImageFont
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); site=f'{R}/site'; out=f'{R}/qa/pairs'; os.makedirs(out,exist_ok=True)
app=json.load(open(f'{site}/data/screens.json'))['screens']; fig=json.load(open(f'{site}/data/figma/screens.json'))['screens']
font=ImageFont.truetype(f'{R}/NotoSansKR.ttf',22)
want=set(sys.argv[1:])
def pair(sid,en_path,name):
    ko_path=f'{R}/qa/ko/{sid.replace(":","-")}.png'
    if not os.path.exists(ko_path) or not os.path.exists(en_path): return False
    en=Image.open(en_path).convert('RGB'); ko=Image.open(ko_path).convert('RGB')
    if ko.size!=en.size: ko=ko.resize(en.size)
    W,H=en.size; s=1200/H; w,h=int(W*s),1200; gap=24
    im=Image.new('RGB',(2*w+gap,h+44),(236,236,236)); d=ImageDraw.Draw(im)
    im.paste(en.resize((w,h)),(0,44)); im.paste(ko.resize((w,h)),(w+gap,44))
    d.text((8,10),f'{sid}  ·  {name}'[:110],font=font,fill=(30,30,30)); d.text((w+gap+8,10),'KOREAN (tool render)',font=font,fill=(120,30,30))
    im.save(f'{out}/{sid.replace(":","-")}.jpg',quality=88); return True
n=0
for s in app:
    if want and s['id'] not in want: continue
    n+=pair(s['id'],f'{site}/{s["img"]}',s['name'])  # the jpg the tool itself shows
for s in fig:
    if want and s['id'] not in want: continue
    n+=pair(s['id'],f'{site}/{s["img"]}',s['name'])
print('pairs',n)
