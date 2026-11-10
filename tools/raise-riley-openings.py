"""Localized preview-only pixel repair; preserve alpha and every unrelated pixel."""
from PIL import Image
from pathlib import Path
p=Path('website/public/previews/riley/editor/briefs.png')
im=Image.open(p).convert('RGBA'); before=im.copy()
skin=(132,67,32,255); shadow=(95,34,21,255); deep=(65,16,19,255)
# Top of bare thigh per column. The sloping opening is 2 px higher;
# the low purple/gold short-leg remnants are removed all the way to skin.
edge={63:70,64:70,65:71,66:72,67:73,68:74,69:74,70:73,71:72,72:71,73:70,74:70,75:71}
for x in range(55,76):
 top=edge.get(x,78 if x<59 else 79)
 for y in range(top,88):
  r,g,b,a=before.getpixel((x,y))
  purple=a and b>g*1.2 and r>b*1.05
  gold=a and r>140 and g>75 and b<75
  if purple or gold:
   # Keep depth shading at the inner edge, never use plum for skin shadows.
   color=shadow if x in (55,56,65,66,68,75) else skin
   if purple and max(r,g,b)<60: color=deep
   im.putpixel((x,y),color)
# Keep a crisp gold seam only on the newly raised opening, not on the thigh.
for x,y in edge.items():
 r,g,b,a=before.getpixel((x,y-1))
 if a and b>g*1.2 and r>b*1.05 and r>60: im.putpixel((x,y-1),(204,137,6,255))
changes=[(x,y) for y in range(128) for x in range(128) if im.getpixel((x,y))!=before.getpixel((x,y))]
assert changes and all(55<=x<=75 and 69<=y<=87 for x,y in changes)
assert im.getchannel('A').tobytes()==before.getchannel('A').tobytes()
im.save(p)
print('Changed',len(changes),'pixels, confined to openings and fabric remnants; alpha unchanged.')
