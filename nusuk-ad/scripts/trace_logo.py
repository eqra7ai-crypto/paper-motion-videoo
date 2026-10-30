"""Vectorize the Nusuk logo cropped from the client's reference poster."""
import sys
import numpy as np
import potrace
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
img = Image.open(src).convert("L").filter(ImageFilter.GaussianBlur(2.2))
a = np.asarray(img)
bm = potrace.Bitmap(a < 120)
plist = bm.trace(turdsize=40, alphamax=1.0, opticurve=True, opttolerance=0.3)
h, w = a.shape
parts = []
for curve in plist:
    s = curve.start_point
    d = [f"M{s.x:.1f},{s.y:.1f}"]
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f"L{seg.c.x:.1f},{seg.c.y:.1f}L{seg.end_point.x:.1f},{seg.end_point.y:.1f}")
        else:
            d.append(f"C{seg.c1.x:.1f},{seg.c1.y:.1f} {seg.c2.x:.1f},{seg.c2.y:.1f} {seg.end_point.x:.1f},{seg.end_point.y:.1f}")
    parts.append("".join(d) + "Z")
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="#000" fill-rule="evenodd" d="{" ".join(parts)}"/></svg>'
open(out, "w").write(svg)
print(w, h, len(parts))
