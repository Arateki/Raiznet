// Botanical glyphs + minimal stroke icons. Use currentColor.
function GLeaf({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19c0-8 5-14 14-14 0 9-5 14-14 14z"/>
      <path d="M5 19c2-5 6-9 10-11"/>
    </svg>
  );
}
function GRoot({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 3v8"/>
      <path d="M12 11c-2 2-5 3-6 6"/>
      <path d="M12 11c2 2 5 3 6 6"/>
      <path d="M12 11v8"/>
      <path d="M9 21h6"/>
    </svg>
  );
}
function GSprout({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-7"/>
      <path d="M12 13c-3 0-6-2-6-6 4 0 6 2 6 6z"/>
      <path d="M12 13c3 0 6-2 6-6-4 0-6 2-6 6z"/>
    </svg>
  );
}
function GHex({ size = 16, fill = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/>
    </svg>
  );
}

// Minimal Lucide-ish stroke icons
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}
const I = {
  shield: <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/>,
  wifi:   <><path d="M2 9c5-5 15-5 20 0"/><path d="M5 13c4-4 10-4 14 0"/><path d="M8.5 16.5c2-2 5-2 7 0"/><circle cx="12" cy="20" r="0.5" fill="currentColor"/></>,
  cpu:    <><rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>,
  drop:   <path d="M12 3c0 0 7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>,
  sun:    <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.5 4.5l1.5 1.5M18 18l1.5 1.5M4.5 19.5l1.5-1.5M18 6l1.5-1.5"/></>,
  thermo: <><path d="M14 14V4a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0z"/></>,
  lock:   <><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  key:    <><circle cx="8" cy="14" r="4"/><path d="M11 12l9-9M16 7l3 3"/></>,
  network:<><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v3M7 18l4-7M17 18l-4-7"/></>,
  map:    <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
  filter: <path d="M3 4h18l-7 9v6l-4-2v-4z"/>,
  book:   <><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></>,
  user:   <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/></>,
  plus:   <><path d="M12 5v14M5 12h14"/></>,
  arrow:  <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  check:  <path d="M5 12l4 4 10-10"/>,
  eye:    <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M3 3l18 18"/><path d="M10 6c5-1 9 1 12 6 0 0-2 3-5 5"/><path d="M5 8c-2 2-3 4-3 4s4 7 10 7c2 0 3-.4 4-1"/></>,
  copy:   <><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>,
  power:  <><path d="M12 3v9"/><path d="M5 8a8 8 0 1 0 14 0"/></>,
  battery:<><rect x="3" y="8" width="16" height="8" rx="1"/><rect x="20" y="11" width="2" height="2"/></>,
  sliders:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/></>,
  globe:  <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18"/></>,
  signal: <><path d="M2 18h2v2H2zM7 14h2v6H7zM12 10h2v10h-2zM17 6h2v14h-2z"/></>,
  alert:  <><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></>,
  search: <><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></>,
  menu:   <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  x:      <><path d="M5 5l14 14M19 5L5 19"/></>,
  download:<><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></>,
};

window.GLeaf = GLeaf;
window.GRoot = GRoot;
window.GSprout = GSprout;
window.GHex = GHex;
window.Icon = Icon;
window.I = I;
