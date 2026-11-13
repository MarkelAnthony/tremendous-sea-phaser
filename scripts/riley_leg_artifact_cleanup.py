"""Local transparent-pixel cleanup; never redraw Riley or modify synced assets."""
import colorsys
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest_path = root / 'website/public/art/riley-four-sword-attack-cleaned.json'
manifest = json.loads(manifest_path.read_text())
out = root / 'website/public/art/riley-four-sword-leg-cleanup'
out.mkdir(parents=True, exist_ok=True)
changes = {}
for index, src in enumerate(manifest['frames']):
    relative = src.removeprefix('./')
    source = root / relative if relative.startswith('assets/') else root / 'website/public' / relative
    image = Image.open(source).convert('RGBA')
    count = 0
    # Only desaturated, cold gray residue in the lower leg region. Warm skin,
    # saturated navy lining, robe gold and colored weapon effects are excluded.
    for y in range(145, image.height):
        for x in range(48, 151):
            r, g, b, a = image.getpixel((x, y))
            _, saturation, value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if a and saturation < .36 and .12 < value < .78 and b >= r and g >= r * .95:
                image.putpixel((x, y), (0, 0, 0, 0))
                count += 1
    if count:
        image.save(out / f'{index + 1}.png')
        manifest['frames'][index] = f'./art/riley-four-sword-leg-cleanup/{index + 1}.png'
        changes[str(index + 1)] = count
manifest['legCleanupPixels'] = changes
manifest['cleanedFrames'] = sorted(set(manifest['cleanedFrames']) | {int(n) for n in changes})
manifest['assessment'] = 'Approved attack motion with a second local cleanup of cold gray residue around the legs. All 33 poses and the original 10 fps timing are preserved. Use Show original to compare.'
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print('Removed gray leg residue (pixels by displayed frame):', changes)
