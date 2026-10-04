/* Inline SVG icon set — stroke-based, inherits currentColor. */
const I = (paths, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  bolt: I('<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2z"/>'),
  offline: I('<path d="M2 2l20 20"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M12 20h.01"/>'),
  printer: I('<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>'),
  device: I('<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M10 18.5h4"/>'),
  devices: I('<rect x="2" y="4" width="13" height="10" rx="1.5"/><path d="M5 18h7"/><rect x="17" y="9" width="5" height="11" rx="1.2"/><path d="M8.5 14v4"/>'),
  backup: I('<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.1 8-2.8"/>'),
  key: I('<circle cx="8" cy="15" r="4.5"/><path d="M11.1 11.9 20 3"/><path d="m16 7 3 3"/><path d="m13.5 9.5 2 2"/>'),
  update: I('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>'),
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  wifi: I('<path d="M2 2l20 20"/><path d="M16.7 11.3a7 7 0 0 0-9.4 0"/><path d="M19.5 8.5a11 11 0 0 0-3-1.9"/><path d="M12 19h.01"/>'),
  cloud: I('<path d="M17.5 19a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6.2 8.6 4.5 4.5 0 0 0 7 17.5h10.5z"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  print: I('<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>'),
  tag: I('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M12 11v5"/>'),
  shield: I('<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>'),
  cart: I('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.5l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20.5 7H6"/>'),
  receipt: I('<path d="M4 2h16v20l-2.7-1.6L14.6 22l-2.6-1.6L9.4 22l-2.7-1.6L4 22V2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>'),
  database: I('<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.1 8-2.8"/>'),
  windows: I('<path d="M3 5.5 10.5 4.4v7.1H3z"/><path d="M3 18.5l7.5 1.1v-7.1H3z"/>'),
  arrow: I('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  external: I('<path d="M14 3h7v7"/><path d="M21 3 11 13"/><path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>'),
  calendar: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 9h18"/>'),
  download: I('<path d="M12 3v12"/><path d="m6 11 6 6 6-6"/><path d="M4 21h16"/>'),
  monitor: I('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>'),
  alert: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16h.01"/>'),
  plus: I('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  phone: I('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>'),
};

export const icon = (name, cls = '') =>
  `<span class="${cls}" aria-hidden="true" style="display:inline-flex">${ICONS[name] || ICONS.info}</span>`;
