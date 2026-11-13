"""Local preview-only pixel repair: green blade travels forward, not into blue."""
from pathlib import Path
import json
from PIL import Image, ImageFilter

root = Path('website/public')
meta_path = root / 'art/riley-entropy-preview.json'
meta = json.loads(meta_path.read_text())
source = Path('assets/images/1aac7240-670d-5525-b4f0-c3fbf69ac61b/frames')
out = root / 'art/riley-entropy-forward'
out.mkdir(exist_ok=True)
images = [Image.open(source / f'{i}.png').convert('RGBA') for i in range(33)]
# Keep the complete original blue sword, including its dark outline.
blue = images[3].crop((30, 0, 44, 65))
# Isolate the upright green sword by colour, plus its one-pixel outline.
green_source = images[4]
mask = Image.new('L', (128, 128))
for y in range(39, 90):
    for x in range(30, 44):
        r, g, b, a = green_source.getpixel((x, y))
        if a and g > r * 1.18 and g > b * 1.12 and g > 65:
            mask.putpixel((x, y), 255)
mask = mask.filter(ImageFilter.MaxFilter(3))
blade = Image.new('RGBA', (128, 128))
blade.paste(green_source, (0, 0), mask)
blade = blade.crop((30, 39, 44, 90))
# Front lower sword destination matches the existing golden idle arrangement.
positions = [(54, 39), (70, 38), (86, 37), (101, 37), (107, 37), (107, 37), (107, 37)]
for i in range(4, 11):
    im = images[i].copy()
    # This lane is entirely outside Riley; restore the blue sword, not her body.
    im.paste((0, 0, 0, 0), (30, 0, 44, 91))
    im.alpha_composite(blue, (30, 0))
    moving = blade.copy()
    amount = max(0, min(1, (i - 5) / 5))
    for y in range(moving.height):
        for x in range(moving.width):
            r, g, b, a = moving.getpixel((x, y))
            if a and g > r * 1.18 and g > b * 1.12 and g > 65:
                # Preserve the blade's original light/shadow texture as it turns gold.
                v = max(r, g, b) / 255
                gold = (int(150 + 105*v), int(94 + 130*v), int(24 + 116*v))
                moving.putpixel((x, y), tuple(round(c*(1-amount)+d*amount) for c,d in zip((r,g,b),gold))+(a,))
    im.alpha_composite(moving, positions[i-4])
    images[i] = im
for i, im in enumerate(images):
    im.save(out / f'{i}.png')
meta['activation'] = [f'./art/riley-entropy-forward/{i}.png' for i in range(33)]
meta['assessment'] = 'Review-only correction · green sword moves forward across Riley and turns gold in the lower front slot; blue sword remains separate · original scale and idle unchanged.'
meta_path.write_text(json.dumps(meta, indent=2)+'\n')
# Contact sheet for visual review; never rescale the actual playback frames.
sheet=Image.new('RGBA',(7*384,408),'#293348')
from PIL import ImageDraw
d=ImageDraw.Draw(sheet)
for j,i in enumerate(range(4,11)):
    sheet.alpha_composite(images[i].resize((384,384),Image.Resampling.NEAREST),(j*384,0))
    d.text((j*384,388),str(i),fill='white')
sheet.convert('RGB').save('screenshots/entropy-forward-check.png')
