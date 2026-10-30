/*
 * App screens rebuilt in vector from the client's reference screenshots
 * (home, Umrah booking, accommodation, trip summary). Content mirrors what
 * is visible in those screenshots; swap for real UI captures when available.
 */
import React from 'react';
import {interpolate} from 'remotion';
import {clamp, easeOut, pop, rise} from '../anim';
import {C, FONT_BODY, FONT_HEAD} from '../theme';
import {
  IconBed,
  IconBook,
  IconCalendar,
  IconCheck,
  IconDome,
  IconDoc,
  IconKaaba,
  IconPin,
  IconPlane,
  IconStar,
  IconUsers,
} from './Icons';
import {NusukLogo} from './NusukLogo';

const base: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  direction: 'rtl',
  fontFamily: FONT_BODY,
  color: C.ink,
};

const slideUp = (f: number, s: number, d = 18) => {
  const t = rise(f, s, d);
  return {opacity: t, transform: `translateY(${(1 - t) * 40}px)`};
};

const StatusBar: React.FC<{dark?: boolean}> = ({dark}) => (
  <div
    style={{
      position: 'absolute',
      top: 22,
      left: 40,
      right: 40,
      display: 'flex',
      justifyContent: 'space-between',
      direction: 'ltr',
      fontSize: 22,
      fontWeight: 600,
      color: dark ? '#fff' : C.ink,
      zIndex: 10,
    }}
  >
    <span>2:22</span>
    <span style={{letterSpacing: 4}}>▮▮▮ ◔</span>
  </div>
);

const Chip: React.FC<{children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties}> = ({
  children,
  color = C.green,
  bg = 'rgba(62,142,106,0.12)',
  style,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 14px',
      borderRadius: 30,
      background: bg,
      color,
      fontSize: 18,
      fontWeight: 600,
      ...style,
    }}
  >
    {children}
  </span>
);

const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 30,
      padding: 24,
      boxShadow: '0 10px 30px rgba(80,60,20,0.08), 0 1px 0 rgba(0,0,0,0.03)',
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---------------------------------------------------------------- Splash */
export const SplashScreen: React.FC<{f: number}> = ({f}) => {
  const draw = rise(f, 4, 34);
  const word = rise(f, 26, 18);
  const tag = rise(f, 40, 18);
  return (
    <div
      style={{
        ...base,
        background: 'linear-gradient(180deg,#FFFBF3 0%,#F6E9CF 60%,#EBD3A3 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
      }}
    >
      <div style={{transform: `scale(${0.85 + draw * 0.15})`}}>
        <NusukLogo size={130} draw={draw} wordOpacity={word} />
      </div>
      <div style={{fontFamily: FONT_HEAD, fontSize: 30, color: C.goldDeep, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)`}}>
        رفيقك في رحلتك الإيمانية
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ Home */
export const HomeScreen: React.FC<{f: number; highlight?: number}> = ({f, highlight = -1}) => {
  const services = [
    {label: 'العمرة', icon: <IconKaaba size={40} color={C.goldDeep} />},
    {label: 'الحج', icon: <IconDome size={40} color={C.goldDeep} />},
    {label: 'الروضة', icon: <IconDome size={40} color={C.green} />},
    {label: 'القرآن', icon: <IconBook size={40} color={C.goldDeep} />},
  ];
  const arc = rise(f, 8, 40);
  return (
    <div style={{...base, background: '#F7F3EC'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          height: 560,
          background: 'linear-gradient(180deg,#3A3157 0%,#6E5F93 55%,#B9A7D6 100%)',
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
        }}
      />
      <StatusBar dark />
      <div style={{position: 'absolute', top: 92, right: 36, left: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', ...slideUp(f, 2)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 58, height: 58, borderRadius: 29, background: 'linear-gradient(135deg,#E9D3A1,#9A7533)', border: '3px solid rgba(255,255,255,0.7)'}} />
          <div>
            <div style={{fontSize: 18, opacity: 0.8}}>السلام عليكم</div>
            <div style={{fontSize: 24, fontWeight: 700}}>محفظة نُسك</div>
          </div>
        </div>
        <IconCalendar size={34} color="#fff" />
      </div>
      {/* prayer arc */}
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', color: '#fff'}}>
        <svg width={420} height={160} viewBox="0 0 420 160" style={{display: 'block', margin: '0 auto'}}>
          <path d="M20 150 A190 140 0 0 1 400 150" stroke="rgba(255,255,255,0.25)" strokeWidth={3} fill="none" />
          <path
            d="M20 150 A190 140 0 0 1 400 150"
            stroke={C.goldLight}
            strokeWidth={4}
            fill="none"
            strokeDasharray={600}
            strokeDashoffset={600 - arc * 260}
          />
          <circle cx={210 - 190 * Math.cos(arc * 1.36)} cy={150 - 140 * Math.sin(arc * 1.36)} r={11} fill={C.gold} />
        </svg>
        <div style={{fontSize: 20, color: 'rgba(255,255,255,0.85)', marginTop: -40, ...slideUp(f, 10)}}>28 ربيع الأول 1447</div>
        <div style={{fontFamily: FONT_HEAD, fontSize: 64, fontWeight: 700, ...slideUp(f, 14)}}>الفجر 4:25 ص</div>
      </div>
      {/* services */}
      <div style={{position: 'absolute', top: 470, left: 28, right: 28, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14}}>
        {services.map((s, i) => {
          const p = pop(f, 18 + i * 4);
          const hl = highlight === i;
          return (
            <div
              key={i}
              style={{
                background: hl ? '#FFF6E2' : '#fff',
                border: hl ? `2px solid ${C.gold}` : '2px solid transparent',
                borderRadius: 26,
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 10px 24px rgba(40,30,70,0.12)',
                transform: `scale(${p * (hl ? 1.06 : 1)})`,
                opacity: p,
              }}
            >
              {s.icon}
              <span style={{fontSize: 21, fontWeight: 600}}>{s.label}</span>
            </div>
          );
        })}
      </div>
      {/* upcoming */}
      <Card style={{position: 'absolute', top: 650, left: 28, right: 28, ...slideUp(f, 30)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontSize: 20, color: C.muted}}>زيارة الروضة الشريفة</div>
            <div style={{fontSize: 26, fontWeight: 700, marginTop: 4}}>اليوم، 08:00 مساءً</div>
          </div>
          <Chip>
            <IconCheck size={18} color={C.green} stroke={3} /> مؤكد
          </Chip>
        </div>
      </Card>
      <Card style={{position: 'absolute', top: 820, left: 28, right: 28, ...slideUp(f, 36)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <IconBook size={40} color={C.goldDeep} />
          <div>
            <div style={{fontSize: 24, fontWeight: 700}}>القرآن الكريم</div>
            <div style={{fontSize: 18, color: C.muted}}>سورة الفاتحة · تأملات قصيرة</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ---------------------------------------------------------- Umrah booking */
export const BookingScreen: React.FC<{f: number}> = ({f}) => {
  const days = Array.from({length: 30}, (_, i) => i + 1);
  const selFrom = 22;
  const selTo = 28;
  const sweep = interpolate(f, [16, 40], [selFrom - 1, selTo], {...clamp, easing: easeOut});
  const btn = rise(f, 44, 14);
  const press = interpolate(f, [62, 66, 72], [1, 0.94, 1], clamp);
  return (
    <div style={{...base, background: '#F7F3EC'}}>
      <StatusBar />
      <div style={{position: 'absolute', top: 90, right: 36, left: 36, ...slideUp(f, 0)}}>
        <div style={{fontSize: 20, color: C.muted}}>العمرة</div>
        <div style={{fontFamily: FONT_HEAD, fontSize: 44, fontWeight: 700}}>حجز موعد عمرة</div>
      </div>
      <Card style={{position: 'absolute', top: 220, left: 28, right: 28, ...slideUp(f, 4)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontSize: 18, color: C.muted}}>المغادرة</div>
            <div style={{fontSize: 26, fontWeight: 700}}>22 يونيو 2025</div>
          </div>
          <div style={{fontSize: 30, color: C.gold}}>←</div>
          <div>
            <div style={{fontSize: 18, color: C.muted}}>العودة</div>
            <div style={{fontSize: 26, fontWeight: 700}}>28 يونيو 2025</div>
          </div>
        </div>
      </Card>
      <Card style={{position: 'absolute', top: 380, left: 28, right: 28, ...slideUp(f, 8)}}>
        <div style={{fontSize: 22, fontWeight: 700, marginBottom: 16}}>يونيو 2025</div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', rowGap: 10, textAlign: 'center'}}>
          {days.map((d) => {
            const inRange = d >= selFrom && d <= Math.floor(sweep);
            const edge = inRange && (d === selFrom || d === Math.floor(sweep));
            return (
              <div
                key={d}
                style={{
                  height: 50,
                  lineHeight: '50px',
                  fontSize: 20,
                  fontWeight: inRange ? 700 : 500,
                  borderRadius: 25,
                  color: edge ? '#fff' : inRange ? C.goldDeep : C.ink,
                  background: edge ? C.gold : inRange ? '#F5E7C8' : 'transparent',
                }}
              >
                {d}
              </div>
            );
          })}
        </div>
      </Card>
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 28,
          right: 28,
          height: 92,
          borderRadius: 46,
          background: C.ink,
          color: '#fff',
          fontSize: 28,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          opacity: btn,
          transform: `translateY(${(1 - btn) * 40}px) scale(${press})`,
        }}
      >
        تأكيد الحجز
      </div>
    </div>
  );
};

/* --------------------------------------------------------- Accommodation */
const HotelPhoto: React.FC<{tone?: number}> = ({tone = 0}) => (
  <div
    style={{
      height: 210,
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      background: tone
        ? 'linear-gradient(180deg,#B9CFE6 0%,#F1E1C2 100%)'
        : 'linear-gradient(180deg,#8FB2DA 0%,#E9D7B5 100%)',
    }}
  >
    {/* clock-tower silhouette */}
    <svg width="100%" height="100%" viewBox="0 0 400 210" preserveAspectRatio="xMidYMax slice" style={{position: 'absolute', bottom: 0}}>
      <g fill="rgba(70,58,40,0.55)">
        <rect x="170" y="40" width="60" height="170" />
        <rect x="160" y="80" width="80" height="130" />
        <path d="M185 40 200 5 215 40Z" />
        <rect x="40" y="130" width="80" height="80" />
        <rect x="280" y="120" width="90" height="90" />
      </g>
      <circle cx="200" cy="70" r="16" fill="#F7E4B5" />
    </svg>
  </div>
);

export const StayScreen: React.FC<{f: number}> = ({f}) => {
  const stamp = pop(f, 46, 10, 0.6);
  const hotels = [
    {name: 'فندق الإقامة', dist: '400 متر من الحرم المكي', price: '3,600', rate: '4.5', reviews: '1522'},
    {name: 'فندق برج الساعة', dist: '524 متر من الحرم المكي', price: '2,415', rate: '5', reviews: '234'},
  ];
  return (
    <div style={{...base, background: '#F7F3EC'}}>
      <StatusBar />
      <div style={{position: 'absolute', top: 90, right: 36, left: 36, ...slideUp(f, 0)}}>
        <div style={{fontSize: 20, color: C.muted}}>الإقامة في مكة المكرمة</div>
        <div style={{fontFamily: FONT_HEAD, fontSize: 44, fontWeight: 700}}>مكان الإقامة</div>
      </div>
      {hotels.map((h, i) => (
        <Card key={i} style={{position: 'absolute', top: 220 + i * 410, left: 28, right: 28, padding: 18, ...slideUp(f, 6 + i * 8)}}>
          <HotelPhoto tone={i} />
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'flex-start'}}>
            <div>
              <div style={{fontSize: 26, fontWeight: 700}}>{h.name}</div>
              <div style={{fontSize: 18, color: C.muted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4}}>
                <IconPin size={20} color={C.gold} /> {h.dist}
              </div>
              <div style={{fontSize: 18, display: 'flex', alignItems: 'center', gap: 6, marginTop: 6}}>
                <IconStar size={20} /> {h.rate} <span style={{color: C.muted}}>({h.reviews} تقييم)</span>
              </div>
            </div>
            <div style={{textAlign: 'left'}}>
              <div style={{fontSize: 30, fontWeight: 700}}>{h.price}</div>
              <div style={{fontSize: 16, color: C.muted}}>ر.س · 3 ليالٍ</div>
            </div>
          </div>
          {i === 0 && (
            <div
              style={{
                position: 'absolute',
                top: 34,
                left: 34,
                transform: `scale(${stamp}) rotate(${(1 - stamp) * -20}deg)`,
                opacity: Math.min(1, stamp * 1.4),
              }}
            >
              <Chip bg="#fff" style={{boxShadow: '0 8px 20px rgba(0,0,0,0.15)', fontSize: 20}}>
                <IconCheck size={20} color={C.green} stroke={3} /> تم الحجز
              </Chip>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

/* ----------------------------------------------------------- Trip summary */
export const TripScreen: React.FC<{f: number}> = ({f}) => {
  const items = [
    {icon: <IconPlane size={34} color={C.goldDeep} />, title: 'الخطوط الجوية', sub: 'الرياض ← جدة', right: '3,600 ر.س'},
    {icon: <IconBed size={34} color={C.goldDeep} />, title: 'فندق الإقامة', sub: 'جناح ملكي · 3 نزلاء', right: '3,600 ر.س'},
    {icon: <IconUsers size={34} color={C.goldDeep} />, title: 'أنت و3 أعضاء', sub: 'تم تقديم جميع الوثائق', right: ''},
    {icon: <IconDoc size={34} color={C.goldDeep} />, title: 'تصريح العمرة', sub: '22 يونيو · 10:30 ص', right: ''},
  ];
  const prog = interpolate(f, [10, 70], [0.1, 1], {...clamp, easing: easeOut});
  return (
    <div style={{...base, background: '#F7F3EC'}}>
      <StatusBar />
      <div style={{position: 'absolute', top: 90, right: 36, left: 36, ...slideUp(f, 0)}}>
        <div style={{fontSize: 20, color: C.muted}}>22 يونيو ← 28 يونيو 2025</div>
        <div style={{fontFamily: FONT_HEAD, fontSize: 44, fontWeight: 700}}>رحلتي</div>
        <div style={{height: 10, borderRadius: 5, background: '#E8DFCF', marginTop: 18, overflow: 'hidden'}}>
          <div style={{width: `${prog * 100}%`, height: '100%', background: 'linear-gradient(90deg,#9A7533,#E9D3A1)', borderRadius: 5, marginRight: 0}} />
        </div>
      </div>
      {items.map((it, i) => {
        const s = 8 + i * 12;
        const ok = pop(f, s + 14, 11);
        return (
          <Card key={i} style={{position: 'absolute', top: 270 + i * 180, left: 28, right: 28, ...slideUp(f, s)}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{width: 70, height: 70, borderRadius: 22, background: '#FBF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {it.icon}
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 25, fontWeight: 700}}>{it.title}</div>
                <div style={{fontSize: 18, color: C.muted}}>{it.sub}</div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6}}>
                {it.right && <span style={{fontSize: 20, fontWeight: 700}}>{it.right}</span>}
                <span style={{transform: `scale(${ok})`, opacity: ok}}>
                  <Chip>
                    <IconCheck size={16} color={C.green} stroke={3} /> تم
                  </Chip>
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
