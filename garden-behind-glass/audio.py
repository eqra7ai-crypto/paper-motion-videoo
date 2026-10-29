"""Synthesize the soundtrack (no music, no dialogue): garden ambience, birdsong, magic shimmer,
heartbeat and soft footsteps. Timeline mirrors T in scene.js. Writes audio.wav (48 kHz stereo)."""
import numpy as np, wave, os

SR, DUR = 48000, 49.0
N = int(SR * DUR)
rng = np.random.default_rng(3)
t = np.arange(N) / SR
T = dict(camIn=15.5, glow=19.5, dis0=20.6, dis1=23.6, pend1=24.2, hb0=24.2, hbP=0.9375, hbEnd=41.5,
         wave=25.4, grab=32.6, kiss0=35.0, glowRed=35.9, pocketIn=39.0, stand0=40.6, stand1=41.7, walk0=42.2)


def env(a, b, x, fade=1.0):
    """1 inside [a,b] with smooth fades of `fade` seconds."""
    return np.clip((x - a) / fade + 1, 0, 1) * np.clip((b - x) / fade + 1, 0, 1)


def shaped_noise(n, lo, hi, tilt=0.0):
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    g = ((f > lo) & (f < hi)).astype(float) * np.power(np.maximum(f, 20) / 1000, tilt)
    x = np.fft.irfft(spec * g, n)
    return x / (np.abs(x).max() + 1e-9)


def fft_conv(x, ir):
    n = len(x) + len(ir)
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]


def lowpass_time_varying(x, cut_lo, cut_hi, mix):
    """Crossfade between a muffled (inside) and an open (outside) version."""
    a = fft_conv(x, np.ones(int(SR / cut_lo)) / int(SR / cut_lo))
    return a * (1 - mix) + x * mix


L = np.zeros(N); R = np.zeros(N)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N: return
    s = sig[:N - i] * gain
    L[i:i + len(s)] += s * np.sqrt((1 - pan) / 2)
    R[i:i + len(s)] += s * np.sqrt((1 + pan) / 2)


# --- garden ambience: soft wind through leaves, muffled while inside, opening up after the bloom
outside = 1 - np.clip((t - 9) / 4, 0, 1) + np.clip((t - T['wave']) / 4, 0, 1) * 0.75
wind = shaped_noise(N, 150, 6000, -1.0) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 7.3) ** 2)
leaves = shaped_noise(N, 1800, 9000, -0.4) * np.clip(0.4 + 0.6 * np.sin(2 * np.pi * t / 3.1 + 1) ** 4, 0, 1)
amb = lowpass_time_varying(wind * 0.6 + leaves * 0.35, 600, 0, np.clip(outside, 0, 1))
fadein = np.clip(t / 1.5, 0, 1); fadeout = np.clip((DUR - t) / 1.5, 0, 1)
amb *= 0.07 * (0.6 + 0.4 * np.clip(outside, 0, 1)) * fadein
L += amb; R += np.roll(amb, 311)


# --- birdsong: synthesized chirps and trills
def chirp(dur, f0, f1, vib=0.0):
    n = int(dur * SR); x = np.arange(n) / SR
    f = f0 + (f1 - f0) * (x / dur) ** 0.7 + vib * np.sin(2 * np.pi * 38 * x) * f0 * 0.04
    ph = 2 * np.pi * np.cumsum(f) / SR
    e = np.sin(np.pi * x / dur) ** 2
    return (np.sin(ph) + 0.25 * np.sin(2 * ph)) * e


def bird_phrase(kind):
    out = []
    if kind == 0:  # trill
        for k in range(rng.integers(5, 10)): out += [chirp(0.05, 4200 + 300 * k % 3, 3600), np.zeros(int(0.025 * SR))]
    elif kind == 1:  # two-note whistle
        out = [chirp(0.22, 2600, 3300, 1), np.zeros(int(0.08 * SR)), chirp(0.3, 3300, 2500, 1)]
    else:  # quick sweeps
        for k in range(rng.integers(2, 5)): out += [chirp(0.09, 5200, 3000), np.zeros(int(0.06 * SR))]
    return np.concatenate(out)


tt = 0.8
while tt < DUR - 1:
    ins = 12 < tt < T['wave'] + 2
    end = tt > 44
    g = 0.012 if ins else (0.05 if end else 0.032)
    add(bird_phrase(int(rng.integers(0, 3))), tt, g, float(rng.uniform(-0.8, 0.8)))
    tt += float(rng.uniform(0.8, 1.6) if end else rng.uniform(1.4, 3.2))

# --- magic: shimmering bells while Samar turns to light, a soft rising swell, the bloom whoosh
def bell(f, dur=1.6):
    n = int(dur * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 4)) * np.exp(-x * 3.2) * np.minimum(1, x * 200)


scale = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3, 2637.0]
for i in range(70):
    s = T['glow'] + rng.uniform(0, T['pend1'] - T['glow'] + 0.3)
    add(bell(scale[int(rng.integers(0, len(scale)))]), s, 0.006 + 0.004 * rng.random(), float(rng.uniform(-0.7, 0.7)))
swell = shaped_noise(N, 300, 5000, -0.5)
swell_env = np.clip((t - T['glow']) / (T['pend1'] - T['glow']), 0, 1) ** 2 * np.clip((T['pend1'] + 0.6 - t) / 0.6, 0, 1)
pad = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(261.6, 0), (329.6, 1), (392.0, 2), (523.3, 3)]) / 4
L += (swell * 0.02 + pad * 0.02) * swell_env; R += (np.roll(swell, 97) * 0.02 + pad * 0.02) * swell_env
# bloom wave
w = shaped_noise(int(3.5 * SR), 200, 9000, -0.3); xw = np.arange(len(w)) / SR
add(w * np.exp(-xw * 1.4) * np.minimum(1, xw * 8) * 0.07, T['wave'] - 0.1, 1.0, 0)
for i in range(60):
    add(bell(scale[int(rng.integers(0, len(scale)))] * 2, 0.9), T['wave'] + rng.uniform(0, 4.5), 0.005, float(rng.uniform(-0.9, 0.9)))
# butterfly wing flutters (very soft) while they fill the cafe
for i in range(40):
    n = int(0.35 * SR); x = np.arange(n) / SR
    fl = shaped_noise(n, 2500, 8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * x)) * np.sin(np.pi * x / 0.35)
    add(fl, T['wave'] + 0.5 + rng.uniform(0, 18), 0.008, float(rng.uniform(-0.9, 0.9)))
# the red glow after the kiss: one warm chime
add(bell(784.0, 3.0) * 0.8 + bell(1174.7, 3.0) * 0.5, T['glowRed'], 0.025, 0)


# --- heartbeat: lub-dub, clearly audible but restrained
def thump(f0, dur, gain):
    n = int(dur * SR); x = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-x * 30))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 18) * np.minimum(1, x * 400)
    return s * gain


k = 0
while True:
    tb = T['hb0'] + k * T['hbP']
    if tb > T['hbEnd'] + 0.5: break
    fade = np.clip((T['hbEnd'] + 0.5 - tb) / 1.5, 0, 1) * (0.55 if tb > T['pocketIn'] else 1.0)
    add(thump(52, 0.3, 0.32 * fade), tb, 1, 0); add(thump(64, 0.24, 0.2 * fade), tb + 0.2, 1, 0)
    k += 1

# --- foley: chair creak when he stands, soft footsteps as he leaves
cr = shaped_noise(int(0.5 * SR), 300, 2500); xc = np.arange(len(cr)) / SR
add(cr * np.sin(2 * np.pi * 9 * xc) ** 2 * np.sin(np.pi * xc / 0.5) * 0.03, T['stand0'] + 0.1, 1, -0.3)
for s in range(6):
    st = T['walk0'] + 0.25 + s * 0.68
    n = int(0.12 * SR); x = np.arange(n) / SR
    step = shaped_noise(n, 80, 1800) * np.exp(-x * 40) + thump(90, 0.12, 0.6)
    add(step, st, 0.045 * (1 - s * 0.12), -0.3 - s * 0.1)

# --- room reverb for everything (short, soft) and master
ir = rng.standard_normal(int(1.1 * SR)) * np.exp(-np.arange(int(1.1 * SR)) / SR * 5.5)
ir /= np.abs(ir).sum() / 6
L = L + 0.18 * fft_conv(L, ir); R = R + 0.18 * fft_conv(R, np.roll(ir, 211))
L *= fadeout; R *= fadeout
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.7, R / peak * 0.7
data = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio.wav'), 'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(data.tobytes())
print('audio.wav written', data.shape)
