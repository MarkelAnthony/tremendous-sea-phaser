"""Anatomy-only design proof. Does not modify Riley's sprite or synced assets."""
from pathlib import Path
from PIL import Image, ImageDraw

out = Path('website/public/previews/riley/structure-proof')
out.mkdir(parents=True, exist_ok=True)
im = Image.open('website/public/previews/riley/ingame-placement/frame_000.png').convert('RGBA')
grid = Image.new('RGBA', (768, 768), '#252e3e')
grid.alpha_composite(im.resize((768,768), Image.Resampling.NEAREST))
d = ImageDraw.Draw(grid)
for n in range(0,129,8):
    p=n*6
    d.line((p,0,p,768), fill=(190,205,225,70))
    d.line((0,p,768,p), fill=(190,205,225,70))
    d.text((p+2,0),str(n),fill='white')
    d.text((0,p+2),str(n),fill='white')
grid.save(out/'original-grid.png')
# This is deliberately a labelled construction drawing, NOT a replacement sprite.
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 410" role="img" aria-label="Proposed three-quarter right-facing body construction">
<defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#344052" stroke-width=".5"/></pattern></defs>
<rect width="360" height="410" fill="#202938"/><rect width="360" height="410" fill="url(#grid)"/>
<!-- Far limbs first: the upper arm originates at the far clavicle endpoint. -->
<g stroke="#131b28" stroke-width="3" stroke-linejoin="round">
<path d="M180 248L195 296L206 365L188 369L174 305L160 259Z" fill="#63718c"/>
<path d="M185 367L207 365L219 376L185 376Z" fill="#63718c"/>
<path d="M191 119Q204 119 209 137L227 165L236 200Q238 211 228 213Q218 214 217 203L208 173L184 142Q178 127 191 119Z" fill="#438878"/>
<path d="M224 199Q237 195 239 206L238 217Q227 225 220 215Z" fill="#74b7a0"/>
<!-- Pelvis and chest remain distinct, not a single robe silhouette. -->
<path d="M152 195L191 194L199 233L181 258L153 253L143 232Z" fill="#687b99"/>
<path d="M152 249L174 256L161 308L156 368L135 368L137 305Z" fill="#8799b3"/>
<path d="M135 364L156 365L168 377L128 377Z" fill="#8799b3"/>
<path d="M153 128Q172 116 191 123L204 150Q213 177 192 201L153 201Q138 173 143 150Z" fill="#9c826e"/>
<!-- Neck is between the underside of the skull and the clavicles. -->
<path d="M174 95L191 95L190 113L197 124L178 132L163 128L174 114Z" fill="#bd9880"/>
<path d="M174 94L181 99L179 115L171 125L164 127L174 113Z" fill="#886b60" stroke="none"/>
<!-- Simplified head only. Riley's hair/face are intentionally not redesigned here. -->
<path d="M164 54Q181 39 197 54L201 70L209 79L203 84L203 95L191 104L173 98L161 82Z" fill="#c7ab91"/>
<path d="M192 69L198 70" fill="none" stroke="#283445"/>
<!-- Near arm lies IN FRONT of the ribcage. -->
<path d="M157 128Q170 131 168 146L154 180L162 193L181 205Q188 213 181 220Q177 225 169 219L148 207L135 185Q131 179 135 169L143 139Q147 127 157 128Z" fill="#aa795d"/>
<path d="M172 205Q181 202 186 211L188 220Q181 230 173 224L167 215Z" fill="#d3ab85"/>
</g>
<!-- Construction layer: explicit attachment paths, not invented sleeve bumps. -->
<g id="construction" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
<path d="M183 104L181 124L175 165L173 222" stroke="#f6d786"/>
<path d="M181 124L193 130M181 124L157 139" stroke="#f6d786"/>
<path d="M193 130L217 169L229 207" stroke="#8ae2c2"/>
<path d="M157 139L145 181L178 216" stroke="#ffc194"/>
<path d="M158 255L148 307L145 365M179 254L184 302L197 366" stroke="#c8d5ec"/>
<path d="M193 130L197 148L197 164" stroke="#f6d786" stroke-dasharray="3 5"/>
<g fill="#202938"><circle cx="193" cy="130" r="5" stroke="#8ae2c2"/><circle cx="157" cy="139" r="6" stroke="#ffc194"/><circle cx="217" cy="169" r="5" stroke="#8ae2c2"/><circle cx="145" cy="181" r="5" stroke="#ffc194"/><circle cx="229" cy="207" r="4" stroke="#8ae2c2"/><circle cx="178" cy="216" r="4" stroke="#ffc194"/></g>
</g>
<!-- Optional grip axes: merely positional placeholders, not sword artwork. -->
<g id="grip-axes" stroke-width="3" stroke-linecap="round" opacity="0"><path d="M230 199L262 302M218 215L239 209" stroke="#8ae2c2"/><path d="M178 208L104 298M164 216L184 229" stroke="#ffc194"/></g>
<g font-family="system-ui,sans-serif" font-size="11" fill="#e5edf8">
<text x="15" y="24" font-size="12">PROPOSED BODY CONSTRUCTION · NOT FINAL ART</text>
<path d="M204 109H248" stroke="#c9d4e6"/><text x="250" y="113">Exposed neck</text>
<path d="M198 130L250 138" stroke="#8ae2c2"/><text x="252" y="142">Far shoulder</text>
<path d="M151 138L79 124" stroke="#ffc194"/><text x="12" y="120">Near shoulder</text>
<path d="M150 164L91 158" stroke="#c9d4e6"/><text x="16" y="156">Ribcage</text>
<path d="M234 207L266 227" stroke="#8ae2c2"/><text x="255" y="242">Green grip</text>
<path d="M175 220L97 232" stroke="#ffc194"/><text x="23" y="237">Red grip</text>
<text x="20" y="398" fill="#a7b6cb">Guide only. No face, costume, swords or VFX approval implied.</text>
</g></svg>'''
(out/'body-construction.svg').write_text(svg)
print('Saved anatomy-only proof; original sprite and runtime assets untouched.')
