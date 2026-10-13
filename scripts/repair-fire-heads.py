"""Manual, bounded pixel repair. Original files remain untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
root=Path('website/public/previews/branch-combat')
out=Path('website/public/previews/fire-repair');out.mkdir(parents=True,exist_ok=True)
source=Image.open(root/'fire-original-4.png').convert('RGBA')
# Right-facing head from the existing release, before its shoulder/arm rows.
head=source.crop((80,49,94,58))
report=[]
for n in range(6):
 original=Image.open(root/f'fire-original-{n}.png').convert('RGBA');fixed=original.copy()
 if n in (2,3):
  box=(64,45,81,58) if n==2 else (58,47,74,59)
  fixed.paste((0,0,0,0),box)
  anchor=(65,47) if n==2 else (60,49)
  fixed.alpha_composite(head,anchor)
  # Solid neck bridge; reuse only skin pixels from the original neck.
  skin=original.getpixel((70,57) if n==2 else (64,58))
  shade=original.getpixel((66,56) if n==2 else (61,56))
  for y in range(anchor[1]+8,box[3]):
   for x in range(anchor[0]+3,anchor[0]+10):
    fixed.putpixel((x,y),shade if x==anchor[0]+3 else skin)
  changed=[(x,y) for y in range(144) for x in range(144) if fixed.getpixel((x,y))!=original.getpixel((x,y))]
  assert all(box[0]<=x<box[2] and box[1]<=y<box[3] for x,y in changed), changed
  report.append({'frame':n,'changedPixels':len(changed),'bounds':box,'bodyPixelsUnchanged':True})
 fixed.save(out/f'fire-{n}.png')
json.dump(report,open(out/'verification.json','w'),indent=2)
c=Image.new('RGB',(960,540),'#283649');d=ImageDraw.Draw(c)
for j,n in enumerate([1,2,3,4]):
 for row,p in enumerate([root/f'fire-original-{n}.png',out/f'fire-{n}.png']):
  im=Image.open(p).crop((48,38,122,110));im=im.resize((222,216),Image.Resampling.NEAREST);c.paste(im,(j*240,row*270+35),im);d.text((j*240+8,row*270+8),f'{"Original" if row==0 else "Repair"} {n}',fill='white')
c.save('previews/fire-reference/manual-comparison.png')
print(report)
