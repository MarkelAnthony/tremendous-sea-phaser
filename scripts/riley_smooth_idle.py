"""Add motion-tracked in-betweens without blending palettes or scaling poses.
Source assets are read-only. Original drawings remain at every fourth frame.
Run with a Python environment containing opencv-python-headless, numpy, Pillow.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/images/e1e8728a-681e-5d0b-8111-311e022fd795/frames'
DEST = ROOT / 'website/public/art/riley-smooth-idle'
DEST.mkdir(parents=True, exist_ok=True)
frames = [np.array(Image.open(SOURCE / f'{i}.png').convert('RGBA')) for i in range(9)]
y, x = np.mgrid[0:128, 0:128].astype(np.float32)

def gray(a):
    alpha = a[:, :, 3:4].astype(np.float32) / 255
    rgb = (a[:, :, :3] * alpha + np.array([35, 43, 59]) * (1-alpha)).astype(np.uint8)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

def flow(a, b):
    return cv2.calcOpticalFlowFarneback(gray(a), gray(b), None, .5, 4, 21, 6, 7, 1.5, 0)

index = 0
for a, b in zip(frames, frames[1:]):
    ab, ba = flow(a, b), flow(b, a)
    for k in range(4):
        t = k / 4
        if k == 0:
            out = a
        else:
            # Pull back through the nearer original, preserving exact RGBA colors.
            # No cross-fade, double swords, image scaling, or vertical sprite bob.
            src, movement, amount = (a, ab, t) if t < .5 else (b, ba, 1-t)
            mx, my = x - movement[:, :, 0] * amount, y - movement[:, :, 1] * amount
            for _ in range(3):
                v = cv2.remap(movement, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
                mx, my = x - v[:, :, 0]*amount, y - v[:, :, 1]*amount
            out = cv2.remap(src, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT)
        Image.fromarray(out).save(DEST / f'{index}.png')
        index += 1
Image.fromarray(frames[-1]).save(DEST / f'{index}.png')
print(f'Wrote {index+1} frames; original poses retained every fourth frame.')
