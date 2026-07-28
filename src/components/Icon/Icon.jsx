import './Icon.css';

const paths = {
  home: <path d="m3 11 9-7 9 7v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  heart: <path d="M12 21C5 16 3 12 3 8.5 3 6 5 4 7.5 4c1.7 0 3 .8 4.5 2.5C13.5 4.8 14.8 4 16.5 4 19 4 21 6 21 8.5 21 12 19 16 12 21Z" />,
  chart: <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />,
  check: <><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  pin: <><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  message: <><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1Z" /><path d="M8 10h8M8 14h5" /></>,
  phone: <path d="M5 4h3l1.5 4.5L7 11a13 13 0 0 0 6 6l2.5-2.5L20 16v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="m15 19-7-7 7-7" />,
  shield: <><path d="m12 3 7 3v5c0 4.7-3 8.2-7 10-4-1.8-7-5.3-7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  upload: <><path d="M12 16V3" /><path d="m7 8 5-5 5 5" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
  room: <><path d="M3 19V9h18v10" /><path d="M3 15h18" /><path d="M6 9V5h4v4" /><path d="M3 19v2M21 19v2" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  area: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 4v4H4M16 20v-4h4" /></>,
  floor: <><path d="M4 7h16v4H4zM4 13h16v4H4z" /><path d="M7 7V4M17 20v-3" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
};

export default function Icon({ name, size = 18, className = '' }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name]}</svg>;
}
