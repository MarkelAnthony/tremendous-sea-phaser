"""Preview only. Controlled pixel deformation of the approved master, no generation."""
from PIL import Image, ImageDraw
import math, os, json
source='website/public/art/riley-approved-master.png'
im=Image.open(source).convert('RGBA')
w,h=im.size
out='website/public/previews/riley/fighting-idle'
os.makedirs(out,exist_ok=True)
# Separate the magical swords from the body; boundaries remain transparent.
floatmask=Image.new('L',im.size); d=ImageDraw.Draw(floatmask)
d.polygon([(0,0),(48,0),(48,35),(43,57),(33,62),(29,84),(0,84)],fill=255)
floating=Image.new('RGBA',im.size); floating.paste(im,(0,0),floatmask)
body=im.copy(); body.paste((0,0,0,0),(0,0),floatmask)
frames=[]
for i in range(16):
    t=i/16*math.tau
    bend=(1-math.cos(t))/2
    # Feet anchored at their original rows. Hips sink and concealed knees widen.
    frame=Image.new('RGBA',im.size)
    for y in range(h):
        for x in range(w):
            if y < 73: dy=round(3*bend); dx=0
            else:
                dy=round(3*bend*max(0,(118-y)/45))
                knee=math.exp(-((y-99)/12)**2)
                dx=round((1 if x>68 else -1)*1.5*bend*knee)
            # Inverse nearest-neighbour mapping keeps a crisp pixel grid.
            sx=x-dx; sy=y-dy
            if 0<=sx<w and 0<=sy<h: frame.putpixel((x,y),body.getpixel((sx,sy)))
    # The floating pair hover independently; held blades remain attached to hands.
    frame.alpha_composite(floating,(0,round(math.sin(t)*1)))
    spark=ImageDraw.Draw(frame)
    # Two short glints at a time, following the four original blade locations.
    sites=[(36,21,(179,244,255)),(20,44,(255,239,166)),(27,84,(193,255,192)),(108,85,(255,203,242))]
    for k,(x,y,c) in enumerate(sites):
        phase=(i+k*4)%16
        if phase<5:
            yy=y+(round(math.sin(t)) if k<2 else round(3*bend))
            r=2 if phase in (1,2) else 1
            spark.line((x-r,yy,x+r,yy),fill=(*c,255))
            spark.line((x,yy-r,x,yy+r),fill=(*c,255))
            spark.point((x,yy),fill=(255,255,255,255))
    frame.save(f'{out}/frame_{i:02}.png');frames.append(frame)
frames[0].save(f'{out}/preview.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2)
json.dump({'source':source,'frames':16,'frameMs':100,'method':'controlled pixel deformation; planted feet, concealed-knee flex, floating sword hover and blade glints','liveRileyChanged':False,'generationCalls':0},open(f'{out}/preview.json','w'),indent=2)
print(im.size, out)
