from PIL import Image, ImageDraw
from pathlib import Path
root=Path('website/public/previews/riley/anatomy-study')
im=Image.open('assets/images/4ab38d57-20c6-5b87-8713-f9a4e026b0b8/image.png').convert('RGBA')
d=ImageDraw.Draw(im)
# Remove the old backward-projecting upper sleeve, not just its shading.
d.polygon([(54,44),(62,44),(65,49),(64,59),(57,63),(47,60),(48,56),(51,52),(53,48)],fill=(0,0,0,0))
ink='#302631'; dark='#855124'; mid='#bb7c23'; gold='#dda634'; light='#f3c755'; skin='#74422e'; shade='#422b29'; warm='#9c6040'
# Neck: jaw supported by a short exposed neck, then collar.
d.polygon([(66,38),(70,38),(70,43),(74,45),(70,48),(64,45),(64,43),(66,42)],fill=ink)
d.polygon([(67,39),(69,39),(69,43),(71,45),(68,46),(65,44),(67,42)],fill=skin)
d.line([(68,39),(68,43),(70,44)],fill=warm,width=1)
# Shoulder socket is now over the ribcage. Upper arm hangs from it before
# bending back at the elbow toward the existing green-sword wrist.
d.polygon([(65,45),(69,44),(73,46),(75,49),(74,54),(70,58),(64,62),(57,67),(52,66),(49,62),(54,58),(60,55),(62,51),(62,48)],fill=ink)
d.polygon([(66,46),(70,46),(73,48),(73,52),(69,56),(63,60),(56,65),(53,64),(51,62),(56,59),(62,56),(64,52),(64,49)],fill=mid)
d.polygon([(66,46),(70,46),(73,48),(72,51),(69,53),(66,54),(65,51),(65,48)],fill=gold)
d.line([(67,47),(70,47),(72,49)],fill=light,width=1)
d.polygon([(65,54),(69,54),(68,57),(62,61),(56,65),(54,64),(59,60),(63,57)],fill=gold)
d.line([(73,51),(70,55),(66,58)],fill=dark,width=1)
# Blend the collar into the shoulder instead of ending it in a hard vertical seam.
d.line([(69,44),(71,45),(73,47)],fill=dark,width=1)
d.point((70,44),fill=skin)
d.point((71,46),fill=gold)
# Cuff reuses the outfit's blue/silver visual language.
d.polygon([(51,61),(55,64),(57,66),(54,69),(50,67),(48,64)],fill=ink)
d.polygon([(51,62),(55,65),(55,67),(53,68),(49,64)],fill='#9ab5c2')
d.line([(50,63),(54,66)],fill='#d0d7d2',width=1)
d.line([(52,62),(56,65),(55,67)],fill='#5c7f91',width=1)
im.save(root/'rebuilt-shoulder-v4.png')
orig=Image.open('website/public/previews/riley/ingame-placement/frame_000.png').convert('RGBA')
for name,img in [('original',orig),('rebuilt',im)]:
 img.crop((42,30,85,76)).save(root/f'{name}-anatomy-v4-detail.png')
out=Image.new('RGBA',(1024,540),(36,44,59));dd=ImageDraw.Draw(out)
for i,img in enumerate([orig,im]):
 out.alpha_composite(img.resize((512,512),Image.Resampling.NEAREST),(i*512,28));dd.text((i*512+10,8),['Original','Rebuilt shoulder and neck'][i],fill='white')
out.convert('RGB').save('tmp/riley-rebuilt-comparison.png')
