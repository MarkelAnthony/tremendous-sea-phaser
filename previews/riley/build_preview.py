"""Manual pixel placement only. Does NOT overwrite any registered asset."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'assets/characters/aa70a93d-daad-4ea9-935e-5d47bb0efa98/idle/rotations/east.png'
original = Image.open(source).convert('RGBA')
body = original.copy()
# Remove only the detached sword component; preserve every character pixel.
todo = [(33, 6)]
visited = set(todo)
while todo:
    x, y = todo.pop()
    body.putpixel((x, y), (0, 0, 0, 0))
    for xx, yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        if 0 <= xx < 128 and 0 <= yy < 128 and (xx, yy) not in visited and original.getpixel((xx,yy))[3]:
            visited.add((xx,yy))
            todo.append((xx,yy))

# Copy exact palette/shading pixels from each original sword. Extend only
# the straight blade by four rows; no resampling or generative repainting.
def sword(left, right):
    src = original.crop((left, 6, right, 52))
    out = Image.new('RGBA', (right-left, 50))
    out.alpha_composite(src.crop((0,0,right-left,24)), (0,0))
    for y in range(24,28):
        out.alpha_composite(src.crop((0,23,right-left,24)), (0,y))
    out.alpha_composite(src.crop((0,24,right-left,46)), (0,28))
    return out

# Align blade centres 3 px apart (crop origins differ by one pixel).
# Gold is farther away; violet occludes half its blade. Tips y16, pommels y65.
preview = Image.new('RGBA', original.size)
preview.alpha_composite(sword(25,37), (33,16))
preview.alpha_composite(sword(37,48), (37,16))
preview.alpha_composite(body)
# All original body/outfit/held-weapon pixels must remain byte-identical.
assert all(preview.getpixel((x,y)) == body.getpixel((x,y)) for y in range(128) for x in range(128) if body.getpixel((x,y))[3])
preview.save(ROOT / 'previews/riley/parallel-depth-preview.png')
preview.resize((768,768), Image.Resampling.NEAREST).save(ROOT / 'previews/riley/parallel-depth-preview-large.png')
print('Preview only: body pixels unchanged; parallel tips y16, hilts end y65; gold behind violet with 3px blade-centre offset.')
