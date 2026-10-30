import sys, glob
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+'/f_*.png')); cols=int(sys.argv[3]); w=int(sys.argv[4])
ims=[Image.open(f).convert('RGB') for f in fs]; h=int(w*1920/1080)
rows=(len(ims)+cols-1)//cols
sh=Image.new('RGB',(cols*w,rows*h),'#444')
for i,im in enumerate(ims): sh.paste(im.resize((w,h)),((i%cols)*w,(i//cols)*h))
sh.save(sys.argv[2]); print(len(ims),'frames')
