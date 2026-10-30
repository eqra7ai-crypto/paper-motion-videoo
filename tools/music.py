import numpy as np, wave
SR=44100; D=46.0; N=int(SR*D)
t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
def hz(m): return 440*2**((m-69)/12)
def env(n,a,r):
    e=np.ones(n); a=int(a*SR); r=int(r*SR)
    e[:a]=np.linspace(0,1,a); e[-r:]*=np.linspace(1,0,r); return e
def add(sig,t0,pan=0.5):
    global L,R
    i=int(t0*SR); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*(1-pan)*1.4; R[i:i+n]+=sig[:n]*pan*1.4
# pad chords (D drone with slow Hijaz-colored progression), 8s each
chords=[[50,57,62,66],[50,55,62,65],[48,55,60,64],[50,57,62,66],[46,53,58,62],[50,57,62,66]]
for k,ch in enumerate(chords):
    t0=k*8.0; dur=9.5; n=int(dur*SR); tt=np.arange(n)/SR
    for j,m in enumerate(ch):
        s=sum(np.sin(2*np.pi*hz(m)*h*tt+j)*a for h,a in [(1,1),(2,.35),(3,.12)])
        s*=env(n,2.5,3.5)*0.05
        s*=1+0.15*np.sin(2*np.pi*.18*tt+j)
        add(s,t0,0.25+0.5*(j/3))
# soft arpeggio pluck (D phrygian dominant), 2 notes per beat @ 72bpm
scale=[62,63,66,67,69,70,72,74]
rng=np.random.default_rng(5); step=60/72/2
for i in range(int(D/step)):
    t0=i*step
    if t0<2 or t0>41: continue
    m=scale[[0,2,4,3,5,4,2,1][i%8]]+(12 if (i//8)%3==2 else 0)
    n=int(1.6*SR); tt=np.arange(n)/SR
    s=(np.sin(2*np.pi*hz(m)*tt)+.4*np.sin(2*np.pi*hz(m)*2*tt))*np.exp(-tt*3.2)*0.028
    add(s,t0,0.3+0.4*((i%5)/4))
# bell chimes at scene changes + swell
for tc,m in [(10.6,86),(20.4,81),(20.6,93),(31.0,86),(37.7,81),(38.3,93),(41,98)]:
    n=int(3.5*SR); tt=np.arange(n)/SR
    s=sum(np.sin(2*np.pi*hz(m)*r*tt)*a*np.exp(-tt*d) for r,a,d in [(1,1,1.4),(2.76,.4,2.4),(5.4,.2,4)])*0.06
    add(s,tc,0.5)
# riser into the Kaaba reveal
n=int(1.6*SR); tt=np.arange(n)/SR
r=np.sin(2*np.pi*(200+700*(tt/1.6)**2)*tt)*(tt/1.6)**2*0.05; add(r,19.0,0.5)
# simple reverb
def rev(x):
    out=x.copy()
    for d,g in [(0.073,.35),(0.131,.28),(0.211,.2),(0.347,.14)]:
        k=int(d*SR); out[k:]+=x[:-k]*g
    return out
L=rev(L);R=rev(R)
fade=np.minimum(1,np.minimum(t/1.5,(D-t)/2.5)); L*=fade; R*=fade
m=max(abs(L).max(),abs(R).max()); L/=m;R/=m; L*=.8;R*=.8
a=(np.stack([L,R],1)*32767).astype('<i2')
with wave.open('out/music.wav','wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(a.tobytes())
print('ok')
