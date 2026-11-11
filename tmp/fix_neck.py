from PIL import Image
src='website/public/previews/riley/ingame-placement/frame_000.png'
a=Image.open(src).convert('RGBA'); px=a.load()
C={'#':(5,4,4,255),'n':(68,30,36,255),'v':(127,76,52,255),'o':(117,62,45,255),'u':(70,18,31,255),
   'K':(241,185,69,255),'L':(245,197,94,255),'P':(211,134,54,255),'Q':(179,103,39,255),'S':(196,111,41,255),
   'b':(151,88,47,255),'T':(181,84,42,255),'.':(0,0,0,0)}
def put(y,x0,s):
    for i,ch in enumerate(s): px[x0+i,y]=C[ch]
# 1) NECK: open the jaw line and run a real neck down behind the chin into the collar
put(41,66,'uuuuuu#####')      # shadow under jaw, chin outline kept at x72-76
put(42,66,'nnnnno#.')         # neck, throat edge outline x72
put(43,66,'nnnnvo#')
put(44,66,'nnnvvo#')          # was the far-shoulder cap (T QQQ) — now neck
# 2) COLLAR + CHEST: chest top starts below the neck, front edge pulled in (no cap under chin)
put(45,65,'ubQQQQT#.')
put(46,65,'QbQKKKP#..')
# 3) FAR ARM: emerges from BEHIND the chest outline at row 47, not from a cap under the chin
put(47,67,'KKKP#SQ#')
# darken the far arm one tone so it reads as behind the body
start={48:71,49:72,50:73,51:73,52:73,53:73,54:73,55:73,56:73,57:73,58:73}
step={C['L']:C['K'],C['K']:C['P'],C['P']:C['Q'],C['Q']:C['S']}
for y,x0 in start.items():
    for x in range(x0,80):
        p=px[x,y]
        if p==C['#'] : break
        if p in step: px[x,y]=step[p]
out='website/public/previews/riley/anatomy-study/proposed.png'
a.save(out)
o=Image.open(src).convert('RGBA')
for im,n in ((o,'original-detail'),(a,'proposed-detail')):
    c=im.crop((52,26,84,62)); bg=Image.new('RGBA',c.size,(37,46,62,255)); bg.alpha_composite(c)
    bg.resize((c.width*10,c.height*10),Image.NEAREST).save(f'website/public/previews/riley/anatomy-study/{n}.png')
W=Image.new('RGBA',(64,36),(37,46,62,255)); W.alpha_composite(o.crop((52,26,84,62)),(0,0)); W.alpha_composite(a.crop((52,26,84,62)),(32,0))
W.resize((640,360),Image.NEAREST).save('tmp/cmp2.png')
# close the top of the far arm's outline
a=Image.open(out).convert('RGBA'); a.putpixel((73,46),C['#']); a.save(out)
for im,n in ((a,'proposed-detail'),):
    c=im.crop((52,26,84,62)); bg=Image.new('RGBA',c.size,(37,46,62,255)); bg.alpha_composite(c)
    bg.resize((c.width*10,c.height*10),Image.NEAREST).save(f'website/public/previews/riley/anatomy-study/{n}.png')
W=Image.new('RGBA',(64,36),(37,46,62,255)); W.alpha_composite(o.crop((52,26,84,62)),(0,0)); W.alpha_composite(a.crop((52,26,84,62)),(32,0))
W.resize((640,360),Image.NEAREST).save('tmp/cmp2.png')
