from PIL import Image, ImageDraw
from pathlib import Path
root = Path('website/public/previews/branch-combat')
canvas = Image.new('RGB', (1536, 400), '#283649')
draw = ImageDraw.Draw(canvas)
for i in range(6):
    im = Image.open(root / f'fire-original-{i}.png').convert('RGBA')
    print(i, im.size, im.getbbox())
    im = im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST)
    canvas.paste(im, (i * 256, 40), im)
    draw.text((i * 256 + 10, 10), f'Original frame {i}', fill='white')
canvas.save('previews/branch-combat/fire-inspection.png')
