from pathlib import Path
from PIL import Image, ImageDraw
import imageio.v3 as iio
import imageio_ffmpeg
import subprocess
out=Path('previews/fire-reference');out.mkdir(parents=True,exist_ok=True)
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-i','uploads/pixilart-1791885022160.mp4','-vf','fps=8,scale=320:-1','-frames:v','24',str(out/'video-%02d.png')],check=True)
frames=sorted(out.glob('video-*.png'))
canvas=Image.new('RGB',(1280,((len(frames)+3)//4)*220),'#283649');d=ImageDraw.Draw(canvas)
for i,p in enumerate(frames):
 im=Image.open(p);im.thumbnail((320,190));x=i%4*320;y=i//4*220;canvas.paste(im,(x,y+25));d.text((x+8,y+5),f'{i/8:.3f} s',fill='white')
canvas.save(out/'video-contact.png')
canvas=Image.new('RGB',(1536,400),'#283649');d=ImageDraw.Draw(canvas)
for i in range(6):
 im=Image.open(f'website/public/previews/branch-combat/fire-original-{i}.png').convert('RGBA');print(i,im.size,im.getbbox());im=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST);canvas.paste(im,(i*256,40),im);d.text((i*256+8,10),f'Original {i}',fill='white')
canvas.save(out/'original-contact.png')
