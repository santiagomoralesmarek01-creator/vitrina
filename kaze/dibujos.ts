// Dibujos de cada pieza vistos desde arriba, como SVG en texto (viewBox -20 -20 40 40).
import type { Dibujo } from './combinado'

const ARROZ = '#fbf8f1'
const NORI = '#1f2a23'
const SALMON = '#ef7d4f'
const PALTA = '#8fb35a'
const QUESO = '#fffaf0'

/** Puntos repartidos sobre un anillo: sésamo, panko, ají. */
function puntos(r: number, n: number, color: string, tam = 0.9, giro = 0): string {
  let s = ''
  for (let i = 0; i < n; i++) {
    const a = giro + (i / n) * Math.PI * 2 + (i % 2) * 0.3
    const d = r - (i % 3) * 1.6
    s += `<circle cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d).toFixed(1)}" r="${tam}" fill="${color}"/>`
  }
  return s
}

const vetas = (color: string) =>
  `<g stroke="${color}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".75"><path d="M-9 -6c2 4 2 8 0 12"/><path d="M-3 -7c2 4 2 10 0 14"/><path d="M3 -7c2 4 2 10 0 14"/><path d="M9 -6c2 4 2 8 0 12"/></g>`

const centro = `<circle r="3.4" cx="-2" cy="-1.5" fill="${SALMON}"/><circle r="2.6" cx="2.6" cy="1" fill="${QUESO}"/><circle r="2.2" cx="-1" cy="3" fill="${PALTA}"/>`

const DIBUJOS: Record<Dibujo, (color: string) => string> = {
  nigiri: (c) =>
    `<g transform="rotate(-18)"><ellipse rx="15" ry="9.5" fill="${ARROZ}" stroke="#e2d9c6"/><path d="M-16 -1c3-7 13-10 19-10 8 0 14 4 14 9 0 5-6 8-14 8-8 0-16-1-19-4z" fill="${c}"/>${
      c === SALMON || c === '#f08a5d' ? vetas('#fde4d6') : `<path d="M-14 3c8 3 18 3 26-2" stroke="#e9a796" stroke-width="1.3" fill="none"/>`
    }</g>`,
  sashimi: (c) =>
    `<path d="M-14 8c4-12 14-18 26-16-6 6-14 14-26 16z" fill="#4f7a3a"/><g transform="rotate(-25)"><rect x="-12" y="-9" width="22" height="8" rx="3" fill="${c}"/><rect x="-10" y="-2" width="22" height="8" rx="3" fill="${c}" stroke="#fbe2d3" stroke-width=".8"/><rect x="-8" y="5" width="22" height="8" rx="3" fill="${c}" stroke="#fbe2d3" stroke-width=".8"/>${vetas('#fde4d6')}</g>`,
  uramaki: () =>
    `<circle r="15" fill="${ARROZ}" stroke="#e2d9c6"/>${puntos(12.5, 14, '#c9b38c', 0.9)}${puntos(10, 8, '#2a2622', 0.7, 0.5)}<circle r="7.5" fill="${NORI}"/><circle r="6.2" fill="${ARROZ}"/>${centro}`,
  geisha: (c) =>
    `<circle r="15" fill="${c}"/><g stroke="#fde4d6" stroke-width="1.4" fill="none" opacity=".7"><path d="M-12 -6a14 14 0 0 1 8-8"/><path d="M9 -11a14 14 0 0 1 5 8"/><path d="M12 7a14 14 0 0 1-7 7"/><path d="M-8 12a14 14 0 0 1-6-6"/></g><circle r="10" fill="${ARROZ}"/><circle r="5" fill="${QUESO}" stroke="#eadfc8"/><circle r="2.6" cx="1" cy="1" fill="${PALTA}"/>`,
  hot: (c) =>
    `<circle r="15" fill="${c}"/>${puntos(13, 18, '#a8692a', 1.2)}${puntos(11, 10, '#e2b06a', 1)}<circle r="8" fill="${NORI}"/><circle r="6.6" fill="${ARROZ}"/>${centro}<path d="M-13 -4c6 4 12-6 18 0s6 6 8 4" stroke="#4a2414" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  acevichado: (c) =>
    `<circle r="15" fill="${ARROZ}" stroke="#e2d9c6"/><circle r="7.5" fill="${NORI}"/><path d="M-12 -2c-1-8 8-13 14-11 8 2 12 8 10 14-2 7-10 10-16 7-5-2-8-5-8-10z" fill="${SALMON}"/><path d="M-9 1c4-4 10-5 16-2" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>${puntos(5, 6, '#c23b22', 0.9, 1)}<path d="M5 -9l4-5M7 -8l5-3" stroke="#5f8f3a" stroke-width="1.4" stroke-linecap="round"/>`,
  hosomaki: (c) =>
    `<circle r="13" fill="${NORI}"/><circle r="10.5" fill="${ARROZ}"/>${puntos(8.5, 9, '#2a2622', 0.6)}<circle r="4.6" fill="${c}"/><circle r="2.4" fill="#c9e2a8"/>`,
}

export function dibujoPieza(dibujo: Dibujo, color: string, clase = ''): string {
  return `<svg class="${clase}" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">${DIBUJOS[dibujo](color)}</svg>`
}
