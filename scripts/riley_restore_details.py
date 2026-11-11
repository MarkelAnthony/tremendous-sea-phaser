"""Preview-only restoration from saved original pixels; runtime assets untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path('website/public/previews/riley/anatomy-study')
a=Image.open('website/public/previews/riley/ingame-placement/frame_000.png').convert('RGBA')
b=Image.open(root/'redesigned-v5.png').convert('RGBA')
# Keep v5's entire neck, collar, shoulder silhouette, elbows and wrists.
# Clear only the head above the neck; transplant Riley's actual profile, not a reinterpretation.
b.paste((0,0,0,0),(50,5,85,39))
head=a.crop((53,7,85,43))
b.alpha_composite(head, (51,3))
# Restore the original detailed lower robe and feet, using its native pixels.
# This region is below the upper-body structure and between the two weapons.
b.paste((0,0,0,0),(49,79,81,124))
b.alpha_composite(a.crop((49,79,81,124)),(49,79))
# Palette-match the redesigned upper robe to the original warm gold and blue-grey trim.
# Luminance bands retain its existing folds rather than painting a new shoulder.
for y in range(43,79):
 for x in range(39,88):
  r,g,bl,al=b.getpixel((x,y))
  if not al: continue
  if r>g*1.1 and g>bl*1.35 and r>105:
   lum=(r+g)/2
   c=(245,197,94) if lum>192 else (241,185,69) if lum>158 else (211,134,54) if lum>120 else (179,103,39)
   b.putpixel((x,y),(*c,al))
# Cuff embroidery inside existing sleeve pixels only; never change anatomy contours.
for x,y in [(43,69),(45,70),(47,71),(49,72),(75,60),(77,61),(79,62),(81,63)]:
 if b.getpixel((x,y))[3]: b.putpixel((x,y),(85,117,143,255))
# Bring back original hovering blue sword AND every original sparkle pixel.
b.alpha_composite(a.crop((10,6,49,59)),(10,6))
# Fourth sword: the saved gold blade and saved placement, not a new invented weapon.
gold=Image.open('website/public/previews/riley/fist-layers/gold.png').convert('RGBA')
colors={(0,0,0):(5,4,4),(2,5,2):(5,4,4),(226,161,0):(179,103,39),(250,198,9):(241,185,69),(255,248,171):(245,197,94),(65,21,22):(68,30,36),(105,43,31):(117,62,45),(137,73,40):(151,88,47)}
for y in range(gold.height):
 for x in range(gold.width):
  r,g,bl,al=gold.getpixel((x,y))
  if al and (r,g,bl) in colors:gold.putpixel((x,y),(*colors[(r,g,bl)],al))
for y in range(5,32):
 for x,c in [(4,(250,220,145)),(5,(241,185,69)),(6,(241,185,69)),(7,(179,103,39))]:
  if gold.getpixel((x,y))[3]:gold.putpixel((x,y),(*c,255))
b.alpha_composite(gold,(20,36)) # saved center (26,59), native 12x46
# Restrained matching magical glints around the restored gold blade.
d=ImageDraw.Draw(b)
for x,y in [(17,43),(35,58)]:
 d.line((x-2,y,x+2,y),fill='#f5c55e');d.line((x,y-2,x,y+2),fill='#f5c55e');d.point((x,y),fill='#fff2cf')
# Remove an isolated remnant of v5's old foot, outside the restored robe/feet.
b.paste((0,0,0,0),(81,119,83,123))
b.save(root/'restored-v6.png')
for name,im in [('original',a),('restored',b)]:im.crop((45,6,90,81)).save(root/f'{name}-v6-detail.png')
out=Image.new('RGBA',(1536,560),'#252e3e');draw=ImageDraw.Draw(out)
for i,(name,im) in enumerate([('Original details',a),('Retained neck / shoulder pose',Image.open(root/'redesigned-v5.png')),('Restored face, robe and four swords',b)]):
 out.alpha_composite(im.resize((512,512),Image.Resampling.NEAREST),(i*512,32));draw.text((i*512+8,8),name,fill='white')
out.save('previews/riley/restored-v6-comparison.png')
print('Saved v6 preview; original face, skirt and blue sword restored from exact source pixels.')
