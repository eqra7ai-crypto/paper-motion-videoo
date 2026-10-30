from PIL import Image
O='assets/orig/'; A='assets/'
def c(src,box,dst):
    Image.open(O+src).convert('RGB').crop(box).save(A+dst,quality=95)
c('01_photo.jpg',(0,0,941,1672),'photo.jpg')
c('04_rawdah.jpg',(272,197,585,862),'rawdah.jpg')
c('02_ai_prayer.jpg',(163,478,472,1143),'prayer.jpg')
c('06_quran.jpg',(190,232,500,897),'quran.jpg')
c('07_ai.jpg',(160,500,625,940),'ai.jpg')
c('03_cta_poster.jpg',(425,246,722,502),'wordmark.jpg')
c('03_cta_poster.jpg',(425,599,717,1193),'phone3.jpg')
c('03_cta_poster.jpg',(348,1296,794,1378),'badges.jpg')
c('08_app_hand.jpg',(70,1285,435,1385),'logos.jpg')
c('09_contest.jpg',(154,707,973,1342),'box.jpg')
c('10_phone_icons.jpg',(0,180,1144,1340),'phone10.jpg')
