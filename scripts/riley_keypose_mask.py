from PIL import Image, ImageDraw
from pathlib import Path
out=Path('previews/riley/keypose'); out.mkdir(parents=True,exist_ok=True)
im=Image.open('website/public/art/riley-approved-master.png').convert('RGBA')
mask=Image.new('RGB',im.size,'black'); d=ImageDraw.Draw(mask)
# Lower-body redraw only. Upper silhouette, grips and blade corridors stay frozen.
d.polygon([(49,65),(76,65),(81,78),(95,91),(96,108),(89,113),(38,113),(33,108),(38,92),(46,79)],fill='white')
mask.save(out/'mask.png')
