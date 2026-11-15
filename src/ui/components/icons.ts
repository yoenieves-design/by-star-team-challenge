import { html, svg } from 'lit-html';

const paths = {
  star: svg`<path d="M12 2.5 14.5 9.5 21.5 12 14.5 14.5 12 21.5 9.5 14.5 2.5 12 9.5 9.5Z"/><path d="M18.5 3v5M16 5.5h5"/>`,
  activity: svg`<path d="M3 12h4l3-7 4 14 3-7h4"/>`,
  assist: svg`<circle cx="12" cy="12" r="9"/><path d="M12 8v8m-4-4h8"/>`,
  users: svg`<circle cx="9" cy="8" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2m0-16a3 3 0 0 1 0 6m3 4a5 5 0 0 1 3 4v2"/>`,
  help: svg`<circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.9 2.9 0 1 1 4.6 2.3c-1.4.8-1.8 1.2-1.8 2.7m0 3h.01"/>`,
  moon: svg`<path d="M20.5 15A8.8 8.8 0 0 1 9 3.5 9 9 0 1 0 20.5 15Z"/>`,
  link: svg`<path d="M10 13a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.7l-1.7 1.8m2.7 4.9a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.7l1.7-1.8"/>`,
  play: svg`<path d="m8 5 12 7-12 7Z" fill="currentColor" stroke="none"/>`,
  pause: svg`<path d="M9 5v14m6-14v14" stroke-width="3"/>`,
  next: svg`<path d="m6 6 9 6-9 6Z" fill="currentColor" stroke="none"/><path d="M18 6v12"/>`,
  restart: svg`<path d="M3 11a9 9 0 1 1 2.7 7.4M3 5v6h6"/>`,
  arrow: svg`<path d="M4 12h15m-6-6 6 6-6 6"/>`,
  external: svg`<path d="M13 5h6v6m0-6-9 9m7-1v6H5V7h6"/>`,
  warning: svg`<path d="M10.4 4.5 2.8 18a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L13.6 4.5a1.8 1.8 0 0 0-3.2 0Z"/><path d="M12 9v4m0 3h.01"/>`,
  check: svg`<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16 9"/>`,
  signal: svg`<path d="M4 20v-3m5 3v-6m5 6V9m5 11V4"/>`,
  sensor: svg`<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M10 2v4m4-4v4m-4 12v4m4-4v4m-4-10h4"/>`,
  map: svg`<path d="M19 9c0 5-7 11-7 11S5 14 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2"/>`,
  wind: svg`<path d="M2 8h13a2.5 2.5 0 1 0-2.5-2.5M2 12h17a2.5 2.5 0 1 1-2.5 2.5M2 16h8a2.5 2.5 0 1 1-2.5 2.5"/>`,
  heart: svg`<path d="M20.7 5.7a4.9 4.9 0 0 0-7 0L12 7.4l-1.7-1.7a4.9 4.9 0 0 0-7 7l1.7 1.7L12 21l7-6.6 1.7-1.7a4.9 4.9 0 0 0 0-7Z"/><path d="M6 12h3l1.5-2.5 2 4 1.5-1.5h4"/>`,
  thermometer: svg`<path d="M9 14V5a3 3 0 0 1 6 0v9a4 4 0 1 1-6 0Zm3-5v7"/><circle cx="12" cy="17" r="1"/>`,
  clock: svg`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  volume: svg`<path d="M3 9h4l5-4v14l-5-4H3Zm12 0a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>`,
  chevron: svg`<path d="m9 6 6 6-6 6"/>`,
  simple: svg`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10m-10 4h7m-7 3h4"/>`,
  book: svg`<path d="M12 6v14M3 5a10 10 0 0 1 9 1 10 10 0 0 1 9-1v13a10 10 0 0 0-9 2 10 10 0 0 0-9-2Z"/>`,
  calendar: svg`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 5h4m3 0h3"/>`,
  info: svg`<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>`,
  refresh: svg`<path d="M3 11a9 9 0 0 1 15-6l3 3m0-5v5h-5m5 5a9 9 0 0 1-15 6l-3-3m0 5v-5h5"/>`,
};

export type Icon = keyof typeof paths;

export function icon(name: Icon, size = 18) {
  return html`<svg viewBox="0 0 24 24" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
