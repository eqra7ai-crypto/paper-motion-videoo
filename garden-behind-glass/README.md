# The Garden Behind the Glass

A 49 s, 9:16, 24 fps short, generated entirely in code (no stock footage, no AI video service).

- `scene.js` / `index.html` — deterministic 2.5D scene: perspective camera, cafe architecture, garden,
  characters (Rami, Samar), transformation, bloom wave, pendant. `renderFrame(t)` draws time `t`.
  Open `index.html?t=30` (still) or `index.html?play` (real-time) in a browser.
- `audio.py` — synthesized soundtrack (garden ambience, birdsong, magic shimmer, heartbeat, footsteps) → `audio.wav`.
- `render.js` — `node render.js <scale> <out.mp4> [workers] [crf]`; scale 0.5 = 540×960 preview, 2 = 2160×3840.
- `still.js` — `node still.js <scale> <t...>` renders individual frames for checking.

Timeline: 0–15.5 s continuous camera move from the garden through the open door; 15.5 s locked off;
20.6–24.2 s Samar becomes the pendant; 24.2 s heartbeat; 25.4 s bloom wave; 31–39.4 s Rami lifts,
kisses (heart glows red at 35.9 s) and pockets the pendant; 40.6–45 s he stands and walks out; hold to 49 s.
