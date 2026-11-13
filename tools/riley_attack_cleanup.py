from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import json,shutil
root=Path('website/public/art/riley-four-sword-cleanup');root.mkdir(exist_ok=True)
ids=['7dcd7850-37a1-5b3f-8c6c-de2919b91edc','46b894b3-7855-59a2-9830-40fa39bc3819','1492e2fd-85c6-5615-8f94-611c7bf7e642','d61109b7-7d73-5fb7-be15-93ccbe215761','e589b527-185c-5e67-b67f-baa01d01a5e6','fcc0d9d1-4222-56dd-b211-b01435d5f7f4','1d59715f-e6ee-56c1-a2d0-4c8e34aeec38','853d57d2-a7ac-50b5-a8bb-05f21ace412c']
nums=[9,11,12,14,17,18,26,28]
# Restrict edits to defects/effects; untouched body and frame remainder retain original RGBA.
regions=[[(90,30,200,105)],[(135,45,196,115)],[(118,72,151,105)],[(30,40,125,80)],[(70,15,225,74)],[(110,15,230,75),(175,80,228,163)],[(166,125,201,155)],[(140,25,220,85)]]
meta=json.loads(Path('website/public/art/riley-four-sword-attack-review.json').read_text());original=meta['frames'][:]
report=[];out=Image.new('RGB',(2048,768),'#293348');d=ImageDraw.Draw(out)
for j,(num,id,boxes) in enumerate(zip(nums,ids,regions)):
 src=Image.open(f'assets/images/53f1ea14-fa34-55d7-b659-bd66b069eb28/frames/{num-1}.png').convert('RGBA');ed=Image.open(f'assets/images/{id}/image.png').convert('RGBA')
 mask=Image.new('L',src.size);md=ImageDraw.Draw(mask)
 for box in boxes:md.rectangle(box,fill=255)
 # Gray-cloud connected component selects only the contaminant, not a rectangle.
 if num in (9,11):
  pts=set()
  for y in range(40,145):
   for x in range(90,200):
    r,g,b,a=src.getpixel((x,y))
    if a and max(r,g,b)-min(r,g,b)<22 and (r+g+b)/3>65:pts.add((x,y))
  largest=[];secondary=[]
  while pts:
   p=pts.pop();c=[p];q=[p]
   while q:
    x,y=q.pop()
    for v in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
     if v in pts:pts.remove(v);q.append(v);c.append(v)
   if len(c)>len(largest):largest=c
   if num==11 and len(c)>40 and min(y for x,y in c)>110:
    secondary.extend(c)
  mask=Image.new('L',src.size)
  for point in largest+secondary:mask.putpixel(point,255)
  mask=mask.filter(ImageFilter.MaxFilter(7))
 fixed=Image.composite(ed,src,mask);fixed.save(root/f'{num}.png');meta['frames'][num-1]=f'./art/riley-four-sword-cleanup/{num}.png'
 changed=sum(a!=b for a,b in zip(src.getdata(),fixed.getdata()));report.append({'frame':num,'changedPixels':changed,'regions':boxes})
 im=fixed.resize((512,384),Image.Resampling.NEAREST);out.paste(im,(j%4*512,j//4*384),im);d.text((j%4*512+8,j//4*384+5),str(num),fill='white')
meta.update(originalFrames=original,cleanedFrames=nums,assessment='Movement approved. Local cleanup pass on frames 9, 11, 12, 14, 17, 18, 26 and 28 awaits your review. All other frames and the original 10 fps timing are unchanged.')
Path('website/public/art/riley-four-sword-attack-cleaned.json').write_text(json.dumps(meta,indent=2))
(root/'patch-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
