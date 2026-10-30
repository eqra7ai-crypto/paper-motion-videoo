import React from 'react';

type P = {size?: number; color?: string; stroke?: number};

const S: React.FC<P & {children: React.ReactNode}> = ({size = 40, color = 'currentColor', stroke = 2, children}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const IconPlane: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M2.5 13.5 21 6.5c.8-.3 1.4.6.8 1.2L16 13l-1 7-2.5-5.5L8 16l-1.5 3L5 15.5l-2.5-2Z" />
  </S>
);
export const IconBed: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M3 19V6M3 15h18M21 19v-6a3 3 0 0 0-3-3h-7v5" />
    <rect x="5" y="10.5" width="4" height="3" rx="1.2" />
  </S>
);
export const IconCalendar: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="m9 15 2 2 4-4" />
  </S>
);
export const IconKaaba: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 3 20 7v10l-8 4-8-4V7l8-4Z" />
    <path d="M4 7l8 4 8-4M12 11v10M4 10.5l8 4 8-4" />
  </S>
);
export const IconDome: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M5 20v-6a7 7 0 0 1 14 0v6M3 20h18M12 4V2M9 20v-4a3 3 0 0 1 6 0v4" />
  </S>
);
export const IconBook: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5Z" />
    <path d="M12 6v14" />
  </S>
);
export const IconCheck: React.FC<P> = (p) => (
  <S {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </S>
);
export const IconUsers: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.2 3.2 0 0 1 0 6.3M21 20a6 6 0 0 0-4-5.6" />
  </S>
);
export const IconPin: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </S>
);
export const IconDoc: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M7 3h7l5 5v13H7Z" />
    <path d="M14 3v5h5M10 13h6M10 17h6" />
  </S>
);
export const IconStar: React.FC<{size?: number; color?: string}> = ({size = 20, color = '#E2A93B'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill={color} d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8Z" />
  </svg>
);
export const IconGift: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-4-5.5-1.5S10 8 12 8Zm0 0c1.5-3 5-4 5.5-1.5S14 8 12 8Z" />
  </S>
);
export const AppleGlyph: React.FC<{size?: number; color?: string}> = ({size = 40, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={color}
      d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4Z"
    />
  </svg>
);
export const PlayGlyph: React.FC<{size?: number}> = ({size = 40}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#34A853" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.7-.6-1.2V3.5c0-.5.2-1 .6-1.2Z" />
    <path fill="#FBBC04" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2Z" />
    <path fill="#4285F4" d="M16.7 15.3 13.4 12l-9.8 9.7c.4.2.9.2 1.4-.1Z" />
    <path fill="#EA4335" d="M16.7 8.7 5 2.4c-.5-.3-1-.3-1.4-.1l9.8 9.7Z" />
  </svg>
);
