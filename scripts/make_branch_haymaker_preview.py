from PIL import Image,ImageDraw
import math,json,os,shutil
root='website/public/previews/branch-haymaker'
os.makedirs(root+'/faithful',exist_ok=True)
source=Image.open('website/public/art/branch-approved-redraw.png').convert('RGBA')
mask=Image.new('L',source.size); ImageDraw.Draw(mask).polygon([(56,0),(82,0),(82,43),(65,44),(55,35),(54,25)],fill=255)
arm=source.copy(); arm.putalpha(Image.composite(source.getchannel('A'),Image.new('L',source.size),mask))
body=source.copy(); body.putalpha(Image.composite(Image.new('L',source.size),source.getchannel('A'),mask))
ref=Image.open('uploads/smash-bros-falcon-punch.gif')
flames=[]
for n in range(8,13):
 ref.seek(n); fx=ref.convert('RGBA')
 for y in range(fx.height):
  for x in range(fx.width):
   r,g,b,a=fx.getpixel((x,y))
   if not (r>100 and r>g*1.13 and g>b*1.35 and r-b>65): fx.putpixel((x,y),(0,0,0,0))
 flames.append(fx)
files=[]; thumbs=Image.new('RGB',(256*4,182*8),'#202634')
for n in range(32):
 # Guard, slow anticipation, fast extension, impact hold, gradual recovery.
 if n<4: amount=0
 elif n<11: amount=-(n-3)/7*.15
 elif n<14: amount=(n-10)/3
 elif n<19: amount=1
 elif n<28: amount=(28-n)/9
 else: amount=0
 out=Image.new('RGBA',(256,160))
 x=36+round(max(0,amount)*13); y=44+round(max(0,amount)*2)
 if amount==0: out.alpha_composite(source,(x,y))
 else:
  out.alpha_composite(body,(x,y))
  # Rigid source-pixel arm pivot; no generated face, clothing or anatomy.
  moved=arm.rotate(-round(58*amount),resample=Image.Resampling.NEAREST,center=(56,27))
  # Use padded layer so the extending glove is never cropped.
  padded=Image.new('RGBA',(256,160)); padded.alpha_composite(arm,(x,y))
  padded=padded.rotate(-round(58*amount),resample=Image.Resampling.NEAREST,center=(x+56,y+27))
  out.alpha_composite(padded)
 if 14<=n<=22:
  fx=flames[(n-14)%5].copy(); fade=1 if n<20 else (23-n)/4
  fx.putalpha(fx.getchannel('A').point(lambda a:round(a*fade)))
  # Flame beak drives forward from glove; a burst, not a beam.
  out.alpha_composite(fx,(12+(n-14)*5,0))
 path=f'./faithful/{n}.png';out.save(root+'/'+path[2:]);files.append(path)
 if n%1==0:
  thumb=Image.new('RGB',(256,182),'#202634');thumb.paste(out,(0,0),out);ImageDraw.Draw(thumb).text((5,163),str(n),fill='white');thumbs.paste(thumb,((n%4)*256,(n//4)*182))
json.dump(files,open(root+'/frames.json','w'))
thumbs.save(root+'/faithful-contact.png')
shutil.copyfile('uploads/smash-bros-falcon-punch.gif',root+'/falcon-reference.gif')
