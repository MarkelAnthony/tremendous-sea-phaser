"""Reference-led construction proposal; never changes Riley's live assets."""
from pathlib import Path
from shutil import copyfile
out = Path('website/public/previews/riley/structure-proof')
copyfile('uploads/images.png', out / 'pose-reference.png')
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" role="img" aria-label="Reference-led bent-arm construction proposal with visible neck">
<rect width="400" height="440" fill="#202938"/>
<g stroke="#151d2a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
<!-- Rear leg and far upper arm precede torso: torso occludes the medial attachment only. -->
<path d="M199 264L226 313L265 385L244 393L201 327L177 281Z" fill="#63718c"/>
<path d="M245 386L267 384L285 399L240 399Z" fill="#63718c"/>
<path d="M208 142Q221 135 229 149L249 194Q253 203 246 210Q237 219 230 205L206 165Q201 152 208 142Z" fill="#438878"/>
<!-- Pelvis and front leg. -->
<path d="M159 236L204 231L216 268L188 287L157 278L147 260Z" fill="#687b99"/>
<path d="M158 269L184 282L153 332L128 392L104 387L124 319Z" fill="#8799b3"/>
<path d="M105 382L129 389L128 401L84 401Z" fill="#8799b3"/>
<!-- Ribcage, neck and head. -->
<path d="M160 142Q184 129 209 142L219 176Q220 206 204 239L160 240Q143 206 147 180Z" fill="#9c826e"/>
<path d="M179 108L198 108L198 128L208 140Q189 151 167 142L179 126Z" fill="#c39d83"/>
<path d="M179 109L185 114L183 130L175 140L168 142L179 126Z" fill="#886b60" stroke="none"/>
<path d="M168 61Q187 45 205 62L210 83L219 91L211 96L211 108L198 117L178 111L164 91Z" fill="#c7ab91"/>
<path d="M200 81L206 82" fill="none" stroke="#283445"/>
<!-- Far forearm rises FORWARD from its elbow, not from the back. -->
<path d="M233 195L251 199L268 155L253 149Z" fill="#58a38d"/>
<path d="M252 151L252 140Q254 132 263 133L275 139L274 153L265 160Z" fill="#86c6ad"/>
<!-- Near upper arm hangs from the lateral shoulder and overlaps chest. -->
<path d="M160 148Q171 151 170 164L157 209Q153 221 142 217Q132 214 135 202L146 160Q149 147 160 148Z" fill="#aa795d"/>
<!-- Near forearm turns forward/up from the SAME elbow. -->
<path d="M137 204Q138 198 146 197L188 174L199 189L154 218Q140 224 136 213Z" fill="#c58f6d"/>
<path d="M186 177L193 164Q198 159 205 163L214 174L208 186L197 193Z" fill="#d3ab85"/>
</g>
<g id="construction" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<path d="M189 117L189 141L185 189L183 254M160 157L189 141L216 153" stroke="#f6d786"/>
<path d="M216 153L241 202L263 146" stroke="#8ae2c2"/>
<path d="M160 157L146 208L201 178" stroke="#ffc194"/>
<g fill="#202938"><circle cx="216" cy="153" r="5" stroke="#8ae2c2"/><circle cx="241" cy="202" r="5" stroke="#8ae2c2"/><circle cx="263" cy="146" r="4" stroke="#8ae2c2"/><circle cx="160" cy="157" r="6" stroke="#ffc194"/><circle cx="146" cy="208" r="5" stroke="#ffc194"/><circle cx="201" cy="178" r="4" stroke="#ffc194"/></g>
</g>
<g id="grip-axes" stroke-width="3" stroke-linecap="round" opacity="0"><path d="M265 143L302 75M254 143L275 154" stroke="#8ae2c2"/><path d="M203 175L251 92M192 173L213 185" stroke="#ffc194"/></g>
<g font-family="system-ui,sans-serif" font-size="12" fill="#e5edf8">
<text x="15" y="25">REFERENCE-LED CONSTRUCTION · PROPOSAL</text>
<path d="M202 126L274 109" stroke="#c9d4e6"/><text x="278" y="108">Visible neck</text>
<path d="M162 153L88 132" stroke="#ffc194"/><text x="16" y="127">Near shoulder</text>
<path d="M220 151L310 178" stroke="#8ae2c2"/><text x="304" y="193">Far shoulder</text>
<text x="16" y="251" fill="#ffc194">Elbows below</text><text x="16" y="267" fill="#ffc194">the shoulders</text>
<text x="16" y="426" fill="#a7b6cb">Flat-colour pose study — not a finished Riley sprite.</text>
</g></svg>'''
(out / 'body-construction.svg').write_text(svg)
print('Saved reference-led proposal; live Riley untouched.')
