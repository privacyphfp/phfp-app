import {
  IconHandStop,
  IconRainbow,
  IconHeart,
  IconDiamond,
  IconShieldCheck,
  IconFeather,
  IconCross,
  IconFlower,
  IconCircleDot,
  IconEye,
  IconBriefcase,
  IconCoin,
  IconCompass,
} from '@tabler/icons-react';

// Font Awesome Free "hands-praying" (CC BY 4.0) — no equivalent in the
// Tabler set, so this one's a raw path instead of a component import.
function PrayingHandsIcon({ size = 16, className }) {
  return (
    <svg viewBox="0 0 640 512" width={size} height={size} fill="currentColor" className={className} aria-hidden>
      <path d="M351.2 4.8c3.2-2 6.6-3.3 10-4.1c4.7-1 9.6-.9 14.1 .1c7.7 1.8 14.8 6.5 19.4 13.6L514.6 194.2c8.8 13.1 13.4 28.6 13.4 44.4v73.5c0 6.9 4.4 13 10.9 15.2l79.2 26.4C631.2 358 640 370.2 640 384v96c0 9.9-4.6 19.3-12.5 25.4s-18.1 8.1-27.7 5.5L431 465.9c-56-14.9-95-65.7-95-123.7V224c0-17.7 14.3-32 32-32s32 14.3 32 32v80c0 8.8 7.2 16 16 16s16-7.2 16-16V219.1c0-7-1.8-13.8-5.3-19.8L340.3 48.1c-1.7-3-2.9-6.1-3.6-9.3c-1-4.7-1-9.6 .1-14.1c1.9-8 6.8-15.2 14.3-19.9zm-62.4 0c7.5 4.6 12.4 11.9 14.3 19.9c1.1 4.6 1.2 9.4 .1 14.1c-.7 3.2-1.9 6.3-3.6 9.3L213.3 199.3c-3.5 6-5.3 12.9-5.3 19.8V304c0 8.8 7.2 16 16 16s16-7.2 16-16V224c0-17.7 14.3-32 32-32s32 14.3 32 32V342.3c0 58-39 108.7-95 123.7l-168.7 45c-9.6 2.6-19.9 .5-27.7-5.5S0 490 0 480V384c0-13.8 8.8-26 21.9-30.4l79.2-26.4c6.5-2.2 10.9-8.3 10.9-15.2V238.5c0-15.8 4.7-31.2 13.4-44.4L245.2 14.5c4.6-7.1 11.7-11.8 19.4-13.6c4.6-1.1 9.4-1.2 14.1-.1c3.5 .8 6.9 2.1 10 4.1z" />
    </svg>
  );
}

// Roots above, canopy below — the "Inner Teachings" foundational courses
// are meant to nourish from a higher source down, echoing the esoteric
// inverted-tree image the org uses.
function InvertedTreeIcon({ size = 16, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <g transform="rotate(180 12 12)">
        <g fill="currentColor">
          <circle cx="9" cy="8.5" r="4" />
          <circle cx="15" cy="8.5" r="4" />
          <circle cx="12" cy="6.5" r="4.5" />
        </g>
        <path d="M12 12 L12 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M12 18 L9 21" />
          <path d="M12 18 L15 21" />
          <path d="M12 18 L12 22" />
        </g>
      </g>
    </svg>
  );
}

const MEDITATOR_BODY = (
  <>
    <circle cx="12" cy="12.3" r="2.3" />
    <path d="M9.5 16.5 Q12 15.3 14.5 16.5" />
    <path d="M9.5 16.5 Q8 17.3 7.3 19.5 L7 22.5" />
    <path d="M14.5 16.5 Q16 17.3 16.7 19.5 L17 22.5" />
    <path d="M7 22.5 Q7 25 10 25.2 Q12 24 14 25.2 Q17 25 17 22.5" />
  </>
);

// Radiance above the head grows with each Arhatic Yoga level: 3 rays for
// Prep, 5 for Level 1, 7 for Level 2.
const RAYS_BY_COUNT = {
  3: ['M12 12 L12 5', 'M12 12 L7 7', 'M12 12 L17 7'],
  5: ['M12 12 L12 4', 'M12 12 L7 6', 'M12 12 L17 6', 'M12 12 L4 10', 'M12 12 L20 10'],
  7: [
    'M12 12 L12 3',
    'M12 12 L8 4.5',
    'M12 12 L16 4.5',
    'M12 12 L5 7.5',
    'M12 12 L19 7.5',
    'M12 12 L3 11',
    'M12 12 L21 11',
  ],
};

function MeditatorIcon({ rays, size = 16, className }) {
  return (
    <svg
      viewBox="0 0 24 27"
      width={size}
      height={(size * 27) / 24}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {RAYS_BY_COUNT[rays].map((d) => (
        <path key={d} d={d} strokeWidth="1.6" />
      ))}
      {MEDITATOR_BODY}
    </svg>
  );
}

const ICONS_BY_CODE = {
  BPH: IconHandStop,
  APH: IconRainbow,
  PSY: IconHeart,
  PCH: IconDiamond,
  PSD: IconShieldCheck,
  AOHS: IconFeather,
  ICR: IconCross,
  ITH: IconFlower,
  ITB: IconCircleDot,
  OMPH: IconFlower,
  SEM: InvertedTreeIcon,
  MLP: PrayingHandsIcon,
  HC: IconEye,
  SBM: IconBriefcase,
  KRIYA: IconCoin,
  PFS: IconCompass,
  AYP: (props) => <MeditatorIcon rays={3} {...props} />,
  AY1: (props) => <MeditatorIcon rays={5} {...props} />,
  AY2: (props) => <MeditatorIcon rays={7} {...props} />,
};

export default function CourseIcon({ code, size = 16, className }) {
  const Icon = ICONS_BY_CODE[code];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
