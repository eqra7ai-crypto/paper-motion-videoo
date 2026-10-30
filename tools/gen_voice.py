import json, subprocess, sys
V={'first':'iP95p4xoKVk53GoZ742B','friend':'TX3LPaxmHKxFdv7VOQHJ','narr':'nPczCjzI2devNBz1zQrb'}
L=[
(1,'first','[softly, wistful] تدري؟ أكثر أمنية أتمنى أحققها هي إني أزور بيت الله الحرام وأعتمر... وأخذ معي شخص غالي على قلبي'),
(2,'friend','[warm, friendly] وليش ما تستغل الفرصة؟ تعرف تطبيق نسك؟'),
(3,'friend','[upbeat, clear] نسك مو بس يساعدك في رحلتك الإيمانية، تقدر تستفيد من خدماته مثل القرآن الكريم، والأذكار، وتحديد القبلة، والفنادق، وخدمات الحج والعمرة'),
(4,'friend','[excited] والأجمل إن عندك فرصة تدخل السحب وتفوز بعمرة لك ولشخص تحبه!'),
(5,'narr','[calm, majestic] يمكن تكون رحلتك القادمة إلى أطهر بقاع الأرض!'),
(6,'narr','[calm, majestic] مئة رحلة عمرة... وعشرة آلاف كرتون ماء زمزم'),
(7,'first','[hopeful, excited] يعني ممكن أحقق أمنيتي وأعتمر مع شخص أحبه؟'),
(8,'friend','[warm, encouraging] أكيد عندك فرصة، حمّل نسك واغتنمها الآن!'),
(9,'narr','[warm, inviting] لا تؤجل أمنية العمر... قد تكون أقرب مما تتخيل. حمّل تطبيق نسك الآن، وسجّل اسمك وادخل السحب لتحظى بفرصة الفوز بعمرة لك ولشخص تحبه'),
]
only=[int(a) for a in sys.argv[1:]]
for n,w,t in L:
    if only and n not in only: continue
    body=json.dumps({'text':t,'model_id':'eleven_v4','language_code':'ar','voice_settings':{'stability':0.5,'similarity_boost':0.75}},ensure_ascii=False)
    out=f'out/voice/{n}.mp3'
    r=subprocess.run(['curl','-sS','-m','90','-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{V[w]}?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',body,'-o',out,'-w','%{http_code}'],capture_output=True,text=True)
    d=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out],capture_output=True,text=True).stdout.strip() if r.stdout=='200' else '-'
    print(n,w,'HTTP',r.stdout,'dur',d,flush=True)
