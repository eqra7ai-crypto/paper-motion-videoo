import numpy as np, wave
SR=44100; D=45; N=SR*D
t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(3)
def add(sig,at,pan=0.5,g=1.0):
    i=int(at*SR); sig=sig[:max(0,N-i)]
    L[i:i+len(sig)]+=sig*g*(1-pan); R[i:i+len(sig)]+=sig*g*pan
def env(n,a,r):
    e=np.ones(n); na=int(a*SR); nr=int(r*SR)
    e[:na]=np.linspace(0,1,na); e[-nr:]=np.linspace(1,0,nr); return e
hz=lambda m:440*2**((m-69)/12)
# وسادة وترية: Dm - Bb - F - C كل 5.6 ثانية
chords=[[50,57,62,65],[46,53,58,62],[53,57,60,65],[48,55,60,64]]
seg=5.625
for k in range(int(np.ceil(D/seg))):
    ch=chords[k%4]; n=int((seg+1.2)*SR); tt=np.arange(n)/SR
    pad=sum(np.sin(2*np.pi*hz(m)*tt+0.3*np.sin(2*np.pi*.2*tt))+0.4*np.sin(2*np.pi*hz(m)*2*tt) for m in ch)/len(ch)
    add(pad*env(n,1.4,1.6)*.16,k*seg,.5)
# أجراس هادئة (سلّم خماسي) على نبض 84
beat=60/84; pent=[74,77,79,81,84,86]
for i in range(int(D/beat)):
    at=i*beat
    if at<1.0 or (at>36 and i%2): continue
    m=pent[(i*3+i//4)%len(pent)]; n=int(1.8*SR); tt=np.arange(n)/SR
    b=(np.sin(2*np.pi*hz(m)*tt)+.3*np.sin(2*np.pi*hz(m)*2.01*tt))*np.exp(-tt*3.2)
    add(b*.07,at,.25+.5*((i*7)%5)/4)
# نبض ناعم من 25 إلى 36
for i in range(int(D/beat)):
    at=i*beat
    if 25<=at<36:
        n=int(.35*SR); tt=np.arange(n)/SR
        k=np.sin(2*np.pi*(55+60*np.exp(-tt*28))*tt)*np.exp(-tt*9); add(k*.35,at,.5)
def whoosh(at,dur,up=True,g=.3):
    n=int(dur*SR); x=rng.standard_normal(n); tt=np.linspace(0,1,n)
    # مرشّح مروحي بسيط: مزج ضوضاء مفلترة بمتوسط متحرك متغيّر
    out=np.zeros(n); y1=y2=0.0
    for j in range(n):
        a=.02+.45*(tt[j] if up else 1-tt[j])**2
        y1+=a*(x[j]-y1); y2+=a*(y1-y2); out[j]=y1-y2
    out/=np.abs(out).max()+1e-9
    e=np.sin(np.pi*tt)**1.5; add(out*e*g,at,.5)
whoosh(6.4,1.4,True,.5); whoosh(14.4,1.1,True,.4); whoosh(23.6,1.4,True,.6); whoosh(35.2,1.0,True,.5)
# دويّ الانفجار الذهبي عند 25
n=int(2.6*SR); tt=np.arange(n)/SR
boom=np.sin(2*np.pi*(48+80*np.exp(-tt*6))*tt)*np.exp(-tt*2.2)
add(boom*.6,24.9,.5)
for m in (86,91,93,98):
    nn=int(2.4*SR); t2=np.arange(nn)/SR
    add(np.sin(2*np.pi*hz(m)*t2)*np.exp(-t2*2.5)*.08,24.95+ (m-86)*.05,.5)
# نغمة ختام عند 36
for j,m in enumerate((74,81,86,93)):
    nn=int(3*SR); t2=np.arange(nn)/SR
    add((np.sin(2*np.pi*hz(m)*t2)+.25*np.sin(2*np.pi*hz(m)*3*t2))*np.exp(-t2*1.6)*.1,36.0+j*.12,.5)
# تلاشٍ في البداية والنهاية
f=np.ones(N); f[:SR]=np.linspace(0,1,SR); f[-int(1.5*SR):]=np.linspace(1,0,int(1.5*SR))
L*=f; R*=f; m=max(np.abs(L).max(),np.abs(R).max()); L/=m; R/=m
st=(np.stack([L,R],1)*.85*32767).astype('<i2')
w=wave.open('out/music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok')
