"""Render the existing pose study as native-size input for costume restoration."""
from pathlib import Path
import re
import cairosvg
p=Path('website/public/previews/riley/structure-proof')
s=(p/'body-construction.svg').read_text()
s=s[:s.index('<g id="construction"')]+'</svg>'
s=re.sub(r'<rect width="400" height="440" fill="#202938"/>','',s)
s=s.replace('viewBox="0 0 400 440"','viewBox="25 20 350 400"')
cairosvg.svg2png(bytestring=s.encode(),write_to=str(p/'pose-input.png'),output_width=128,output_height=128)
print(p/'pose-input.png')
