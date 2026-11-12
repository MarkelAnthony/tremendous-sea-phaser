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
# Piecewise-affine joint mesh: upper body follows the hips, knees travel
# outward, shins pivot back toward fixed ankles. Unlike a row translation,
# each triangle changes angle and the lower-body silhouette articulates.
xs=[0,18,30,42,56,68,82,94,108,127]
ys=[0,60,73,84,94,103,110,118,127]
vertices=[(x,y) for y in ys for x in xs]
triangles=[]
for row in range(len(ys)-1):
    for col in range(len(xs)-1):
        a=row*len(xs)+col; b=a+1; c=a+len(xs); e=c+1
        triangles.extend([(a,b,c),(b,e,c)])
def pose_point(x,y,bend):
    if y<=73: return (x+1*bend,y+7*bend)
    # Knee excursion is greatest at y=94; ankles and feet are frozen.
    amounts={73:(0,7),84:(3,6),94:(7,3),103:(3,1),110:(0,0),118:(0,0),127:(0,0)}
    lo=max(k for k in amounts if k<=y);hi=min(k for k in amounts if k>=y)
    t=0 if lo==hi else (y-lo)/(hi-lo)
    spread=amounts[lo][0]*(1-t)+amounts[hi][0]*t
    sink=amounts[lo][1]*(1-t)+amounts[hi][1]*t
    lateral=max(-1,min(1,(x-61)/22))
    return (x+spread*lateral*bend,y+sink*bend)
def articulate(bend):
    result=Image.new('RGBA',im.size)
    dst=[pose_point(x,y,bend) for x,y in vertices]
    for indices in triangles:
        a,b,c=[dst[k] for k in indices]
        sa,sb,sc=[vertices[k] for k in indices]
        det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        for y in range(max(0,math.floor(min(a[1],b[1],c[1]))),min(h,math.ceil(max(a[1],b[1],c[1]))+1)):
            for x in range(max(0,math.floor(min(a[0],b[0],c[0]))),min(w,math.ceil(max(a[0],b[0],c[0]))+1)):
                u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det
                v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det
                z=1-u-v
                if min(u,v,z)>=-0.00001:
                    sx=round(u*sa[0]+v*sb[0]+z*sc[0]);sy=round(u*sa[1]+v*sb[1]+z*sc[1])
                    if 0<=sx<w and 0<=sy<h: result.putpixel((x,y),body.getpixel((sx,sy)))
    return result
# Keep the held blades rigid: knee mesh must never bend sword silhouettes.
heldmask=Image.new('L',im.size); hd=ImageDraw.Draw(heldmask)
hd.polygon([(0,63),(40,63),(43,80),(36,101),(0,101)],fill=255)
hd.polygon([(97,59),(127,59),(127,104),(105,104),(94,84)],fill=255)
held=Image.new('RGBA',im.size);held.paste(body,(0,0),heldmask)
body.paste((0,0,0,0),(0,0),heldmask)
frames=[]
for i in range(16):
    t=i/16*math.tau
    bend=(1-math.cos(t))/2
    frame=articulate(bend)
    frame.alpha_composite(held,(round(bend),round(7*bend)))
    # The floating pair hover independently; held blades remain attached to hands.
    frame.alpha_composite(floating,(0,round(math.sin(t)*1)))
    spark=ImageDraw.Draw(frame)
    # Two short glints at a time, following the four original blade locations.
    sites=[(36,21,(179,244,255)),(20,44,(255,239,166)),(27,84,(193,255,192)),(108,85,(255,203,242))]
    for k,(x,y,c) in enumerate(sites):
        phase=(i+k*4)%16
        if phase<5:
            if k<2: yy=y+round(math.sin(t))
            else:
                x+=round(bend);yy=y+round(7*bend)
            r=2 if phase in (1,2) else 1
            spark.line((x-r,yy,x+r,yy),fill=(*c,255))
            spark.line((x,yy-r,x,yy+r),fill=(*c,255))
            spark.point((x,yy),fill=(255,255,255,255))
    frame.save(f'{out}/frame_{i:02}.png');frames.append(frame)
frames[0].save(f'{out}/preview.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2)
json.dump({'source':source,'frames':16,'frameMs':100,'method':'controlled pixel deformation; planted feet, concealed-knee flex, floating sword hover and blade glints','liveRileyChanged':False,'generationCalls':0},open(f'{out}/preview.json','w'),indent=2)
print(im.size, out)
