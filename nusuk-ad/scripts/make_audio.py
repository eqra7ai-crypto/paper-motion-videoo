"""
Synthesizes the original soundtrack and sound effects for the Nusuk promo.

    python3 scripts/make_audio.py

Writes public/audio/music.wav (42 s ambient score in D Hijaz, built to the
scene timeline) and public/audio/sfx/*.wav. Everything is generated from
scratch with numpy/scipy, so there are no licensing questions.
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n)
    e[:A] = np.linspace(0, 1, A)
    D = min(D, n - A)
    e[A:A + D] = np.linspace(1, s, D)
    if R > 0:
        e[-R:] *= np.linspace(1, 0, R)
    return e


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def reverb(stereo, seconds=2.8, wet=0.35, seed=1):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    decay = np.exp(-np.linspace(0, 7, n))
    out = np.zeros((stereo.shape[0] + n - 1, 2))
    for ch in range(2):
        ir = r.standard_normal(n) * decay
        ir = lowpass(ir, 6000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = fftconvolve(stereo[:, ch], ir)
    out[: stereo.shape[0]] = out[: stereo.shape[0]] * wet + stereo * (1 - wet)
    return out


def pan(mono, p):
    """p in [-1, 1]; constant power."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def save(name, stereo, peak=0.89):
    stereo = stereo / (np.max(np.abs(stereo)) + 1e-9) * peak
    path = os.path.join(ROOT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, (stereo * 32767).astype(np.int16))
    print("wrote", os.path.relpath(path), f"{stereo.shape[0] / SR:.2f}s")


# ------------------------------------------------------------------ music
DUR = 42.0
N = int(DUR * SR)
T = t_axis(DUR)
music = np.zeros((N, 2))


def add(buf, start, stereo):
    i = int(start * SR)
    j = min(buf.shape[0], i + stereo.shape[0])
    buf[i:j] += stereo[: j - i]


def soft_tone(f, sec, harmonics=(1, 0.5, 0.25, 0.12), detune=0.0018, vib=0.0):
    t = t_axis(sec)
    x = np.zeros_like(t)
    for k, amp in enumerate(harmonics, 1):
        for d in (-detune, detune):
            ph = 2 * np.pi * f * k * (1 + d) * t + vib * np.sin(2 * np.pi * 4.8 * t)
            x += amp * np.sin(ph + rng.uniform(0, 6.28))
    return x


def pluck(f, sec=2.5, bright=0.5):
    """Karplus-Strong, a qanun/oud-like plucked string."""
    n = int(sec * SR)
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    buf = lowpass(buf, 2000 + bright * 6000)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.4985 * (buf[i % p] + buf[(i + 1) % p])
    return out * np.exp(-np.linspace(0, 3.5, n))


# section boundaries (seconds) mirror the video timeline
S_APP, S_SERV, S_PRIZE, S_CTA = 5.0, 12.0, 22.0, 33.0

# 1) drone: D2 + A2, slow breathing
drone = soft_tone(hz(38), DUR, (1, 0.6, 0.3, 0.15, 0.08)) * 0.5 + soft_tone(hz(45), DUR, (1, 0.4, 0.2)) * 0.3
drone *= 0.55 + 0.25 * np.sin(2 * np.pi * T / 9.0)
drone = lowpass(drone, 900)
drone_env = np.interp(T, [0, 3, S_PRIZE - 0.3, S_PRIZE, S_CTA, DUR - 3, DUR], [0, 1, 1, 1.35, 1.1, 0.9, 0])
music += pan(drone * drone_env * 0.32, 0)

# 2) pad chords, D Hijaz colour: D – Eb – D – Cm – D ...
chords = [
    (0.0, [62, 66, 69]),       # D
    (S_APP, [63, 67, 70]),     # Eb
    (8.5, [62, 66, 69, 74]),   # D
    (S_SERV, [60, 63, 67]),    # Cm
    (15.5, [58, 62, 65]),      # Bb
    (19.0, [63, 67, 70]),      # Eb (tension before the prizes)
    (S_PRIZE, [62, 66, 69, 74, 78]),  # D major, bright
    (27.5, [67, 70, 74, 79]),  # Gm
    (S_CTA, [63, 67, 70, 75]), # Eb
    (37.0, [62, 66, 69, 74]),  # D (home)
]
for idx, (start, notes) in enumerate(chords):
    end = chords[idx + 1][0] if idx + 1 < len(chords) else DUR
    sec = end - start + 2.5
    voice = np.zeros(int(sec * SR))
    for m in notes:
        voice += soft_tone(hz(m), sec, (1, 0.35, 0.15), detune=0.003, vib=0.002)
    voice = lowpass(voice, 2600 if start >= S_PRIZE and start < S_CTA else 1800)
    voice *= env_adsr(len(voice), 1.6, 0.5, 0.85, 2.4)
    gain = 0.11 if start < S_PRIZE else (0.15 if start < S_CTA else 0.12)
    st = np.stack([voice, np.roll(voice, 900)], axis=1) * gain
    add(music, start, st)

# 3) plucked arpeggios in D Hijaz (D Eb F# G A Bb C)
scale = [62, 63, 66, 67, 69, 70, 72, 74, 75, 78, 79, 81]
pattern = [0, 4, 7, 4, 2, 4, 6, 4]
step = 60 / 84 / 2  # eighths at 84 bpm
t0 = S_APP + 0.4
k = 0
while t0 < DUR - 2:
    if S_APP <= t0 < S_SERV:
        dens, vol = 2, 0.18      # quarter notes
    elif S_SERV <= t0 < S_PRIZE:
        dens, vol = 1, 0.16      # eighths
    elif S_PRIZE <= t0 < S_CTA:
        dens, vol = 1, 0.2
    else:
        dens, vol = 2, 0.15
    if k % dens == 0:
        base = pattern[(k // dens) % len(pattern)]
        if S_PRIZE <= t0 < S_CTA:
            base += 3
        m = scale[min(base, len(scale) - 1)]
        if t0 >= S_CTA and t0 > DUR - 6:
            m = [62, 66, 69, 74][(k // dens) % 4]
        add(music, t0, pan(pluck(hz(m), 2.2, 0.6) * vol, np.sin(k * 0.9) * 0.5))
    k += 1
    t0 += step

# 4) prize section: soft heartbeat thumps (frame-drum feel) + air
beat = 60 / 84
tb = S_PRIZE + beat
while tb < S_CTA - 0.2:
    tt = t_axis(0.5)
    thump = np.sin(2 * np.pi * (70 * tt - 40 * tt ** 2)) * np.exp(-tt * 14)
    add(music, tb, pan(thump * 0.32, 0))
    tb += beat
air = highpass(rng.standard_normal(N), 6000) * np.interp(T, [0, S_PRIZE, S_PRIZE + 1, S_CTA, S_CTA + 2, DUR], [0, 0, 0.02, 0.02, 0.006, 0])
music += pan(air, 0)

# 5) final resolving bell
bell_t = t_axis(5)
bell = sum(a * np.sin(2 * np.pi * hz(74) * r * bell_t) * np.exp(-bell_t * d)
           for r, a, d in [(1, 1, 1.2), (2.01, 0.5, 2), (2.76, 0.35, 3), (5.4, 0.15, 5)])
add(music, 37.0, pan(bell * 0.12, 0.2))

music = reverb(music, 3.2, wet=0.4, seed=3)[:N]
music *= np.interp(T, [0, 0.4, DUR - 2.5, DUR], [0, 1, 1, 0])[:, None]
save("music.wav", music, peak=0.8)

# -------------------------------------------------------------------- sfx


def noise_sweep(sec, f0, f1, peak_at=0.6, pan0=-0.6, pan1=0.6, q=0.5):
    n = int(sec * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 64
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for b in range(blocks):
        fc = f0 * (f1 / f0) ** (b / blocks)
        lo, hi = max(40, fc * (1 - q)), min(SR / 2 - 100, fc * (1 + q))
        seg = bandpass(x[max(0, edges[b] - 2000): edges[b + 1]], lo, hi)
        out[edges[b]: edges[b + 1]] = seg[-(edges[b + 1] - edges[b]):]
    e = np.interp(np.arange(n), [0, peak_at * n, n], [0, 1, 0]) ** 1.6
    out *= e
    p = np.linspace(pan0, pan1, n)
    a = (p + 1) * np.pi / 4
    return np.stack([out * np.cos(a), out * np.sin(a)], axis=1)


def bell_tone(f, sec=2.0, decay=2.5):
    t = t_axis(sec)
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * decay * dm)
               for r, a, dm in [(1, 1, 1), (2.0, 0.45, 1.6), (2.76, 0.3, 2.2), (5.4, 0.12, 3.5)])


sfx = {}
sfx["whoosh"] = reverb(noise_sweep(0.7, 300, 4500, 0.55), 1.2, 0.25)
sfx["whoosh-soft"] = reverb(noise_sweep(1.0, 200, 2200, 0.6, 0.5, -0.5) * 0.7, 1.4, 0.3)

t = t_axis(0.18)
popm = np.sin(2 * np.pi * (520 * t - 700 * t ** 2)) * np.exp(-t * 32)
sfx["pop"] = reverb(pan(popm, 0), 0.8, 0.2)

tick = np.zeros(int(1.4 * SR))
tt = 0.0
gap = 0.09
while tt < 1.25:
    i = int(tt * SR)
    tl = t_axis(0.02)
    click = np.sin(2 * np.pi * 2400 * tl) * np.exp(-tl * 300)
    tick[i:i + len(click)] += click[: len(tick) - i]
    tt += gap
    gap = max(0.035, gap * 0.93)
sfx["tick"] = reverb(pan(tick * 0.6, 0), 0.6, 0.15)

sfx["chime"] = reverb(pan(bell_tone(hz(81), 2.5) + 0.6 * bell_tone(hz(86), 2.5), 0.15), 2.5, 0.45)

sh = np.zeros(int(2.5 * SR))
for i in range(28):
    m = [86, 88, 90, 93, 95, 98, 100, 102][i % 8]
    on = rng.uniform(0, 1.2)
    b = bell_tone(hz(m), 1.2, 4) * rng.uniform(0.2, 0.5)
    j = int(on * SR)
    sh[j:j + len(b)] += b[: len(sh) - j]
sfx["shimmer"] = reverb(np.stack([sh, np.roll(sh, 400)], axis=1), 2.5, 0.5)

sp = np.zeros(int(2.8 * SR))
for i, m in enumerate([74, 78, 81, 86, 90, 93, 98, 102]):
    b = bell_tone(hz(m), 1.5, 3) * 0.6
    j = int(i * 0.05 * SR)
    sp[j:j + len(b)] += b[: len(sp) - j]
burst = highpass(rng.standard_normal(len(sp)), 5000) * np.exp(-t_axis(2.8) * 3) * 0.25
sfx["sparkle"] = reverb(np.stack([sp + burst, np.roll(sp, 300) + burst], axis=1), 2.8, 0.5)

t = t_axis(2.2)
boom = np.sin(2 * np.pi * (58 * t - 6 * t ** 2)) * np.exp(-t * 2.2)
thud = lowpass(rng.standard_normal(len(t)), 400) * np.exp(-t * 18) * 0.8
sfx["impact"] = reverb(pan(boom + thud, 0), 2.5, 0.35)

t = t_axis(0.9)
rise_n = noise_sweep(0.9, 200, 7000, 0.97, 0, 0)
tone = np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, 0.9], [220, 880])) / SR) * np.interp(t, [0, 0.9], [0, 0.25])
sfx["riser"] = reverb(rise_n + pan(tone, 0), 1.0, 0.3)

# opening swell: soft reverse-air into a warm chord bloom
t = t_axis(4.0)
air_in = highpass(rng.standard_normal(len(t)), 3000) * np.interp(t, [0, 0.9, 1.4, 4], [0, 0.35, 0.05, 0])
bloom = sum(soft_tone(hz(m), 4.0, (1, 0.3), 0.004) for m in [62, 69, 74, 78]) * np.interp(t, [0, 0.7, 1.5, 4], [0, 0.08, 0.12, 0])
sfx["swell"] = reverb(pan(air_in + lowpass(bloom, 3000), 0), 3.0, 0.45)

for name, data in sfx.items():
    save(f"sfx/{name}.wav", data, peak=0.85)
