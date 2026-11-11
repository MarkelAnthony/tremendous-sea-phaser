"""Preview-only far shoulder reconstruction. Never modifies runtime character art."""
from PIL import Image
from pathlib import Path
p=Path('website/public/previews/riley/anatomy-study')
a=Image.open('website/public/previews/riley/ingame-placement/frame_000.png').convert('RGBA')
b=a.copy()
# Rebuild the far sleeve from a lower shoulder socket to the existing cuff.
# '.' cuts away the original raised cap; stepped contours keep the native grid.
palette={'.':(0,0,0,0),'#':(5,4,4,255),'s':(117,62,45,255),'d':(179,103,39,255),'m':(211,134,54,255),'y':(241,185,69,255),'h':(245,197,94,255)}
rows={
43:'##.........',
44:'s#.........',
45:'s#.........',
46:'s#.........',
47:'s##........',
48:'sdm##......',
49:'#dmym#.....',
50:'#dmyhym#...',
51:'#dm yyym#..'.replace(' ',''),
52:'ddmyyhyym#.',
53:'dmmyyhyym#.',
54:'dmyyyyymd#.',
55:'dmyyyymdd#.',
56:'dmyyyymdd#.',
57:'dmyyyymdd#.',
58:'ddyyyymdd#.',
59:'ddmmmmmdd#.',
60:'dddddddd##.',
}
for y,row in rows.items():
 for dx,c in enumerate(row):b.putpixel((68+dx,y),palette[c])
b.save(p/'proposed.png')
a.crop((45,27,91,79)).save(p/'original-detail.png');b.crop((45,27,91,79)).save(p/'proposed-detail.png')
out=Image.new('RGBA',(96,56),(37,46,62,255));out.alpha_composite(a.crop((45,27,91,79)),(0,2));out.alpha_composite(b.crop((45,27,91,79)),(50,2));out.resize((960,560),Image.Resampling.NEAREST).save(p/'comparison-inspect.png')
changed=[(x,y) for y in range(128) for x in range(128) if a.getpixel((x,y))!=b.getpixel((x,y))];print('Changed pixels:',len(changed),'bounds:',(min(x for x,y in changed),min(y for x,y in changed),max(x for x,y in changed),max(y for x,y in changed)))
