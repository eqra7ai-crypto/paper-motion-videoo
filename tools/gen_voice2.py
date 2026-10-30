"""Generate the nine vowelized Arabic lines with ElevenLabs (word-level timestamps),
lay them on the timeline, write out/voice/timeline.js and the mixed voice track."""
import base64, json, subprocess, sys, os

V = {'first': 'iP95p4xoKVk53GoZ742B', 'friend': 'TX3LPaxmHKxFdv7VOQHJ', 'narr': 'nPczCjzI2devNBz1zQrb'}
N = 'نُسُك'

# (id, voice, tag, [(screen word, spoken word), ...])
L = [
 (1, 'first', '[softly, wistful]', [('تدري؟','تَدري؟'),('أكثر','أَكثَر'),('أمنية','أُمنِيّة'),('أتمنى','أَتَمنّى'),('أحققها','أُحَقِّقها'),('هي','هي'),('إني','إنّي'),('أزور','أَزور'),('بيت','بَيتَ'),('الله','اللهِ'),('الحرام','الحَرام'),('وأعتمر...','وأَعتَمِر...'),('وأخذ','وأَخُذ'),('معي','مَعي'),('شخص','شَخص'),('غالي','غالي'),('على','على'),('قلبي','قَلبي')]),
 (2, 'friend', '[warm, friendly]', [('وليش','وَلِيش'),('ما','ما'),('تستغل','تَستَغِلّ'),('الفرصة؟','الفُرصة؟'),('تعرف','تَعرِف'),('تطبيق','تَطبيق'),(N+'؟',N+'؟')]),
 (3, 'friend', '[upbeat, clear]', [(N,N),('مو','مو'),('بس','بَسّ'),('يساعدك','يُساعِدك'),('في','في'),('رحلتك','رِحلَتِك'),('الإيمانية،','الإيمانِيّة،'),('تقدر','تَقدِر'),('تستفيد','تَستَفيد'),('من','مِن'),('خدماته','خَدَماتِه'),('مثل','مِثل'),('القرآن','القُرآنِ'),('الكريم،','الكَريم،'),('والأذكار،','والأَذكار،'),('وتحديد','وتَحديدِ'),('القبلة،','القِبلة،'),('والفنادق،','والفَنادِق،'),('وخدمات','وخَدَماتِ'),('الحج','الحَجِّ'),('والعمرة','والعُمرة')]),
 (4, 'friend', '[excited]', [('والأجمل','والأَجمَل'),('إن','إنّ'),('عندك','عِندَك'),('فرصة','فُرصة'),('تدخل','تَدخُل'),('السحب','السَّحب'),('وتفوز','وتَفوز'),('بعمرة','بِعُمرة'),('لك','لَك'),('ولشخص','ولِشَخص'),('تحبه!','تُحِبّه!')]),
 (5, 'narr', '[calm, majestic]', [('يمكن','يُمكِن'),('تكون','تَكون'),('رحلتك','رِحلَتَك'),('القادمة','القادِمة'),('إلى','إلى'),('أطهر','أَطهَرِ'),('بقاع','بِقاعِ'),('الأرض!','الأَرض!')]),
 (6, 'narr', '[calm, majestic]', [('مئة','مِئَةُ'),('رحلة','رِحلَةِ'),('عمرة...','عُمرة...'),('وعشرة','وعَشَرَةُ'),('آلاف','آلافِ'),('كرتون','كَرتونِ'),('ماء','ماءِ'),('زمزم','زَمزَم')]),
 (7, 'first', '[hopeful, excited]', [('يعني','يَعني'),('ممكن','مُمكِن'),('أحقق','أُحَقِّق'),('أمنيتي','أُمنِيَّتي'),('وأعتمر','وأَعتَمِر'),('مع','مَعَ'),('شخص','شَخص'),('أحبه؟','أُحِبّه؟')]),
 (8, 'friend', '[warm, encouraging]', [('أكيد','أَكيد'),('عندك','عِندَك'),('فرصة،','فُرصة،'),('حمّل','حَمِّل'),(N,N),('واغتنمها','واغتَنِمها'),('الآن!','الآن!')]),
 (9, 'narr', '[warm, inviting]', [('لا','لا'),('تؤجل','تُؤَجِّل'),('أمنية','أُمنِيَّةَ'),('العمر...','العُمر...'),('قد','قَد'),('تكون','تَكون'),('أقرب','أَقرَب'),('مما','مِمّا'),('تتخيل.','تَتَخَيَّل.'),('حمّل','حَمِّل'),('تطبيق','تَطبيق'),(N,N),('الآن،','الآن،'),('وسجّل','وسَجِّل'),('اسمك','اسمَك'),('وادخل','وادخُل'),('السحب','السَّحب'),('لتحظى','لِتَحظى'),('بفرصة','بِفُرصةِ'),('الفوز','الفَوزِ'),('بعمرة','بِعُمرة'),('لك','لَك'),('ولشخص','ولِشَخص'),('تحبه','تُحِبّه')]),
]

os.makedirs('out/voice', exist_ok=True)
only = [int(a) for a in sys.argv[1:]]
meta = {}
for n, voice, tag, words in L:
    mp3, js = f'out/voice/{n}.mp3', f'out/voice/{n}.json'
    if (not only or n in only) or not os.path.exists(js):
        text = tag + ' ' + ' '.join(sp for _, sp in words)
        body = json.dumps({'text': text, 'model_id': 'eleven_v4', 'language_code': 'ar',
                           'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}, ensure_ascii=False)
        r = subprocess.run(['curl', '-sS', '-m', '120', '-X', 'POST',
            f'https://api.elevenlabs.io/v1/text-to-speech/{V[voice]}/with-timestamps?output_format=mp3_44100_128',
            '-H', 'Content-Type: application/json', '-d', body, '-o', js, '-w', '%{http_code}'], capture_output=True, text=True)
        print(n, voice, 'HTTP', r.stdout, flush=True)
        d = json.load(open(js))
        if 'audio_base64' not in d:
            print(d); sys.exit(1)
        open(mp3, 'wb').write(base64.b64decode(d.pop('audio_base64')))
        json.dump(d, open(js, 'w'), ensure_ascii=False)
    d = json.load(open(js))
    al = d['alignment']; chars = al['characters']; st = al['character_start_times_seconds']; en = al['character_end_times_seconds']
    joined = ''.join(chars); p = joined.find(']') + 1 if joined.startswith('[') else 0
    wt = []
    for _, sp in words:
        i = joined.find(sp, p)
        if i < 0:
            print('WORD NOT FOUND', n, sp); sys.exit(1)
        wt.append([st[i], en[i + len(sp) - 1]]); p = i + len(sp)
    meta[n] = wt

# schedule (speech start of every line) from the real speech durations
dur = {n: m[-1][1] - m[0][0] for n, m in meta.items()}
s = {}; e = {}
def put(n, start): s[n] = start; e[n] = start + dur[n]
put(1, .7)
put(2, e[1] + .9)
put(3, e[2] + 2.2)
put(4, e[3] + .8)
put(5, e[4] + 1.3)
put(6, e[5] + .65)
put(7, e[6] + 2.3)
put(8, e[7] + 1.3)
put(9, e[8] + 2.0)
T = round(e[9] + 3.1, 2)
W = {n: [[round(s[n] + a - m[0][0], 3), round(s[n] + b - m[0][0], 3)] for a, b in m] for n, m in meta.items()}
screen = {n: [w for w, _ in words] for n, _, _, words in L}
tlj = {'s': {n: round(s[n], 3) for n in s}, 'e': {n: round(e[n], 3) for n in e}, 'w': W, 'screen': screen, 'T': T}
open('out/voice/timeline.js', 'w', encoding='utf8').write('window.TL=' + json.dumps(tlj, ensure_ascii=False) + ';')
print('durations', {n: round(v, 2) for n, v in dur.items()}, 'T', T)

# mix
cmd = ['ffmpeg', '-y', '-loglevel', 'error']
for n in range(1, 10): cmd += ['-i', f'out/voice/{n}.mp3']
fc = ''
for n in range(1, 10):
    off = s[n] - meta[n][0][0]
    if off >= 0: fc += f'[{n-1}:a]adelay={int(off*1000)}|{int(off*1000)}[a{n}];'
    else: fc += f'[{n-1}:a]atrim=start={-off},asetpts=PTS-STARTPTS[a{n}];'
fc += ''.join(f'[a{n}]' for n in range(1, 10)) + f'amix=inputs=9:normalize=0,apad=whole_dur={T},atrim=0:{T},loudnorm=I=-16:TP=-1.5:LRA=9[a]'
cmd += ['-filter_complex', fc, '-map', '[a]', '-ar', '48000', '-ac', '2', 'out/voiceover.wav']
subprocess.run(cmd, check=True)
print('mixed ok')
