"""Extract editable preview layers. Never modifies registered character assets."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'assets/characters/aa70a93d-daad-4ea9-935e-5d47bb0efa98/idle/rotations/east.png'
im = Image.open(source).convert('RGBA')
body = im.copy()
stack = [(33,6)]; seen = set(stack)
while stack:
    x,y = stack.pop(); body.putpixel((x,y),(0,0,0,0))
    for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        if 0 <= xx < im.width and 0 <= yy < im.height and (xx,yy) not in seen and im.getpixel((xx,yy))[3]:
            seen.add((xx,yy)); stack.append((xx,yy))
out = ROOT/'website/public/previews/riley/editor'; out.mkdir(parents=True,exist_ok=True)
body.save(out/'body.png')
for name,left,right in [('gold',25,37),('violet',37,48)]:
    im.crop((left,6,right,52)).save(out/f'{name}.png')
print(out)
