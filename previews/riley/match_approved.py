"""Find the editor transforms that produced the user's approved upload."""
from PIL import Image
# Pillow only; no extra image dependencies.
from pathlib import Path
root=Path(__file__).resolve().parents[2]
folder=root/'website/public/previews/riley/editor'
from collections import defaultdict, Counter
import json
target=Image.open(root/'uploads/riley-sword-arrangement.png').convert('RGBA')
colors=defaultdict(list)
for y in range(80):
    for x in range(80):
        p=target.getpixel((x,y))
        if p[3]>200: colors[p].append((x,y))
result={}
for name in ['gold','violet']:
    im=Image.open(folder/(name+'.png')).convert('RGBA')
    best=(0,None)
    for length in range(90,121):
      scaled=im.resize((im.width,round(im.height*length/100)),Image.Resampling.NEAREST)
      for angle in range(-90,91):
        patch=scaled.rotate(-angle,Image.Resampling.NEAREST,expand=True)
        votes=Counter()
        for y in range(patch.height):
          for x in range(patch.width):
            p=patch.getpixel((x,y))
            if p[3]<200: continue
            if name=='gold' and not(p[0]>130 and p[1]>75 and p[2]<130): continue
            if name=='violet' and not(p[2]>80 and p[2]>p[1]*1.3): continue
            for tx,ty in colors[p]: votes[(tx-x,ty-y)]+=1
        if votes:
          (x,y),score=votes.most_common(1)[0]
          if score>best[0]: best=(score,dict(x=x+patch.width/2,y=y+patch.height/2,angle=angle,length=length,layer='back',visible=True))
    print(name,best,flush=True); result[name]=best[1]
(root/'previews/riley/approved-placement.json').write_text(json.dumps(result,indent=2))
